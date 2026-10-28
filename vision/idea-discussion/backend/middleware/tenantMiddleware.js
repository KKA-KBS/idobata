import { tenantStorage } from "../plugins/tenantPlugin.js";

class TenantError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function membershipsFor(sub) {
  const { DynamoDBClient, QueryCommand } = await import("@aws-sdk/client-dynamodb");
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "ap-northeast-1",
  });
  const result = await client.send(
    new QueryCommand({
      TableName: process.env.MEMBERSHIPS_TABLE,
      KeyConditionExpression: "userSub = :sub",
      ExpressionAttributeValues: { ":sub": { S: sub } },
    })
  );
  return (result.Items || []).map((item) => item.tenantId?.S).filter(Boolean);
}

export async function resolveTenantId(req) {
  const table = process.env.MEMBERSHIPS_TABLE;
  if (!table) return null;

  const sub = req.headers["x-amzn-oidc-identity"];
  if (typeof sub !== "string" || !sub.trim()) {
    throw new TenantError(401, "認証が必要です");
  }

  const tenants = await membershipsFor(sub.trim());
  const requested = req.headers["x-tenant-id"];
  const tenantId = typeof requested === "string" ? requested.trim() : "";

  if (tenantId) {
    if (!tenants.includes(tenantId)) {
      throw new TenantError(403, "このテナントのメンバーではありません");
    }
    return tenantId;
  }
  if (tenants.length === 1) return tenants[0];
  if (tenants.length === 0) {
    throw new TenantError(403, "所属するテナントがありません");
  }
  throw new TenantError(400, "x-tenant-id が必要です");
}

const OPEN_PATHS = new Set(["/api/health", "/api/session"]);

export function tenantMiddleware(req, res, next) {
  if (!process.env.MEMBERSHIPS_TABLE || OPEN_PATHS.has(req.path)) {
    return next();
  }

  resolveTenantId(req)
    .then((tenantId) => {
      if (!tenantId) return next();
      tenantStorage.run(tenantId, () => next());
    })
    .catch((error) => {
      const statusCode = error.statusCode || 500;
      if (statusCode >= 500) console.error("[tenant]", error);
      res.status(statusCode).json({ message: error.message || "テナントを解決できません" });
    });
}
