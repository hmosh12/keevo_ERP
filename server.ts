import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";

// Initialize Firebase Admin
try {
  admin.initializeApp();
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Keevo ERP Server is running" });
  });

  // API to create staff user
  app.post("/api/staff", async (req, res) => {
    const { email, password, role, companyId, displayName } = req.body;

    if (!email || !password || !role || !companyId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: displayName || email.split('@')[0],
      });

      // Create user doc in Firestore
      await admin.firestore().collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email,
        displayName: displayName || email.split('@')[0],
        role,
        companyId,
        createdAt: new Date().toISOString()
      });

      res.json({ success: true, uid: userRecord.uid });
    } catch (error: any) {
      console.error("Error creating staff user:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
