import { AsyncLocalStorage } from "node:async_hooks";

export const tenantStorage = new AsyncLocalStorage();

const SKIP_MODELS = new Set(["AdminUser", "User"]);

function currentTenantId() {
  return tenantStorage.getStore() || null;
}

function modelName(query) {
  return query.model?.modelName || query.constructor?.modelName || "";
}

export function tenantPlugin(schema) {
  schema.add({
    tenantId: { type: String, index: true },
  });

  const queryOps = [
    "find",
    "findOne",
    "findOneAndUpdate",
    "findOneAndDelete",
    "countDocuments",
    "updateOne",
    "updateMany",
    "deleteOne",
    "deleteMany",
    "distinct",
  ];

  for (const op of queryOps) {
    schema.pre(op, function () {
      if (SKIP_MODELS.has(modelName(this))) return;
      const tenantId = currentTenantId();
      if (tenantId) this.where({ tenantId });
    });
  }

  schema.pre("save", function () {
    if (SKIP_MODELS.has(this.constructor.modelName)) return;
    const tenantId = currentTenantId();
    if (tenantId && !this.tenantId) this.tenantId = tenantId;
  });

  schema.pre("insertMany", function (next, docs) {
    const documents = Array.isArray(next) ? next : docs;
    const tenantId = currentTenantId();
    if (tenantId && Array.isArray(documents)) {
      for (const doc of documents) {
        if (doc && !doc.tenantId) doc.tenantId = tenantId;
      }
    }
    if (typeof next === "function") next();
  });
}
