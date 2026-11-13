export function participantId(req, supplied) {
  const header = req.headers["x-amzn-oidc-identity"];
  if (typeof header === "string" && header.trim()) return header.trim();
  if (Array.isArray(supplied)) return supplied[0];
  return supplied;
}
