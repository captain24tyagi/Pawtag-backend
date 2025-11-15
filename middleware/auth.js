import admin from "../utils/firebaseAdmin.js";

export const verifyUserToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = await admin.auth().verifyIdToken(token);

    if (decoded.firebase.sign_in_provider !== "google.com") {
      return res.status(403).json({ error: "User must login via Google" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error("verifyUserToken error:", err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// 🔹 Verify Admin (email/password only)
export const verifyAdminToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = await admin.auth().verifyIdToken(token);

    // allow only email-password auth users
    if (decoded.firebase.sign_in_provider !== "password") {
      return res.status(403).json({ error: "Admin login required" });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    console.error("verifyAdminToken error:", err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
