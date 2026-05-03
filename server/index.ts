import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { pool } from "./db";
import { initSupabaseStorage } from "./supabase-storage";

const app = express();
app.set("trust proxy", 1);
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Migrations automatiques au démarrage (dev + production)
  try {
    await pool.query("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS image_url2 text");
    log("Migration: tickets.image_url2 OK");
    await pool.query("ALTER TABLE investments ADD COLUMN IF NOT EXISTS product_id text");
    log("Migration: investments.product_id OK");
    await pool.query("ALTER TABLE settings ADD COLUMN IF NOT EXISTS openai_api_key text NOT NULL DEFAULT ''");
    log("Migration: settings.openai_api_key OK");
    await pool.query("ALTER TABLE settings ADD COLUMN IF NOT EXISTS westpay_api_keys jsonb DEFAULT '{}'::jsonb");
    log("Migration: settings.westpay_api_keys OK");
    await pool.query("ALTER TABLE settings ADD COLUMN IF NOT EXISTS soleaspay_api_key text NOT NULL DEFAULT ''");
    log("Migration: settings.soleaspay_api_key OK");
    await pool.query("ALTER TABLE settings ADD COLUMN IF NOT EXISTS soleaspay_secret_hash text NOT NULL DEFAULT ''");
    log("Migration: settings.soleaspay_secret_hash OK");
    await pool.query("ALTER TABLE countries ADD COLUMN IF NOT EXISTS payment_provider text NOT NULL DEFAULT 'westpay'");
    log("Migration: countries.payment_provider OK");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")`);
    log("Migration: session table OK");
  } catch (e: any) {
    log(`Migration warning: ${e.message}`);
  }

  // Initialiser Supabase Storage (buckets + policies)
  await initSupabaseStorage();

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
