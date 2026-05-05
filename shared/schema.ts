import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phone: text("phone").notNull().unique(),
  password: text("password").notNull(),
  country: text("country").notNull(),
  nickname: text("nickname"),
  transactionPassword: text("transaction_password"),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: text("referred_by"),
  balance: integer("balance").notNull().default(0),
  depositBalance: integer("deposit_balance").notNull().default(0),
  withdrawBalance: integer("withdraw_balance").notNull().default(0),
  productRevenue: integer("product_revenue").notNull().default(0),
  commissionBalance: integer("commission_balance").notNull().default(0),
  spinTickets: integer("spin_tickets").notNull().default(0),
  vipLevel: integer("vip_level").notNull().default(0),
  isAdmin: boolean("is_admin").notNull().default(false),
  isBanned: boolean("is_banned").notNull().default(false),
  isPromoter: boolean("is_promoter").notNull().default(false),
  withdrawBlocked: boolean("withdraw_blocked").notNull().default(false),
  requireInviteToWithdraw: boolean("require_invite_to_withdraw").notNull().default(false),
  lastDailyBonus: timestamp("last_daily_bonus"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bankCards = pgTable("bank_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  country: text("country").notNull(),
  paymentMethod: text("payment_method").notNull(),
  phoneNumber: text("phone_number").notNull(),
  accountName: text("account_name"),
  usdtWallet: text("usdt_wallet"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const investments = pgTable("investments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  planType: text("plan_type").notNull(),
  vipLevel: integer("vip_level").notNull(),
  amount: integer("amount").notNull(),
  dailyGain: integer("daily_gain").notNull(),
  duration: integer("duration").notNull(),
  totalGain: integer("total_gain").notNull(),
  status: text("status").notNull().default("active"),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date").notNull(),
  assignedByAdmin: boolean("assigned_by_admin").notNull().default(false),
  productId: text("product_id"),
  productName: text("product_name"),
  productImage: text("product_image"),
  lastGainDate: timestamp("last_gain_date"),
  collectedDays: integer("collected_days").notNull().default(0),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending"),
  country: text("country"),
  paymentMethod: text("payment_method"),
  phoneNumber: text("phone_number"),
  accountName: text("account_name"),
  fees: integer("fees").default(0),
  netAmount: integer("net_amount"),
  channelId: text("channel_id"),
  channelName: text("channel_name"),
  externalRef: text("external_ref"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: text("referrer_id").notNull(),
  referredId: text("referred_id").notNull(),
  level: integer("level").notNull(),
  commission: integer("commission").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const spinResults = pgTable("spin_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  amount: integer("amount").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  imageUrl: text("image_url"),
  imageUrl2: text("image_url2"),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  bonus: integer("bonus").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`'main'`),
  telegramGroup: text("telegram_group").notNull().default("https://t.me/+M9neinnLgK4wYWRk"),
  telegramChannel: text("telegram_channel").notNull().default(""),
  telegramService: text("telegram_service").notNull().default("@redbull_service"),
  activitiesEnabled: boolean("activities_enabled").notNull().default(true),
  serviceClient1: text("service_client1").notNull().default(""),
  serviceClient2: text("service_client2").notNull().default(""),
  officialChain: text("official_chain").notNull().default(""),
  discussionGroup: text("discussion_group").notNull().default(""),
  moneyFusionLink: text("money_fusion_link").notNull().default(""),
  depositMinAmount: integer("deposit_min_amount").notNull().default(1000),
  withdrawMinAmount: integer("withdraw_min_amount").notNull().default(1000),
  withdrawFeePercent: integer("withdraw_fee_percent").notNull().default(15),
  withdrawStartHour: integer("withdraw_start_hour").notNull().default(10),
  withdrawEndHour: integer("withdraw_end_hour").notNull().default(15),
  soleaspayEnabled: boolean("soleaspay_enabled").notNull().default(false),
  soleaspayChannelName: text("soleaspay_channel_name").notNull().default(""),
  referralCommission1: integer("referral_commission1").notNull().default(20),
  referralCommission2: integer("referral_commission2").notNull().default(3),
  referralCommission3: integer("referral_commission3").notNull().default(2),
  statsResetDate: timestamp("stats_reset_date"),
  openaiApiKey: text("openai_api_key").notNull().default(""),
  westpayApiKeys: jsonb("westpay_api_keys").default({}),
  soleaspayApiKey: text("soleaspay_api_key").notNull().default(""),
  soleaspaySecretHash: text("soleaspay_secret_hash").notNull().default(""),
  popupLink: text("popup_link").notNull().default("https://whatsapp.com/channel/0029VbCPaD2IiRokvjSXNN2p"),
});

export const countries = pgTable("countries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  flag: text("flag").notNull().default(""),
  code: text("code").notNull().default(""),
  operators: text("operators").array().notNull().default(sql`'{}'::text[]`),
  isActive: boolean("is_active").notNull().default(true),
  paymentProvider: text("payment_provider").notNull().default("westpay"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const giftCodes = pgTable("gift_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  recipientPhone: text("recipient_phone"),
  amount: integer("amount").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").notNull().default(false),
  usedBy: text("used_by"),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const paymentChannels = pgTable("payment_channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull().default("link"),
  redirectUrl: text("redirect_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  price: integer("price").notNull(),
  dailyGain: integer("daily_gain").notNull(),
  totalGain: integer("total_gain").notNull(),
  cycleDays: integer("cycle_days").notNull(),
  purchaseLimit: integer("purchase_limit").notNull().default(0),
  purchaseCount: integer("purchase_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  launchDate: timestamp("launch_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  phone: true,
  password: true,
  country: true,
  nickname: true,
  referralCode: true,
  referredBy: true,
});

export const loginSchema = z.object({
  phone: z.string().min(1),
  password: z.string().min(1),
  country: z.string().min(1),
});

export const registerSchema = z.object({
  phone: z.string().min(6),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
  country: z.string().min(1),
  inviteCode: z.string().optional(),
});

export const insertBankCardSchema = createInsertSchema(bankCards).pick({
  country: true,
  paymentMethod: true,
  phoneNumber: true,
  accountName: true,
  usdtWallet: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  type: true,
  amount: true,
  country: true,
  paymentMethod: true,
  phoneNumber: true,
  accountName: true,
});

export const insertTicketSchema = createInsertSchema(tickets).pick({
  imageUrl: true,
  description: true,
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  imageUrl: true,
  price: true,
  dailyGain: true,
  totalGain: true,
  cycleDays: true,
  purchaseLimit: true,
  isActive: true,
  launchDate: true,
});

export const insertPaymentChannelSchema = createInsertSchema(paymentChannels).pick({
  name: true,
  type: true,
  redirectUrl: true,
  isActive: true,
});

export const insertCountrySchema = createInsertSchema(countries).pick({
  name: true,
  flag: true,
  code: true,
  operators: true,
  isActive: true,
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  senderType: text("sender_type").notNull(), // "user" | "admin"
  content: text("content"),
  imageUrl: text("image_url"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type BankCard = typeof bankCards.$inferSelect;
export type Investment = typeof investments.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
export type SpinResult = typeof spinResults.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type PaymentChannel = typeof paymentChannels.$inferSelect;
export type Product = typeof products.$inferSelect;
export type GiftCode = typeof giftCodes.$inferSelect;
export type Country = typeof countries.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
