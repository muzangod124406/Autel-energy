import { db } from "./db";
import { eq, and, desc, sql, or, ilike, count, gte } from "drizzle-orm";
import {
  users, bankCards, investments, transactions, referrals, spinResults, tickets, settings, paymentChannels, products, giftCodes, countries,
  type User, type InsertUser, type BankCard, type Investment, type Transaction, type Referral, type SpinResult, type Ticket, type Settings, type PaymentChannel, type Product, type GiftCode, type Country
} from "@shared/schema";
import bcrypt from "bcryptjs";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByReferralCode(code: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  getAllUsers(filter?: any): Promise<User[]>;
  getUserCount(): Promise<number>;
  getTodayRegistrations(): Promise<number>;
  getTodayDepositorsCount(): Promise<number>;
  getTodayWithdrawersCount(): Promise<number>;
  getTotalWithdrawalsAmount(): Promise<number>;
  getUsersWithProductsCount(): Promise<number>;
  getPendingDepositsStats(): Promise<{ amount: number; count: number }>;
  getPendingWithdrawalsStats(): Promise<{ amount: number; count: number }>;
  getTodayDepositsAmount(): Promise<number>;
  getTodayWithdrawalsAmount(): Promise<number>;
  getTotalPlatformBalance(): Promise<number>;
  getTotalDistributedGains(): Promise<number>;
  getTotalCommissions(): Promise<number>;
  getActiveProductsCount(): Promise<number>;

  createBankCard(userId: string, data: any): Promise<BankCard>;
  getBankCard(userId: string): Promise<BankCard | undefined>;

  createInvestment(data: any): Promise<Investment>;
  getUserInvestments(userId: string): Promise<Investment[]>;
  getInvestment(id: string): Promise<Investment | undefined>;
  deleteInvestment(id: string): Promise<void>;
  getActiveInvestmentCount(): Promise<number>;

  createTransaction(userId: string, data: any): Promise<Transaction>;
  getUserTransactions(userId: string, type?: string): Promise<Transaction[]>;
  getPendingTransactions(type: string, search?: string): Promise<(Transaction & { user?: User })[]>;
  updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction | undefined>;
  getTodayDeposits(): Promise<number>;
  getTodayWithdrawals(): Promise<number>;
  getTotalDeposits(): Promise<number>;

  createReferral(data: any): Promise<Referral>;
  getUserReferrals(userId: string, level?: number): Promise<(Referral & { referred?: User })[]>;
  getReferralsByReferrer(referrerId: string): Promise<Referral[]>;

  addSpinResult(userId: string, amount: number): Promise<SpinResult>;
  getUserSpinResults(userId: string): Promise<SpinResult[]>;
  getRecentSpinResults(limit?: number): Promise<(SpinResult & { user?: User })[]>;

  createTicket(userId: string, data: any): Promise<Ticket>;
  getAllTickets(status?: string): Promise<(Ticket & { user?: User })[]>;
  updateTicket(id: string, data: Partial<Ticket>): Promise<Ticket | undefined>;

  getSettings(): Promise<Settings>;
  updateSettings(data: Partial<Settings>): Promise<Settings>;

  getPaymentChannels(activeOnly?: boolean): Promise<PaymentChannel[]>;
  createPaymentChannel(data: any): Promise<PaymentChannel>;
  updatePaymentChannel(id: string, data: Partial<PaymentChannel>): Promise<PaymentChannel | undefined>;
  deletePaymentChannel(id: string): Promise<void>;

  getProducts(activeOnly?: boolean): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(data: any): Promise<Product>;
  updateProduct(id: string, data: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;
  incrementProductPurchaseCount(id: string): Promise<void>;

  getAllGiftCodes(): Promise<GiftCode[]>;
  getGiftCodeByCode(code: string): Promise<GiftCode | undefined>;
  createGiftCode(data: any): Promise<GiftCode>;
  redeemGiftCode(id: string, userId: string): Promise<GiftCode>;
  deleteGiftCode(id: string): Promise<void>;

  getUserTeamOverview(): Promise<any[]>;

  getCountries(activeOnly?: boolean): Promise<Country[]>;
  createCountry(data: any): Promise<Country>;
  updateCountry(id: string, data: Partial<Country>): Promise<Country | undefined>;
  deleteCountry(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.referralCode, code));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db.insert(users).values({ ...insertUser, password: hashedPassword }).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async getAllUsers(filter?: any): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUserCount(fromDate?: Date): Promise<number> {
    if (fromDate) {
      const [result] = await db.select({ count: count() }).from(users).where(sql`${users.createdAt} >= ${fromDate}`);
      return result.count;
    }
    const [result] = await db.select({ count: count() }).from(users);
    return result.count;
  }

  async getTodayRegistrations(fromDate?: Date): Promise<number> {
    const from = fromDate ?? (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
    const [result] = await db.select({ count: count() }).from(users).where(sql`${users.createdAt} >= ${from}`);
    return result.count;
  }

  async getTodayDepositorsCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = await db.select({ userId: transactions.userId }).from(transactions)
      .where(and(eq(transactions.type, "deposit"), eq(transactions.status, "approved"), sql`${transactions.createdAt} >= ${today}`));
    const unique = new Set(result.map(r => r.userId));
    return unique.size;
  }

  async getTodayWithdrawersCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = await db.select({ userId: transactions.userId }).from(transactions)
      .where(and(eq(transactions.type, "withdrawal"), eq(transactions.status, "approved"), sql`${transactions.createdAt} >= ${today}`));
    const unique = new Set(result.map(r => r.userId));
    return unique.size;
  }

  async getTotalWithdrawalsAmount(fromDate?: Date): Promise<number> {
    const conditions = [eq(transactions.type, "withdrawal"), eq(transactions.status, "approved")];
    if (fromDate) conditions.push(sql`${transactions.createdAt} >= ${fromDate}`);
    const [result] = await db.select({ total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` }).from(transactions).where(and(...conditions));
    return Number(result.total);
  }

  async getUsersWithProductsCount(): Promise<number> {
    const result = await db.select({ userId: investments.userId }).from(investments).where(eq(investments.status, "active"));
    const unique = new Set(result.map(r => r.userId));
    return unique.size;
  }

  async getPendingDepositsStats(): Promise<{ amount: number; count: number }> {
    const [result] = await db.select({
      total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      cnt: count()
    }).from(transactions).where(and(eq(transactions.type, "deposit"), eq(transactions.status, "pending")));
    return { amount: Number(result.total), count: result.cnt };
  }

  async getPendingWithdrawalsStats(): Promise<{ amount: number; count: number }> {
    const [result] = await db.select({
      total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      cnt: count()
    }).from(transactions).where(and(eq(transactions.type, "withdrawal"), eq(transactions.status, "pending")));
    return { amount: Number(result.total), count: result.cnt };
  }

  async getTodayDepositsAmount(fromDate?: Date): Promise<number> {
    const from = fromDate ?? (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
    const [result] = await db.select({ total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` }).from(transactions)
      .where(and(eq(transactions.type, "deposit"), eq(transactions.status, "approved"), sql`${transactions.createdAt} >= ${from}`));
    return Number(result.total);
  }

  async getTodayWithdrawalsAmount(fromDate?: Date): Promise<number> {
    const from = fromDate ?? (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
    const [result] = await db.select({ total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` }).from(transactions)
      .where(and(eq(transactions.type, "withdrawal"), eq(transactions.status, "approved"), sql`${transactions.createdAt} >= ${from}`));
    return Number(result.total);
  }

  async getUserTeamOverview(): Promise<any[]> {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    const allReferrals = await db.select().from(referrals);
    const allInvestments = await db.select({ userId: investments.userId, amount: investments.amount }).from(investments).where(eq(investments.status, "active"));

    const refsByReferrer: Record<string, { l1: string[]; l2: string[]; l3: string[] }> = {};
    for (const ref of allReferrals) {
      if (!refsByReferrer[ref.referrerId]) refsByReferrer[ref.referrerId] = { l1: [], l2: [], l3: [] };
      if (ref.level === 1) refsByReferrer[ref.referrerId].l1.push(ref.referredId);
      else if (ref.level === 2) refsByReferrer[ref.referrerId].l2.push(ref.referredId);
      else if (ref.level === 3) refsByReferrer[ref.referrerId].l3.push(ref.referredId);
    }

    const investByUser: Record<string, number> = {};
    for (const inv of allInvestments) {
      investByUser[inv.userId] = (investByUser[inv.userId] || 0) + inv.amount;
    }

    return allUsers.map(u => {
      const refs = refsByReferrer[u.id] || { l1: [], l2: [], l3: [] };
      const allRefIds = [...refs.l1, ...refs.l2, ...refs.l3];
      const teamTotalInvested = allRefIds.reduce((sum, id) => sum + (investByUser[id] || 0), 0);
      return {
        id: u.id, phone: u.phone, nickname: u.nickname, country: u.country,
        ownInvested: investByUser[u.id] || 0,
        teamL1: refs.l1.length, teamL2: refs.l2.length, teamL3: refs.l3.length,
        totalTeamMembers: allRefIds.length,
        teamTotalInvested,
        commissionBalance: u.commissionBalance,
        productRevenue: u.productRevenue,
        withdrawBalance: u.withdrawBalance,
        depositBalance: u.depositBalance,
        createdAt: u.createdAt,
        referralCode: u.referralCode,
        referredBy: u.referredBy,
      };
    });
  }

  async getTotalPlatformBalance(): Promise<number> {
    const [result] = await db.select({
      total: sql<number>`COALESCE(SUM(${users.depositBalance} + ${users.withdrawBalance}), 0)`
    }).from(users);
    return Number(result.total);
  }

  async getTotalDistributedGains(): Promise<number> {
    const [result] = await db.select({ total: sql<number>`COALESCE(SUM(${users.productRevenue}), 0)` }).from(users);
    return Number(result.total);
  }

  async getTotalCommissions(): Promise<number> {
    const [result] = await db.select({ total: sql<number>`COALESCE(SUM(${users.commissionBalance}), 0)` }).from(users);
    return Number(result.total);
  }

  async getActiveProductsCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(products).where(eq(products.isActive, true));
    return result.count;
  }

  async createBankCard(userId: string, data: any): Promise<BankCard> {
    const existing = await this.getBankCard(userId);
    if (existing) {
      const [card] = await db.update(bankCards).set(data).where(eq(bankCards.userId, userId)).returning();
      return card;
    }
    const [card] = await db.insert(bankCards).values({ ...data, userId }).returning();
    return card;
  }

  async getBankCard(userId: string): Promise<BankCard | undefined> {
    const [card] = await db.select().from(bankCards).where(eq(bankCards.userId, userId));
    return card;
  }

  async createInvestment(data: any): Promise<Investment> {
    const [inv] = await db.insert(investments).values(data).returning();
    return inv;
  }

  async getUserInvestments(userId: string): Promise<Investment[]> {
    return await db.select().from(investments).where(eq(investments.userId, userId)).orderBy(desc(investments.startDate));
  }

  async getInvestment(id: string): Promise<Investment | undefined> {
    const [inv] = await db.select().from(investments).where(eq(investments.id, id));
    return inv;
  }

  async deleteInvestment(id: string): Promise<void> {
    await db.delete(investments).where(eq(investments.id, id));
  }

  async getActiveInvestmentCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(investments).where(eq(investments.status, "active"));
    return result.count;
  }

  async createTransaction(userId: string, data: any): Promise<Transaction> {
    const [tx] = await db.insert(transactions).values({ ...data, userId }).returning();
    return tx;
  }

  async getUserTransactions(userId: string, type?: string): Promise<Transaction[]> {
    if (type) {
      return await db.select().from(transactions).where(and(eq(transactions.userId, userId), eq(transactions.type, type))).orderBy(desc(transactions.createdAt));
    }
    return await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt));
  }

  async getPendingTransactions(type: string, search?: string, status?: string): Promise<(Transaction & { user?: User })[]> {
    const conditions = [eq(transactions.type, type)];
    if (status && status !== "all") conditions.push(eq(transactions.status, status));
    else if (!status) conditions.push(eq(transactions.status, "pending"));
    const txs = await db.select().from(transactions).where(and(...conditions)).orderBy(desc(transactions.createdAt));
    const result = [];
    for (const tx of txs) {
      const user = await this.getUser(tx.userId);
      if (search) {
        const q = search.toLowerCase();
        const matchPhone = tx.phoneNumber?.toLowerCase().includes(q);
        const matchAccount = tx.accountName?.toLowerCase().includes(q);
        const matchUser = user?.phone?.toLowerCase().includes(q);
        if (!matchPhone && !matchAccount && !matchUser) continue;
      }
      result.push({ ...tx, user });
    }
    return result;
  }

  async updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction | undefined> {
    const [tx] = await db.update(transactions).set(data).where(eq(transactions.id, id)).returning();
    return tx;
  }

  async getTodayDeposits(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [result] = await db.select({ count: count() }).from(transactions).where(and(eq(transactions.type, "deposit"), sql`${transactions.createdAt} >= ${today}`));
    return result.count;
  }

  async getTodayWithdrawals(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [result] = await db.select({ count: count() }).from(transactions).where(and(eq(transactions.type, "withdrawal"), sql`${transactions.createdAt} >= ${today}`));
    return result.count;
  }

  async getTotalDeposits(fromDate?: Date): Promise<number> {
    const conditions = [eq(transactions.type, "deposit"), eq(transactions.status, "approved")];
    if (fromDate) conditions.push(sql`${transactions.createdAt} >= ${fromDate}`);
    const [result] = await db.select({ total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` }).from(transactions).where(and(...conditions));
    return Number(result.total);
  }

  async createReferral(data: any): Promise<Referral> {
    const [ref] = await db.insert(referrals).values(data).returning();
    return ref;
  }

  async getUserReferrals(userId: string, level?: number): Promise<(Referral & { referred?: User })[]> {
    let refs;
    if (level) {
      refs = await db.select().from(referrals).where(and(eq(referrals.referrerId, userId), eq(referrals.level, level)));
    } else {
      refs = await db.select().from(referrals).where(eq(referrals.referrerId, userId));
    }
    const result = [];
    for (const ref of refs) {
      const referred = await this.getUser(ref.referredId);
      result.push({ ...ref, referred });
    }
    return result;
  }

  async getReferralsByReferrer(referrerId: string): Promise<Referral[]> {
    return await db.select().from(referrals).where(eq(referrals.referrerId, referrerId));
  }

  async addSpinResult(userId: string, amount: number): Promise<SpinResult> {
    const [result] = await db.insert(spinResults).values({ userId, amount }).returning();
    return result;
  }

  async getUserSpinResults(userId: string): Promise<SpinResult[]> {
    return await db.select().from(spinResults).where(eq(spinResults.userId, userId)).orderBy(desc(spinResults.createdAt));
  }

  async getRecentSpinResults(limit = 20): Promise<(SpinResult & { user?: User })[]> {
    const rows = await db
      .select({ spin: spinResults, user: users })
      .from(spinResults)
      .leftJoin(users, eq(spinResults.userId, users.id))
      .orderBy(desc(spinResults.createdAt))
      .limit(limit);
    return rows.map(r => ({ ...r.spin, user: r.user ?? undefined }));
  }

  async createTicket(userId: string, data: any): Promise<Ticket> {
    const [ticket] = await db.insert(tickets).values({ ...data, userId }).returning();
    return ticket;
  }

  async getAllTickets(status?: string): Promise<(Ticket & { user?: User })[]> {
    let tix;
    if (status) {
      tix = await db.select().from(tickets).where(eq(tickets.status, status)).orderBy(desc(tickets.createdAt));
    } else {
      tix = await db.select().from(tickets).where(eq(tickets.status, "approved")).orderBy(desc(tickets.createdAt));
    }
    const result = [];
    for (const t of tix) {
      const user = await this.getUser(t.userId);
      result.push({ ...t, user });
    }
    return result;
  }

  async updateTicket(id: string, data: Partial<Ticket>): Promise<Ticket | undefined> {
    const [ticket] = await db.update(tickets).set(data).where(eq(tickets.id, id)).returning();
    return ticket;
  }

  async getSettings(): Promise<Settings> {
    let [s] = await db.select().from(settings).where(eq(settings.id, "main"));
    if (!s) {
      [s] = await db.insert(settings).values({ id: "main" }).returning();
    }
    return s;
  }

  async updateSettings(data: Partial<Settings>): Promise<Settings> {
    const [s] = await db.update(settings).set(data).where(eq(settings.id, "main")).returning();
    return s;
  }

  async getPaymentChannels(activeOnly = false): Promise<PaymentChannel[]> {
    if (activeOnly) {
      return await db.select().from(paymentChannels).where(eq(paymentChannels.isActive, true)).orderBy(desc(paymentChannels.createdAt));
    }
    return await db.select().from(paymentChannels).orderBy(desc(paymentChannels.createdAt));
  }

  async createPaymentChannel(data: any): Promise<PaymentChannel> {
    const [ch] = await db.insert(paymentChannels).values(data).returning();
    return ch;
  }

  async updatePaymentChannel(id: string, data: Partial<PaymentChannel>): Promise<PaymentChannel | undefined> {
    const [ch] = await db.update(paymentChannels).set(data).where(eq(paymentChannels.id, id)).returning();
    return ch;
  }

  async deletePaymentChannel(id: string): Promise<void> {
    await db.delete(paymentChannels).where(eq(paymentChannels.id, id));
  }

  async getProducts(activeOnly = false): Promise<Product[]> {
    if (activeOnly) {
      return await db.select().from(products).where(eq(products.isActive, true)).orderBy(desc(products.createdAt));
    }
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [p] = await db.select().from(products).where(eq(products.id, id));
    return p;
  }

  async createProduct(data: any): Promise<Product> {
    const [p] = await db.insert(products).values(data).returning();
    return p;
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product | undefined> {
    const [p] = await db.update(products).set(data).where(eq(products.id, id)).returning();
    return p;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async incrementProductPurchaseCount(id: string): Promise<void> {
    await db.update(products).set({ purchaseCount: sql`${products.purchaseCount} + 1` }).where(eq(products.id, id));
  }

  async getAllGiftCodes(): Promise<GiftCode[]> {
    return await db.select().from(giftCodes).orderBy(desc(giftCodes.createdAt));
  }

  async getGiftCodeByCode(code: string): Promise<GiftCode | undefined> {
    const [gc] = await db.select().from(giftCodes).where(eq(giftCodes.code, code.toUpperCase()));
    return gc;
  }

  async createGiftCode(data: any): Promise<GiftCode> {
    const [gc] = await db.insert(giftCodes).values({ ...data, code: data.code.toUpperCase() }).returning();
    return gc;
  }

  async redeemGiftCode(id: string, userId: string): Promise<GiftCode> {
    const [gc] = await db.update(giftCodes).set({ isUsed: true, usedBy: userId, usedAt: new Date() }).where(eq(giftCodes.id, id)).returning();
    return gc;
  }

  async deleteGiftCode(id: string): Promise<void> {
    await db.delete(giftCodes).where(eq(giftCodes.id, id));
  }

  async getCountries(activeOnly = false): Promise<Country[]> {
    if (activeOnly) {
      return await db.select().from(countries).where(eq(countries.isActive, true)).orderBy(countries.name);
    }
    return await db.select().from(countries).orderBy(countries.name);
  }

  async createCountry(data: any): Promise<Country> {
    const [c] = await db.insert(countries).values(data).returning();
    return c;
  }

  async updateCountry(id: string, data: Partial<Country>): Promise<Country | undefined> {
    const [c] = await db.update(countries).set(data).where(eq(countries.id, id)).returning();
    return c;
  }

  async deleteCountry(id: string): Promise<void> {
    await db.delete(countries).where(eq(countries.id, id));
  }
}

export const storage = new DatabaseStorage();
