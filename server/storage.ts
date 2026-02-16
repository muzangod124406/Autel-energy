import { db } from "./db";
import { eq, and, desc, sql, or, ilike, count } from "drizzle-orm";
import {
  users, bankCards, investments, transactions, referrals, spinResults, tickets, settings,
  type User, type InsertUser, type BankCard, type Investment, type Transaction, type Referral, type SpinResult, type Ticket, type Settings
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

  createBankCard(userId: string, data: any): Promise<BankCard>;
  getBankCard(userId: string): Promise<BankCard | undefined>;

  createInvestment(data: any): Promise<Investment>;
  getUserInvestments(userId: string): Promise<Investment[]>;
  getInvestment(id: string): Promise<Investment | undefined>;
  deleteInvestment(id: string): Promise<void>;
  getActiveInvestmentCount(): Promise<number>;

  createTransaction(userId: string, data: any): Promise<Transaction>;
  getUserTransactions(userId: string, type?: string): Promise<Transaction[]>;
  getPendingTransactions(type: string): Promise<(Transaction & { user?: User })[]>;
  updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction | undefined>;
  getTodayDeposits(): Promise<number>;
  getTodayWithdrawals(): Promise<number>;
  getTotalDeposits(): Promise<number>;

  createReferral(data: any): Promise<Referral>;
  getUserReferrals(userId: string, level?: number): Promise<(Referral & { referred?: User })[]>;
  getReferralsByReferrer(referrerId: string): Promise<Referral[]>;

  addSpinResult(userId: string, amount: number): Promise<SpinResult>;
  getUserSpinResults(userId: string): Promise<SpinResult[]>;

  createTicket(userId: string, data: any): Promise<Ticket>;
  getAllTickets(status?: string): Promise<(Ticket & { user?: User })[]>;
  updateTicket(id: string, data: Partial<Ticket>): Promise<Ticket | undefined>;

  getSettings(): Promise<Settings>;
  updateSettings(data: Partial<Settings>): Promise<Settings>;
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
    let query = db.select().from(users);
    return await query.orderBy(desc(users.createdAt));
  }

  async getUserCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(users);
    return result.count;
  }

  async getTodayRegistrations(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [result] = await db.select({ count: count() }).from(users).where(sql`${users.createdAt} >= ${today}`);
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

  async getPendingTransactions(type: string): Promise<(Transaction & { user?: User })[]> {
    const txs = await db.select().from(transactions).where(and(eq(transactions.type, type), eq(transactions.status, "pending"))).orderBy(desc(transactions.createdAt));
    const result = [];
    for (const tx of txs) {
      const user = await this.getUser(tx.userId);
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

  async getTotalDeposits(): Promise<number> {
    const [result] = await db.select({ total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` }).from(transactions).where(and(eq(transactions.type, "deposit"), eq(transactions.status, "approved")));
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
}

export const storage = new DatabaseStorage();
