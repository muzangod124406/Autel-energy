import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db, pool } from "./db";
import { users } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { uploadToSupabase, BUCKETS } from "./supabase-storage";
import { generateAIResponse } from "./ai-agent";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import { z } from "zod";
import {
  buildWestpayPaymentUrl, verifyWestpaySignature, westpayTransfer,
  slugToWestpayCountry, buildMsisdn, WESTPAY_ENABLED,
  getCountryApiKeyStatus, westpayGetBalances,
} from "./westpay";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

const otpStore = new Map<string, { code: string; expires: number }>();

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function requireAuth(req: Request, res: Response, next: any) {
  if (!(req.session as any).userId) {
    return res.status(401).json({ message: "Non autorisé" });
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: any) {
  if (!(req.session as any).isAdmin) {
    return res.status(403).json({ message: "Accès refusé" });
  }
  next();
}

const INITIAL_COUNTRIES = [
  { name: "Cameroun",     slug: "cameroun",     flag: "🇨🇲", code: "+237", operators: ["Orange Money", "MTN Mobile Money"], isActive: true },
  { name: "Bénin",        slug: "benin",         flag: "🇧🇯", code: "+229", operators: ["Celtis", "Moov Money", "MTN", "Momo"], isActive: true },
  { name: "Burkina Faso", slug: "burkina_faso",  flag: "🇧🇫", code: "+226", operators: ["Orange Money", "Moov Money"], isActive: true },
];

function toSlug(name: string): string {
  return name.toLowerCase()
    .replace(/[àáâãäå]/g, "a").replace(/[è-ë]/g, "e").replace(/[ì-ï]/g, "i")
    .replace(/[ò-ö]/g, "o").replace(/[ù-ü]/g, "u").replace(/ç/g, "c").replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  const PgStore = connectPgSimple(session);
  app.use(
    session({
      store: new PgStore({ pool }),
      secret: process.env.SESSION_SECRET || "redbull-invest-secret-key-2024",
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
    })
  );

  // Seed countries if empty
  try {
    const existing = await storage.getCountries();
    if (existing.length === 0) {
      for (const c of INITIAL_COUNTRIES) await storage.createCountry(c);
    }
  } catch {}

  // Seed admin account if not exists, and fix password hash if needed
  try {
    const adminPhone = process.env.ADMIN_PHONE || "99935673";
    const adminPassword = process.env.ADMIN_PASSWORD || "AAbb11##";
    const existingAdmin = await storage.getUserByPhone(adminPhone);
    if (!existingAdmin) {
      // createUser hashes password internally — pass plain text
      await storage.createUser({
        phone: adminPhone,
        password: adminPassword,
        country: "cameroun",
        nickname: "Admin",
        referralCode: "ADMIN1",
        referredBy: null,
      });
      const newAdmin = await storage.getUserByPhone(adminPhone);
      if (newAdmin) {
        await storage.updateUser(newAdmin.id, { isAdmin: true, isPromoter: true });
      }
    } else {
      const updates: any = {};
      // Fix password: always force-update to known good hash directly in DB
      // updateUser hashes password internally — pass plain text
      const validHash = await bcrypt.compare(adminPassword, existingAdmin.password || "");
      if (!validHash) {
        // Bypass updateUser hashing by updating DB directly
        const newHash = await bcrypt.hash(adminPassword, 10);
        await db.update(users).set({ password: newHash }).where(eq(users.id, existingAdmin.id));
      }
      if (!existingAdmin.isAdmin) updates.isAdmin = true;
      if (!existingAdmin.isPromoter) updates.isPromoter = true;
      if (Object.keys(updates).length > 0) {
        await storage.updateUser(existingAdmin.id, updates);
      }
    }
  } catch {}

  // Auth routes
  app.post("/api/auth/send-otp", async (req: Request, res: Response) => {
    try {
      const { phone } = req.body;
      if (!phone) return res.status(400).json({ message: "Numéro requis" });
      const code = generateOTP();
      otpStore.set(phone, { code, expires: Date.now() + 10 * 60 * 1000 });
      res.json({ code });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/auth/set-transaction-password", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any).userId;
      const { transactionPassword, currentTransactionPassword, otp } = req.body;
      if (!transactionPassword) return res.status(400).json({ message: "Nouveau mot de passe requis" });
      const existing = await storage.getUser(userId);
      if (existing?.transactionPassword) {
        if (!currentTransactionPassword) return res.status(400).json({ message: "Mot de passe actuel requis" });
        const valid = await bcrypt.compare(currentTransactionPassword, existing.transactionPassword);
        if (!valid) return res.status(400).json({ message: "Mot de passe actuel incorrect" });
      } else {
        if (!otp) return res.status(400).json({ message: "Code OTP requis" });
        const stored = otpStore.get(existing!.phone);
        if (!stored || stored.code !== otp || stored.expires < Date.now()) {
          return res.status(400).json({ message: "Code OTP invalide ou expiré" });
        }
        otpStore.delete(existing!.phone);
      }
      const hashed = await bcrypt.hash(transactionPassword, 10);
      const user = await storage.updateUser(userId, { transactionPassword: hashed });
      res.json({ user: { ...user, password: undefined, transactionPassword: undefined } });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { phone, password, confirmPassword, country, inviteCode, nickname, otp } = req.body;
      if (!phone || !password || !country) return res.status(400).json({ message: "Champs requis manquants" });
      if (password.length < 6) return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères" });

      if (otp) {
        const stored = otpStore.get(phone);
        if (!stored || stored.code !== otp || stored.expires < Date.now()) {
          return res.status(400).json({ message: "Code OTP invalide ou expiré" });
        }
        otpStore.delete(phone);
      }

      const existing = await storage.getUserByPhone(phone);
      if (existing) return res.status(400).json({ message: "Ce numéro est déjà utilisé" });

      let referredBy: string | undefined;
      if (inviteCode) {
        const referrer = await storage.getUserByReferralCode(inviteCode);
        if (!referrer) return res.status(400).json({ message: "Code d'invitation invalide" });
        referredBy = referrer.id;
      }

      const referralCode = generateReferralCode();
      const user = await storage.createUser({ phone, password, country, nickname: nickname || null, referralCode, referredBy: referredBy || null });

      if (referredBy) {
        await storage.createReferral({ referrerId: referredBy, referredId: user.id, level: 1 });
        const referrer = await storage.getUser(referredBy);
        if (referrer?.referredBy) {
          await storage.createReferral({ referrerId: referrer.referredBy, referredId: user.id, level: 2 });
          const level2Referrer = await storage.getUser(referrer.referredBy);
          if (level2Referrer?.referredBy) {
            await storage.createReferral({ referrerId: level2Referrer.referredBy, referredId: user.id, level: 3 });
          }
        }
      }

      (req.session as any).userId = user.id;
      (req.session as any).isAdmin = user.isAdmin;
      res.json({ user: { ...user, password: undefined } });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { phone, password, country } = req.body;
      if (!phone || !password || !country) return res.status(400).json({ message: "Champs requis manquants" });

      const user = await storage.getUserByPhone(phone);
      if (!user) return res.status(400).json({ message: "Utilisateur non trouvé" });
      if (user.isBanned) return res.status(400).json({ message: "Votre compte est banni" });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(400).json({ message: "Mot de passe incorrect" });

      (req.session as any).userId = user.id;
      (req.session as any).isAdmin = user.isAdmin;
      res.json({ user: { ...user, password: undefined } });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Non autorisé" });
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ message: "Non autorisé" });
    res.json({ ...user, password: undefined });
  });

  // User routes
  app.get("/api/user/investments", requireAuth, async (req: Request, res: Response) => {
    const investments = await storage.getUserInvestments((req.session as any).userId);
    res.json(investments);
  });

  app.post("/api/user/invest", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

      const { planType, vipLevel, amount, dailyGain, duration, totalGain, productId } = req.body;
      if (user.depositBalance < amount) return res.status(400).json({ message: "Solde de recharge insuffisant" });

      // Activities require an active fixed plan
      if (planType === "activity") {
        const allInvestments = await storage.getUserInvestments(userId);
        const hasActiveFixed = allInvestments.some(i => i.status === "active" && i.planType === "fix");
        if (!hasActiveFixed) {
          return res.status(400).json({ message: "Vous devez d'abord acheter le plan fixe 120J pour accéder aux produits d'activité" });
        }
      }

      if (productId) {
        const product = await storage.getProduct(productId);
        if (!product) return res.status(404).json({ message: "Produit non trouvé" });
        if (!product.isActive) return res.status(400).json({ message: "Produit non disponible" });
        if (product.purchaseLimit > 0 && product.purchaseCount >= product.purchaseLimit) {
          return res.status(400).json({ message: "Limite d'achat atteinte pour ce produit" });
        }
        // Un utilisateur ne peut acheter qu'une seule activité par session de lancement
        const sessionStart = product.launchDate || product.createdAt;
        const allInvestments = await storage.getUserInvestments(userId);
        const boughtInSession = allInvestments.some(
          (i: any) => i.planType === "activity" && new Date(i.startDate) >= new Date(sessionStart)
        );
        if (boughtInSession) {
          return res.status(400).json({ message: "Vous avez déjà acheté une activité dans ce lancement. Attendez le prochain lancement pour en acheter une nouvelle." });
        }
        await storage.incrementProductPurchaseCount(productId);
      }

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + duration);

      const investment = await storage.createInvestment({
        userId, planType, vipLevel, amount, dailyGain, duration, totalGain, endDate, productId: productId || null
      });

      // Débiter le dépôt et donner +1 ticket spin à l'investisseur (atomique)
      await storage.updateUser(userId, { depositBalance: user.depositBalance - amount });
      await storage.addSpinTicket(userId, 1);

      // Vérifier si c'est le premier plan fixe du filleul
      const allUserInvestments = await storage.getUserInvestments(userId);
      const previousFixInvestments = allUserInvestments.filter(
        i => i.planType === "fix" && i.id !== investment.id
      );
      const isFirstFixInvestment = planType === "fix" && previousFixInvestments.length === 0;

      // Sur le premier plan fixe : ticket spin + commissions au parrain
      if (user.referredBy && isFirstFixInvestment) {
        await storage.addSpinTicket(user.referredBy, 1);
        const cfg = await storage.getSettings();
        const rate1 = (cfg.referralCommission1 ?? 20) / 100;
        const rate2 = (cfg.referralCommission2 ?? 3) / 100;
        const rate3 = (cfg.referralCommission3 ?? 2) / 100;

        const level1Referrer = await storage.getUser(user.referredBy);
        if (level1Referrer) {
          const commission1 = Math.floor(amount * rate1);
          await storage.addToUserBalance(level1Referrer.id, commission1, commission1);

          if (level1Referrer.referredBy) {
            const level2Referrer = await storage.getUser(level1Referrer.referredBy);
            if (level2Referrer) {
              const commission2 = Math.floor(amount * rate2);
              await storage.addToUserBalance(level2Referrer.id, commission2, commission2);

              if (level2Referrer.referredBy) {
                const level3Referrer = await storage.getUser(level2Referrer.referredBy);
                if (level3Referrer) {
                  const commission3 = Math.floor(amount * rate3);
                  await storage.addToUserBalance(level3Referrer.id, commission3, commission3);
                }
              }
            }
          }
        }
      }

      res.json(investment);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Transactions
  app.get("/api/user/transactions", requireAuth, async (req: Request, res: Response) => {
    const type = req.query.type as string | undefined;
    const txs = await storage.getUserTransactions((req.session as any).userId, type);
    res.json(txs);
  });

  app.post("/api/user/deposit", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any).userId;
      const { amount, country, paymentMethod, phoneNumber, accountName, channelId, channelName } = req.body;
      if (!amount || amount < 100) return res.status(400).json({ message: "Montant minimum: 100 FCFA" });

      const tx = await storage.createTransaction(userId, {
        type: "deposit", amount, country, paymentMethod, phoneNumber, accountName, status: "pending", channelId, channelName
      });
      res.json(tx);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // WestPay (RobotPay) — initiate deposit redirect
  app.post("/api/user/deposit/westpay/init", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!WESTPAY_ENABLED) return res.status(503).json({ message: "WestPay non configuré" });
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

      const { amount, channelId, channelName } = req.body;
      if (!amount || amount < 100) return res.status(400).json({ message: "Montant invalide" });

      const tx = await storage.createTransaction(userId, {
        type: "deposit",
        amount,
        country: user.country || "",
        paymentMethod: "WestPay",
        phoneNumber: user.phone,
        status: "pending",
        channelId: channelId || null,
        channelName: channelName || "WestPay",
      });

      const origin = `${req.protocol}://${req.get("host")}`;
      const redirectUrl = `${origin}/deposit-return?txId=${tx.id}`;
      const payUrl = buildWestpayPaymentUrl({
        amount,
        country: slugToWestpayCountry(user.country || ""),
        redirectUrl,
      });

      res.json({ txId: tx.id, payUrl });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // WestPay — store external ref from redirect
  app.post("/api/user/deposit/westpay/confirm/:txId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { txId } = req.params;
      const { externalRef } = req.body;
      if (externalRef) {
        await storage.updateTransaction(txId, { externalRef } as any);
      }
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/user/withdraw", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
      if (user.withdrawBlocked) return res.status(400).json({ message: "Vos retraits sont bloqués" });

      // Check require invite to withdraw
      if (user.requireInviteToWithdraw) {
        const level1Refs = await storage.getUserReferrals(userId, 1);
        const hasInvestingRef = await Promise.all(
          level1Refs.map(async ref => {
            if (!ref.referred) return false;
            const invs = await storage.getUserInvestments(ref.referred.id);
            return invs.some(i => i.status === "active");
          })
        );
        if (!hasInvestingRef.some(Boolean)) {
          return res.status(400).json({ message: "Vous devez parrainer une personne qui a investi avant de pouvoir retirer" });
        }
      }

      const bankCard = await storage.getBankCard(userId);
      if (!bankCard) return res.status(400).json({ message: "Vous devez d'abord enregistrer une carte bancaire" });

      const activeInvestments = await storage.getUserInvestments(userId);
      const hasFixedPlan = activeInvestments.some(i => i.status === "active" && i.planType === "fix");
      if (!hasFixedPlan) return res.status(400).json({ message: "Vous devez avoir acheté un plan Fixé 120J pour pouvoir retirer" });

      const cfg = await storage.getSettings();
      const { amount, country, paymentMethod, phoneNumber, accountName, transactionPassword } = req.body;
      const minAmount = cfg.withdrawMinAmount || 1000;
      if (!amount || amount < minAmount) return res.status(400).json({ message: `Retrait minimum: ${minAmount.toLocaleString()} FCFA` });
      if (amount > 4500000) return res.status(400).json({ message: "Retrait maximum: 4 500 000 FCFA" });
      if (user.withdrawBalance < amount) return res.status(400).json({ message: "Solde de retrait insuffisant" });
      if (user.transactionPassword && transactionPassword) {
        const valid = await bcrypt.compare(transactionPassword, user.transactionPassword);
        if (!valid) return res.status(400).json({ message: "Mot de passe de transaction incorrect" });
      }

      // Heure locale Afrique de l'Ouest (WAT = UTC+1)
      const now = new Date();
      const hour = parseInt(now.toLocaleString("fr-FR", { timeZone: "Africa/Douala", hour: "numeric", hour12: false }), 10);
      const startHour = cfg.withdrawStartHour ?? 10;
      const endHour = cfg.withdrawEndHour ?? 15;
      if (hour < startHour || hour >= endHour) return res.status(400).json({ message: `Horaire de retrait: ${startHour}h à ${endHour}h` });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTxs = await storage.getUserTransactions(userId, "withdrawal");
      const todayWithdrawals = todayTxs.filter(t => new Date(t.createdAt) >= today);
      if (todayWithdrawals.length >= 2) return res.status(400).json({ message: "2 retraits par jour maximum" });

      const feePercent = cfg.withdrawFeePercent ?? 15;
      const fees = Math.floor(amount * (feePercent / 100));
      const netAmount = amount - fees;

      const tx = await storage.createTransaction(userId, {
        type: "withdrawal", amount, country, paymentMethod, phoneNumber, accountName, fees, netAmount, status: "pending"
      });

      await storage.updateUser(userId, { withdrawBalance: user.withdrawBalance - amount });
      res.json(tx);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Bank card
  app.get("/api/user/bank-card", requireAuth, async (req: Request, res: Response) => {
    const card = await storage.getBankCard((req.session as any).userId);
    res.json(card || null);
  });

  app.post("/api/user/bank-card", requireAuth, async (req: Request, res: Response) => {
    try {
      const card = await storage.createBankCard((req.session as any).userId, req.body);
      res.json(card);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Referrals
  app.get("/api/user/referrals", requireAuth, async (req: Request, res: Response) => {
    const userId = (req.session as any).userId;
    const [rawL1, rawL2, rawL3, user] = await Promise.all([
      storage.getUserReferrals(userId, 1),
      storage.getUserReferrals(userId, 2),
      storage.getUserReferrals(userId, 3),
      storage.getUser(userId),
    ]);
    const enrichWithInvestments = async (refs: any[]) => {
      return Promise.all(refs.map(async (ref) => {
        const investments = await storage.getUserInvestments(ref.referredId);
        const totalInvested = investments.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
        return { ...ref, totalInvested };
      }));
    };
    const [level1, level2, level3] = await Promise.all([
      enrichWithInvestments(rawL1),
      enrichWithInvestments(rawL2),
      enrichWithInvestments(rawL3),
    ]);
    res.json({ level1, level2, level3, commissionTotal: user?.commissionBalance || 0 });
  });

  // Daily bonus (s'identifier)
  app.post("/api/user/daily-bonus", requireAuth, async (req: Request, res: Response) => {
    const userId = (req.session as any).userId;
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    const now = new Date();
    if (user.lastDailyBonus) {
      const last = new Date(user.lastDailyBonus);
      const diffMs = now.getTime() - last.getTime();
      if (diffMs < 24 * 60 * 60 * 1000) {
        return res.status(400).json({ message: "Bonus disponible dans moins de 24h" });
      }
    }

    const updated = await storage.updateUser(userId, {
      withdrawBalance: user.withdrawBalance + 50,
      lastDailyBonus: now,
    });
    res.json({ success: true, withdrawBalance: updated?.withdrawBalance });
  });

  // Spin game
  app.post("/api/user/spin", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
      if (user.spinTickets <= 0) return res.status(400).json({ message: "Pas de tours disponibles" });

      const prizes =   [50,   100,  200,  400,  600,  1000];
      const weights =  [0.30, 0.22, 0.18, 0.12, 0.08, 0.10];
      const r = Math.random();
      let cumulative = 0;
      let amount = 50;
      for (let i = 0; i < prizes.length; i++) {
        cumulative += weights[i];
        if (r <= cumulative) { amount = prizes[i]; break; }
      }

      await storage.updateUser(userId, {
        spinTickets: user.spinTickets - 1,
        withdrawBalance: user.withdrawBalance + amount
      });
      await storage.addSpinResult(userId, amount);

      res.json({ amount, remainingTickets: user.spinTickets - 1 });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/user/spin-tickets", requireAuth, async (req: Request, res: Response) => {
    const user = await storage.getUser((req.session as any).userId);
    res.json({ tickets: user?.spinTickets || 0 });
  });

  app.get("/api/spin-history", async (req: Request, res: Response) => {
    try {
      const results = await storage.getRecentSpinResults(30);
      const masked = results.map(r => ({
        id: r.id,
        amount: r.amount,
        createdAt: r.createdAt,
        phone: r.user?.phone
          ? r.user.phone.slice(0, 2) + "****" + r.user.phone.slice(-4)
          : "****"
      }));
      res.json(masked);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Tickets/Blog
  app.get("/api/tickets", async (req: Request, res: Response) => {
    const tix = await storage.getAllTickets("approved");
    res.json(tix);
  });

  app.post("/api/user/tickets", requireAuth, upload.array("images", 2), async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any).userId;

      // Condition 1 : au moins un retrait approuvé
      const allTxs = await storage.getUserTransactions(userId, "withdrawal");
      const hasApprovedWithdrawal = allTxs.some(t => t.status === "approved");
      if (!hasApprovedWithdrawal) {
        return res.status(400).json({ message: "Vous devez avoir au moins un retrait approuvé avant de publier." });
      }

      // Condition 2 : une seule publication par jour
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const userTickets = await storage.getUserTickets(userId);
      const publishedToday = userTickets.some(t => new Date(t.createdAt) >= todayStart);
      if (publishedToday) {
        return res.status(400).json({ message: "Vous avez déjà publié aujourd'hui. Revenez demain." });
      }

      // Condition 3 : au moins 2 images requises
      const files = (req.files as Express.Multer.File[]) || [];
      if (files.length < 2) {
        return res.status(400).json({ message: "Veuillez importer exactement 2 captures d'écran." });
      }

      const ext0 = path.extname(files[0].originalname) || ".jpg";
      const ext1 = path.extname(files[1].originalname) || ".jpg";
      const name0 = `${userId}/${Date.now()}_1${ext0}`;
      const name1 = `${userId}/${Date.now()}_2${ext1}`;

      const [imageUrl, imageUrl2] = await Promise.all([
        uploadToSupabase(BUCKETS.BLOG, name0, files[0].buffer, files[0].mimetype),
        uploadToSupabase(BUCKETS.BLOG, name1, files[1].buffer, files[1].mimetype),
      ]);

      const ticket = await storage.createTicket(userId, {
        imageUrl, imageUrl2, description: req.body.description
      });
      res.json(ticket);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Settings
  app.get("/api/settings", async (req: Request, res: Response) => {
    const s = await storage.getSettings();
    res.json(s);
  });

  // User settings update
  app.put("/api/user/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any).userId;
      const { phone, password, newPassword } = req.body;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

      const updates: any = {};
      if (phone) updates.phone = phone;
      if (newPassword) {
        if (!password) return res.status(400).json({ message: "Mot de passe actuel requis" });
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ message: "Mot de passe actuel incorrect" });
        updates.password = newPassword;
      }

      const updated = await storage.updateUser(userId, updates);
      res.json({ ...updated, password: undefined });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Payment callback
  app.get("/api/payment/callback", async (req: Request, res: Response) => {
    try {
      const { status, transactionId, amount } = req.query;
      res.redirect(`/?paymentStatus=${status}&transactionId=${transactionId}&amount=${amount}`);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Public: payment channels
  app.get("/api/channels", async (req: Request, res: Response) => {
    const channels = await storage.getPaymentChannels(true);
    res.json(channels);
  });

  // Public: products
  app.get("/api/products", async (req: Request, res: Response) => {
    const prods = await storage.getProducts(true);
    res.json(prods);
  });

  // ============ ADMIN ROUTES ============
  app.get("/api/admin/stats", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const cfg = await storage.getSettings();
      const fromDate = req.query.from
        ? new Date(req.query.from as string)
        : cfg.statsResetDate
          ? new Date(cfg.statsResetDate as unknown as string)
          : undefined;
      const [
        totalUsers, todayRegistrations, todayDeposits, todayWithdrawals,
        totalDeposits, totalWithdrawals, activeInvestments, todayDepositors, todayWithdrawers,
        usersWithProducts, pendingDeposits, pendingWithdrawals, todayDepositsAmount,
        todayWithdrawalsAmount, totalPlatformBalance, totalDistributedGains,
        totalCommissions, activeProductsCount
      ] = await Promise.all([
        storage.getUserCount(fromDate), storage.getTodayRegistrations(fromDate),
        storage.getTodayDeposits(), storage.getTodayWithdrawals(),
        storage.getTotalDeposits(fromDate), storage.getTotalWithdrawalsAmount(fromDate),
        storage.getActiveInvestmentCount(), storage.getTodayDepositorsCount(),
        storage.getTodayWithdrawersCount(), storage.getUsersWithProductsCount(),
        storage.getPendingDepositsStats(), storage.getPendingWithdrawalsStats(),
        storage.getTodayDepositsAmount(fromDate), storage.getTodayWithdrawalsAmount(fromDate),
        storage.getTotalPlatformBalance(), storage.getTotalDistributedGains(),
        storage.getTotalCommissions(), storage.getActiveProductsCount()
      ]);
      res.json({
        totalUsers, todayRegistrations, todayDeposits, todayWithdrawals,
        totalDeposits, totalWithdrawals, activeInvestments, todayDepositors, todayWithdrawers,
        usersWithProducts, pendingDeposits, pendingWithdrawals, todayDepositsAmount,
        todayWithdrawalsAmount, totalPlatformBalance, totalDistributedGains,
        totalCommissions, activeProductsCount,
        statsFromDate: fromDate ? fromDate.toISOString() : null
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/team-overview", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const data = await storage.getUserTeamOverview();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/users", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    const users = await storage.getAllUsers();
    res.json(users.map(u => ({ ...u, password: undefined })));
  });

  app.put("/api/admin/users/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const updates = { ...req.body };
      if (updates.password) updates.password = await bcrypt.hash(updates.password, 10);
      if (updates.transactionPassword) updates.transactionPassword = await bcrypt.hash(updates.transactionPassword, 10);
      const user = await storage.updateUser(req.params.id, updates);
      res.json({ ...user, password: undefined, transactionPassword: undefined });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/users/:id/credit-commission", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { amount } = req.body;
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({ message: "Montant invalide" });
      }
      const credit = Math.floor(Number(amount));
      await storage.addToUserBalance(req.params.id, credit, credit);
      const updated = await storage.getUser(req.params.id);
      res.json({ success: true, commissionBalance: updated?.commissionBalance, withdrawBalance: updated?.withdrawBalance });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/users/:id/credit-spin", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { count } = req.body;
      if (!count || isNaN(Number(count)) || Number(count) <= 0) {
        return res.status(400).json({ message: "Nombre invalide" });
      }
      const nb = Math.floor(Number(count));
      await storage.addSpinTicket(req.params.id, nb);
      const updated = await storage.getUser(req.params.id);
      res.json({ success: true, spinTickets: updated?.spinTickets });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/users/:id/referrals", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    const level1 = await storage.getUserReferrals(req.params.id, 1);
    const level2 = await storage.getUserReferrals(req.params.id, 2);
    const level3 = await storage.getUserReferrals(req.params.id, 3);
    res.json({ level1, level2, level3 });
  });

  app.get("/api/admin/users/:id/investments", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    const invs = await storage.getUserInvestments(req.params.id);
    res.json(invs);
  });

  app.post("/api/admin/users/:id/assign-product", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { planType, vipLevel, amount, dailyGain, duration, totalGain } = req.body;
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + duration);
      const investment = await storage.createInvestment({
        userId: req.params.id, planType, vipLevel, amount, dailyGain, duration, totalGain, endDate, assignedByAdmin: true
      });
      res.json(investment);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/investments/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deleteInvestment(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/transactions/:type", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const txs = await storage.getPendingTransactions(req.params.type, search, status);
    res.json(txs);
  });

  app.put("/api/admin/transactions/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const tx = await storage.updateTransaction(req.params.id, { status });

      // Dépôt approuvé → créditer le solde dépôt
      if (tx && status === "approved" && tx.type === "deposit") {
        const user = await storage.getUser(tx.userId);
        if (user) {
          await storage.updateUser(user.id, {
            depositBalance: user.depositBalance + tx.amount
          });
        }
      }

      // Retrait rejeté → rembourser le solde retrait (qui avait été débité à la demande)
      if (tx && status === "rejected" && tx.type === "withdrawal") {
        await db.update(users).set({
          withdrawBalance: sql`${users.withdrawBalance} + ${tx.amount}`,
        }).where(eq(users.id, tx.userId));
      }

      if (tx && status === "approved" && tx.type === "withdrawal" && WESTPAY_ENABLED) {
        try {
          const user = await storage.getUser(tx.userId);
          if (user && tx.phoneNumber && tx.country) {
            const countrySlug = user.country || tx.country;
            const msisdn = buildMsisdn(tx.phoneNumber, countrySlug);
            const nameParts = (tx.accountName || user.firstName || "Client").split(" ");
            await westpayTransfer({
              country: slugToWestpayCountry(countrySlug),
              countrySlug,
              msisdn,
              amount: tx.netAmount || tx.amount,
              firstName: nameParts[0] || "Client",
              lastName: nameParts.slice(1).join(" ") || user.lastName || ".",
            });
          }
        } catch (wpErr: any) {
          console.error("[WestPay transfer error]", wpErr.message);
        }
      }
      res.json(tx);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/tickets", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    const tix = await storage.getAllTickets("pending");
    res.json(tix);
  });

  app.put("/api/admin/tickets/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { status, bonus } = req.body;
      const ticket = await storage.updateTicket(req.params.id, { status, bonus });
      if (ticket && status === "approved" && bonus && bonus > 0) {
        const user = await storage.getUser(ticket.userId);
        if (user) {
          await storage.updateUser(user.id, { depositBalance: user.depositBalance + bonus });
        }
      }
      res.json(ticket);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.put("/api/admin/settings", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const s = await storage.updateSettings(req.body);
      res.json(s);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Admin: Payment Channels
  app.get("/api/admin/channels", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    const channels = await storage.getPaymentChannels(false);
    res.json(channels);
  });

  app.post("/api/admin/channels", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const channel = await storage.createPaymentChannel(req.body);
      res.json(channel);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.put("/api/admin/channels/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const channel = await storage.updatePaymentChannel(req.params.id, req.body);
      res.json(channel);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/channels/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deletePaymentChannel(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Admin: Products
  app.get("/api/admin/products", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    const prods = await storage.getProducts(false);
    res.json(prods);
  });

  app.post("/api/admin/products", requireAuth, requireAdmin, upload.single("image"), async (req: Request, res: Response) => {
    try {
      let imageUrl = req.body.imageUrl || null;
      if (req.file) {
        const ext = path.extname(req.file.originalname) || ".jpg";
        imageUrl = await uploadToSupabase(BUCKETS.FILES, `products/${Date.now()}${ext}`, req.file.buffer, req.file.mimetype);
      }
      const data = {
        name: req.body.name,
        imageUrl,
        price: parseInt(req.body.price),
        dailyGain: parseInt(req.body.dailyGain),
        totalGain: parseInt(req.body.totalGain),
        cycleDays: parseInt(req.body.cycleDays),
        purchaseLimit: parseInt(req.body.purchaseLimit) || 0,
        isActive: req.body.isActive !== "false",
        launchDate: req.body.launchDate ? new Date(req.body.launchDate) : null,
      };
      const product = await storage.createProduct(data);
      res.json(product);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.put("/api/admin/products/:id", requireAuth, requireAdmin, upload.single("image"), async (req: Request, res: Response) => {
    try {
      const updates: any = { ...req.body };
      if (req.file) {
        const ext = path.extname(req.file.originalname) || ".jpg";
        updates.imageUrl = await uploadToSupabase(BUCKETS.FILES, `products/${Date.now()}${ext}`, req.file.buffer, req.file.mimetype);
      }
      if (updates.price) updates.price = parseInt(updates.price);
      if (updates.dailyGain) updates.dailyGain = parseInt(updates.dailyGain);
      if (updates.totalGain) updates.totalGain = parseInt(updates.totalGain);
      if (updates.cycleDays) updates.cycleDays = parseInt(updates.cycleDays);
      if (updates.purchaseLimit) updates.purchaseLimit = parseInt(updates.purchaseLimit);
      if (updates.launchDate) updates.launchDate = new Date(updates.launchDate);
      if (typeof updates.isActive === "string") updates.isActive = updates.isActive !== "false";
      const product = await storage.updateProduct(req.params.id, updates);
      res.json(product);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/products/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Gift Codes — Admin CRUD
  app.get("/api/admin/gift-codes", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const codes = await storage.getAllGiftCodes();
      res.json(codes);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/gift-codes", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { code, recipientPhone, amount, expiresAt } = req.body;
      if (!code || !amount || !expiresAt) return res.status(400).json({ message: "Code, montant et date d'expiration sont requis" });
      const cleanRecipient = (recipientPhone || "").toString().trim();
      const finalRecipient = cleanRecipient.length >= 6 ? cleanRecipient : null;
      const gc = await storage.createGiftCode({ code, recipientPhone: finalRecipient, amount, expiresAt: new Date(expiresAt) });
      res.json(gc);
    } catch (e: any) {
      if (e.message?.includes("unique")) return res.status(400).json({ message: "Ce code existe déjà" });
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/gift-codes/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deleteGiftCode(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Gift Code — User Redeem
  app.post("/api/user/redeem-gift-code", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

      const { code } = req.body;
      if (!code) return res.status(400).json({ message: "Code requis" });

      const gc = await storage.getGiftCodeByCode(code);
      if (!gc) return res.status(404).json({ message: "Code cadeau invalide" });
      if (gc.isUsed) return res.status(400).json({ message: "Ce code a déjà été utilisé" });
      if (new Date(gc.expiresAt) < new Date()) return res.status(400).json({ message: "Ce code a expiré" });
      if (gc.recipientPhone && gc.recipientPhone !== user.phone) return res.status(400).json({ message: "Ce code ne vous est pas destiné" });

      await storage.redeemGiftCode(gc.id, userId);
      await storage.updateUser(userId, { withdrawBalance: user.withdrawBalance + gc.amount });
      res.json({ success: true, amount: gc.amount });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Stats Reset
  app.post("/api/admin/reset-stats", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      await storage.updateSettings({ statsResetDate: new Date() });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Seed admin
  app.post("/api/admin/seed", async (req: Request, res: Response) => {
    try {
      const existing = await storage.getUserByPhone("99935673");
      if (existing) return res.json({ message: "Admin exists" });
      const admin = await storage.createUser({
        phone: "99935673",
        password: "AAbb11##",
        country: "cameroun",
        referralCode: "ADMIN1",
        referredBy: null,
      });
      await storage.updateUser(admin.id, { isAdmin: true });
      res.json({ message: "Admin created" });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/seed-products", async (req: Request, res: Response) => {
    const autelProducts = [
      { name: "Autel Energy S1", price: 2500,   dailyGain: 500,    totalGain: 60000,    cycleDays: 120, purchaseLimit: 0, isActive: true },
      { name: "Autel Energy S2", price: 5000,   dailyGain: 1100,   totalGain: 132000,   cycleDays: 120, purchaseLimit: 0, isActive: true },
      { name: "Autel Energy S3", price: 10000,  dailyGain: 2500,   totalGain: 300000,   cycleDays: 120, purchaseLimit: 0, isActive: true },
      { name: "Autel Energy S4", price: 25000,  dailyGain: 6500,   totalGain: 780000,   cycleDays: 120, purchaseLimit: 0, isActive: true },
      { name: "Autel Energy S5", price: 50000,  dailyGain: 14000,  totalGain: 1680000,  cycleDays: 120, purchaseLimit: 0, isActive: true },
      { name: "Autel Energy S6", price: 100000, dailyGain: 30000,  totalGain: 3600000,  cycleDays: 120, purchaseLimit: 0, isActive: true },
      { name: "Autel Energy S7", price: 250000, dailyGain: 80000,  totalGain: 9600000,  cycleDays: 120, purchaseLimit: 0, isActive: true },
      { name: "Autel Energy S8", price: 500000, dailyGain: 170000, totalGain: 20400000, cycleDays: 120, purchaseLimit: 0, isActive: true },
      { name: "Autel Energy S9", price: 900000, dailyGain: 320000, totalGain: 38400000, cycleDays: 120, purchaseLimit: 0, isActive: true },
    ];
    try {
      const existing = await storage.getProducts(false);
      const existingNames = new Set(existing.map((p: any) => p.name));
      const toInsert = autelProducts.filter(p => !existingNames.has(p.name));
      for (const p of toInsert) {
        await storage.createProduct(p as any);
      }
      res.json({ inserted: toInsert.length, skipped: autelProducts.length - toInsert.length });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Countries routes (public - active only)
  app.get("/api/countries", async (req: Request, res: Response) => {
    try {
      const list = await storage.getCountries(true);
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Admin countries routes
  app.get("/api/admin/countries", requireAdmin, async (req: Request, res: Response) => {
    try {
      const list = await storage.getCountries(false);
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/countries", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { name, flag, code, operators, isActive } = req.body;
      if (!name || !code) return res.status(400).json({ message: "Nom et indicatif téléphonique requis" });
      const ops = Array.isArray(operators) ? operators : (operators || "").split(",").map((o: string) => o.trim()).filter(Boolean);
      const slug = toSlug(name.trim());
      const c = await storage.createCountry({ name: name.trim(), slug, flag: (flag || "").trim(), code: code.trim(), operators: ops, isActive: isActive !== false });
      res.json(c);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/countries/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, flag, code, operators, isActive } = req.body;
      const update: any = {};
      if (name !== undefined) update.name = name.trim();
      if (flag !== undefined) update.flag = flag.trim();
      if (code !== undefined) update.code = code.trim();
      if (isActive !== undefined) update.isActive = isActive;
      if (operators !== undefined) {
        update.operators = Array.isArray(operators) ? operators : operators.split(",").map((o: string) => o.trim()).filter(Boolean);
      }
      const c = await storage.updateCountry(id, update);
      if (!c) return res.status(404).json({ message: "Pays introuvable" });
      res.json(c);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/countries/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deleteCountry(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // ─── WestPay Admin ───────────────────────────────────────────────────────
  app.get("/api/admin/westpay/status", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    res.json({
      enabled: WESTPAY_ENABLED,
      merchantSlug: process.env.WESTPAY_MERCHANT_SLUG || null,
      webhookSecretConfigured: !!process.env.WESTPAY_WEBHOOK_SECRET,
      countryApiKeys: getCountryApiKeyStatus(),
    });
  });

  app.get("/api/admin/westpay/balances", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      if (!WESTPAY_ENABLED) return res.status(503).json({ message: "WestPay non configuré" });
      const balances = await westpayGetBalances();
      res.json(balances);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // ─── WestPay Webhook (public) ────────────────────────────────────────────
  app.post("/api/webhook/westpay", async (req: Request, res: Response) => {
    try {
      const signature = req.headers["x-robotpay-signature"] as string || "";
      const rawBody = ((req as any).rawBody as Buffer)?.toString("utf8") || JSON.stringify(req.body);

      if (process.env.WESTPAY_WEBHOOK_SECRET) {
        if (!verifyWestpaySignature(rawBody, signature)) {
          return res.status(401).json({ message: "Signature invalide" });
        }
      }

      const payload = req.body as any;
      if (payload.event !== "payment.confirmed") {
        return res.json({ received: true });
      }

      const { txId: westpayTxId, amount, payer } = payload;

      // Try to find by externalRef first
      let tx: any = null;
      if (westpayTxId) {
        const allPending = await storage.getPendingTransactions("deposit", undefined, "pending");
        tx = allPending.find((t: any) => t.externalRef === westpayTxId);
        // Fallback: match by payer phone and amount
        if (!tx && payer && amount) {
          const phone = String(payer).replace(/^\+/, "").replace(/\D/g, "");
          tx = allPending.find((t: any) => {
            const txPhone = String(t.phoneNumber || "").replace(/\D/g, "");
            return txPhone.endsWith(phone.slice(-8)) && t.amount === amount;
          });
        }
      }

      if (!tx) {
        return res.json({ received: true, matched: false });
      }

      // Auto-approve and credit user
      await storage.updateTransaction(tx.id, { status: "approved", externalRef: westpayTxId } as any);
      const user = await storage.getUser(tx.userId);
      if (user) {
        await storage.updateUser(user.id, { depositBalance: user.depositBalance + tx.amount });
      }

      return res.json({ received: true, matched: true, txId: tx.id });
    } catch (e: any) {
      console.error("[Webhook WestPay]", e.message);
      res.status(500).json({ message: e.message });
    }
  });

  // ─── Chat Service Client ─────────────────────────────────────────────────
  app.get("/api/chat/messages", requireAuth, async (req: Request, res: Response) => {
    const userId = (req.session as any).userId;
    const msgs = await storage.getChatMessages(userId);
    await storage.markChatMessagesRead(userId, "admin");
    res.json(msgs);
  });

  app.post("/api/chat/messages", requireAuth, upload.single("image"), async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any).userId;
      let imageUrl: string | undefined;
      if (req.file) {
        const ext = path.extname(req.file.originalname) || ".jpg";
        imageUrl = await uploadToSupabase(BUCKETS.FILES, `chat/${userId}/${Date.now()}${ext}`, req.file.buffer, req.file.mimetype);
      }
      const content = req.body.content || undefined;
      if (!content && !imageUrl) return res.status(400).json({ message: "Message vide" });
      const msg = await storage.createChatMessage({ userId, senderType: "user", content, imageUrl });
      res.json(msg);

      // Réponse automatique IA (fire-and-forget, délai naturel de 1-2s)
      if (content) {
        const delay = 1000 + Math.floor(Math.random() * 1500);
        setTimeout(async () => {
          try {
            const aiReply = generateAIResponse(content);
            await storage.createChatMessage({ userId, senderType: "admin", content: aiReply });
          } catch (_) {}
        }, delay);
      }
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/chat/conversations", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    const convs = await storage.getAllChatConversations();
    res.json(convs);
  });

  app.get("/api/admin/chat/:userId/messages", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    const msgs = await storage.getChatMessages(req.params.userId);
    await storage.markChatMessagesRead(req.params.userId, "admin");
    res.json(msgs);
  });

  app.post("/api/admin/chat/:userId/messages", requireAuth, requireAdmin, upload.single("image"), async (req: Request, res: Response) => {
    try {
      let imageUrl: string | undefined;
      if (req.file) {
        const ext = path.extname(req.file.originalname) || ".jpg";
        imageUrl = await uploadToSupabase(BUCKETS.FILES, `chat/admin/${Date.now()}${ext}`, req.file.buffer, req.file.mimetype);
      }
      const content = req.body.content || undefined;
      if (!content && !imageUrl) return res.status(400).json({ message: "Message vide" });
      const msg = await storage.createChatMessage({ userId: req.params.userId, senderType: "admin", content, imageUrl });
      res.json(msg);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // ─── Job automatique : crédit des gains à la fin du cycle ───────────────
  async function processCompletedInvestments() {
    try {
      const expired = await storage.getExpiredActiveInvestments();
      for (const inv of expired) {
        const user = await storage.getUser(inv.userId);
        if (!user) continue;
        await storage.updateUser(user.id, {
          withdrawBalance: user.withdrawBalance + inv.totalGain,
          productRevenue: user.productRevenue + inv.totalGain,
        });
        await storage.completeInvestment(inv.id);
        await storage.createTransaction(user.id, {
          type: "gain",
          amount: inv.totalGain,
          status: "approved",
          description: `Gain fin de cycle — ${inv.planType === "fix" ? "Plan Fixe 120J" : "Activité"} — ${inv.duration} jours`,
        });
        console.log(`[Gains] Investissement ${inv.id} complété : +${inv.totalGain} FCFA crédités à l'utilisateur ${user.id}`);
      }
    } catch (e: any) {
      console.error("[Gains] Erreur traitement investissements:", e.message);
    }
  }

  // Lancer immédiatement au démarrage puis toutes les heures
  processCompletedInvestments();
  setInterval(processCompletedInvestments, 60 * 60 * 1000);

  return httpServer;
}
