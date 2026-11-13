import { tenantStorage } from "../plugins/tenantPlugin.js";

class TenantError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

function cookieValue(header, name) {
  if (typeof header !== "string") return "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
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
  return (result.Items || [])
    .map((item) => ({
      tenantId: item.tenantId?.S,
      role: item.role?.S || "member",
    }))
    .filter((item) => item.tenantId);
}

export async function resolveTenantId(req) {
  const table = process.env.MEMBERSHIPS_TABLE;
  if (!table) return null;

  const sub = req.headers["x-amzn-oidc-identity"];
  if (typeof sub !== "string" || !sub.trim()) {
    throw new TenantError(401, "認証が必要です");
  }

  const memberships = await membershipsFor(sub.trim());
  const headerTenant = req.headers["x-tenant-id"];
  const requested =
    (typeof headerTenant === "string" ? headerTenant.trim() : "") ||
    cookieValue(req.headers.cookie, "dd_tenant");
  const chosen = memberships.find((item) => item.tenantId === requested);

  if (requested) {
    if (!chosen) throw new TenantError(403, "このテナントのメンバーではありません");
    return chosen;
  }
  if (memberships.length === 1) return memberships[0];
  if (memberships.length === 0) {
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
    .then((chosen) => {
      if (!chosen) return next();
      req.tenantRole = chosen.role;
      tenantStorage.run(chosen.tenantId, () => next());
    })
    .catch((error) => {
      const statusCode = error.statusCode || 500;
      if (statusCode >= 500) console.error("[tenant]", error);
      res.status(statusCode).json({ message: error.message || "テナントを解決できません" });
    });
}
