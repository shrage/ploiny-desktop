const identityFields = [
  "email",
  "emailAddress",
  "email_address",
  "accountEmail",
  "account_email",
  "username",
  "userName",
  "user_name",
  "accountName",
  "account_name",
  "displayName",
  "display_name",
  "alias",
] as const;

const identityRank = new Map<string, number>(identityFields.map((field, index) => [field, index]));
const sensitiveField = /(?:token|secret|password|credential|authorization|api[_-]?key|cookie)/i;
const maxIdentityLength = 254;

/**
 * Extracts the best safe, human-readable identity Composio returns for a connected account.
 *
 * Composio's account payload differs by connector. Only explicitly named identity fields are
 * considered, and credential-shaped branches are never traversed or returned.
 */
export function composioAccountIdentity(account: unknown): string | undefined {
  let best: { rank: number; depth: number; value: string } | undefined;

  const consider = (key: string, value: unknown, depth: number) => {
    const rank = identityRank.get(key);
    if (rank === undefined || typeof value !== "string") return;
    const identity = value.trim().replace(/\s+/g, " ");
    if (!identity || identity.length > maxIdentityLength) return;
    if (!best || rank < best.rank || (rank === best.rank && depth < best.depth)) {
      best = { rank, depth, value: identity };
    }
  };

  const visit = (value: unknown, depth: number) => {
    if (!value || typeof value !== "object" || depth > 4) return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item, depth + 1);
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      if (sensitiveField.test(key)) continue;
      consider(key, child, depth);
      visit(child, depth + 1);
    }
  };

  visit(account, 0);
  return best?.value;
}
