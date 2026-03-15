import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(process.cwd(), "client", "public", "uploads");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname);
    }
  })
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

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "redbull-invest-secret-key-2024",
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
    })
  );

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
      const { phone, otp, transactionPassword } = req.body;
      if (!otp || !transactionPassword) return res.status(400).json({ message: "Champs requis manquants" });
      const stored = otpStore.get(phone);
      if (!stored || stored.code !== otp || stored.expires < Date.now()) {
        return res.status(400).json({ message: "Code OTP invalide ou expiré" });
      }
      otpStore.delete(phone);
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
      if (password !== confirmPassword) return res.status(400).json({ message: "Les mots de passe ne correspondent pas" });
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

      const { planType, vipLevel, amount, dailyGain, duration, totalGain } = req.body;
      if (user.balance < amount) return res.status(400).json({ message: "Solde insuffisant" });

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + duration);

      const investment = await storage.createInvestment({
        userId, planType, vipLevel, amount, dailyGain, duration, totalGain, endDate
      });

      await storage.updateUser(userId, { balance: user.balance - amount });

      // Give spin ticket for purchase
      await storage.updateUser(userId, { spinTickets: (user.spinTickets || 0) + 1, balance: user.balance - amount });

      // Handle referral commissions
      if (user.referredBy) {
        const level1Referrer = await storage.getUser(user.referredBy);
        if (level1Referrer) {
          const commission1 = Math.floor(amount * 0.30);
          await storage.updateUser(level1Referrer.id, {
            commissionBalance: level1Referrer.commissionBalance + commission1,
            balance: level1Referrer.balance + commission1
          });
        }
        if (level1Referrer?.referredBy) {
          const level2Referrer = await storage.getUser(level1Referrer.referredBy);
          if (level2Referrer) {
            const commission2 = Math.floor(amount * 0.03);
            await storage.updateUser(level2Referrer.id, {
              commissionBalance: level2Referrer.commissionBalance + commission2,
              balance: level2Referrer.balance + commission2
            });
          }
          if (level2Referrer?.referredBy) {
            const level3Referrer = await storage.getUser(level2Referrer.referredBy);
            if (level3Referrer) {
              const commission3 = Math.floor(amount * 0.02);
              await storage.updateUser(level3Referrer.id, {
                commissionBalance: level3Referrer.commissionBalance + commission3,
                balance: level3Referrer.balance + commission3
              });
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
      const { amount, country, paymentMethod, phoneNumber, accountName } = req.body;
      if (!amount || amount < 100) return res.status(400).json({ message: "Montant minimum: 100 FCFA" });

      const tx = await storage.createTransaction(userId, {
        type: "deposit", amount, country, paymentMethod, phoneNumber, accountName, status: "pending"
      });
      res.json(tx);
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

      const bankCard = await storage.getBankCard(userId);
      if (!bankCard) return res.status(400).json({ message: "Vous devez d'abord enregistrer une carte bancaire" });

      const activeInvestments = await storage.getUserInvestments(userId);
      const hasActive = activeInvestments.some(i => i.status === "active");
      if (!hasActive) return res.status(400).json({ message: "Vous devez avoir au moins un produit actif" });

      const { amount, country, paymentMethod, phoneNumber, accountName } = req.body;
      if (!amount || amount < 1000) return res.status(400).json({ message: "Retrait minimum: 1 000 FCFA" });
      if (user.withdrawBalance < amount) return res.status(400).json({ message: "Solde de retrait insuffisant" });

      const now = new Date();
      const hour = now.getHours();
      if (hour < 10 || hour > 15) return res.status(400).json({ message: "Horaire de retrait: 10h à 15h" });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTxs = await storage.getUserTransactions(userId, "withdrawal");
      const todayWithdrawal = todayTxs.find(t => new Date(t.createdAt) >= today);
      if (todayWithdrawal) return res.status(400).json({ message: "1 retrait par jour maximum" });

      const fees = Math.floor(amount * 0.10);
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
    const level1 = await storage.getUserReferrals(userId, 1);
    const level2 = await storage.getUserReferrals(userId, 2);
    const level3 = await storage.getUserReferrals(userId, 3);
    const user = await storage.getUser(userId);
    res.json({ level1, level2, level3, commissionTotal: user?.commissionBalance || 0 });
  });

  // Spin game
  app.post("/api/user/spin", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
      if (user.spinTickets <= 0) return res.status(400).json({ message: "Pas de tours disponibles" });

      // 80% chance of losing (0), max win 500
      const rand = Math.random();
      let amount = 0;
      if (rand > 0.80) {
        const prizes = [50, 100, 200, 300, 500];
        const weights = [0.40, 0.30, 0.15, 0.10, 0.05];
        const r2 = Math.random();
        let cumulative = 0;
        for (let i = 0; i < prizes.length; i++) {
          cumulative += weights[i];
          if (r2 <= cumulative) {
            amount = prizes[i];
            break;
          }
        }
      }

      await storage.updateUser(userId, {
        spinTickets: user.spinTickets - 1,
        balance: user.balance + amount
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

  // Tickets/Blog
  app.get("/api/tickets", async (req: Request, res: Response) => {
    const tix = await storage.getAllTickets("approved");
    res.json(tix);
  });

  app.post("/api/user/tickets", requireAuth, upload.single("image"), async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any).userId;
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
      const ticket = await storage.createTicket(userId, {
        imageUrl, description: req.body.description
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
      // Just redirect back to home with status
      res.redirect(`/?paymentStatus=${status}&transactionId=${transactionId}&amount=${amount}`);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // ============ ADMIN ROUTES ============
  app.get("/api/admin/stats", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    const totalUsers = await storage.getUserCount();
    const todayRegistrations = await storage.getTodayRegistrations();
    const todayDeposits = await storage.getTodayDeposits();
    const todayWithdrawals = await storage.getTodayWithdrawals();
    const totalDeposits = await storage.getTotalDeposits();
    const activeInvestments = await storage.getActiveInvestmentCount();
    res.json({ totalUsers, todayRegistrations, todayDeposits, todayWithdrawals, totalDeposits, activeInvestments });
  });

  app.get("/api/admin/users", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    const users = await storage.getAllUsers();
    res.json(users.map(u => ({ ...u, password: undefined })));
  });

  app.put("/api/admin/users/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      res.json({ ...user, password: undefined });
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
    const txs = await storage.getPendingTransactions(req.params.type);
    res.json(txs);
  });

  app.put("/api/admin/transactions/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const tx = await storage.updateTransaction(req.params.id, { status });
      if (tx && status === "approved" && tx.type === "deposit") {
        const user = await storage.getUser(tx.userId);
        if (user) {
          await storage.updateUser(user.id, {
            balance: user.balance + tx.amount,
            depositBalance: user.depositBalance + tx.amount
          });
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
          await storage.updateUser(user.id, { balance: user.balance + bonus });
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

  // Seed admin
  app.post("/api/admin/seed", async (req: Request, res: Response) => {
    try {
      const existing = await storage.getUserByPhone("99935673");
      if (existing) return res.json({ message: "Admin exists" });
      const admin = await storage.createUser({
        phone: "99935673",
        password: "AAbb11##",
        country: "togo",
        referralCode: "ADMIN1",
        referredBy: null,
      });
      await storage.updateUser(admin.id, { isAdmin: true });
      res.json({ message: "Admin created" });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  return httpServer;
}
