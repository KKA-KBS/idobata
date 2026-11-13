import crypto from "node:crypto";
import AdminUser from "../models/AdminUser.js";
import authService from "../services/auth/authService.js";

function readOidcClaims(header) {
  const payload = header.split(".")[1];
  if (!payload) return null;
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
}

async function userFromAlb(req) {
  const oidc = req.headers["x-amzn-oidc-data"];
  if (typeof oidc !== "string" || !oidc.includes(".")) return null;

  const claims = readOidcClaims(oidc);
  if (!claims || typeof claims !== "object") return null;
  const email = String(claims.email || claims.username || "").toLowerCase();
  if (!email) return null;

  const sub = String(req.headers["x-amzn-oidc-identity"] || claims.sub || "");
  let user = await AdminUser.findOne({ email });
  if (!user) {
    user = await AdminUser.create({
      name: claims.name || email,
      email,
      password: crypto.randomBytes(32).toString("hex"),
      role: "admin",
      googleId: sub || null,
    });
  } else if (sub && user.googleId !== sub) {
    user.googleId = sub;
    user.lastLogin = new Date();
    await user.save();
  }

  return {
    id: user._id,
    email: user.email,
    role: user.role,
    sub,
  };
}

export const protect = async (req, res, next) => {
  try {
    const albUser = await userFromAlb(req);
    if (albUser) {
      req.user = albUser;
      return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "認証が必要です" });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = authService.verifyToken(token);

      const user = await AdminUser.findById(decoded.id);

      if (!user) {
        return res.status(401).json({ message: "ユーザーが見つかりません" });
      }

      req.user = {
        id: user._id,
        email: user.email,
        role: user.role,
      };

      next();
    } catch (error) {
      return res.status(401).json({ message: "トークンが無効です" });
    }
  } catch (error) {
    console.error("[AuthMiddleware] Protect error:", error);
    res.status(500).json({ message: "サーバーエラーが発生しました" });
  }
};

/** admin ミドルウェアと同じ基準で、リクエストが管理者のものか判定する */
export const isAdminRequest = (req) => {
  if (process.env.MEMBERSHIPS_TABLE) {
    return req.tenantRole === "tenant-admin";
  }
  return !!(req.user && req.user.role === "admin");
};

export const admin = (req, res, next) => {
  if (isAdminRequest(req)) return next();
  return res.status(403).json({ message: "管理者権限が必要です" });
};
