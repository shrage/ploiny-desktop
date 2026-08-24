export type ConnectionAccountStatus = "pending" | "connected" | "revoked" | "error";

export function connectionAccountIdentity(connection: { identity?: string }): string | undefined {
  const identity = connection.identity?.trim();
  return identity || undefined;
}

export function splitConnectionAccounts<T extends { status: ConnectionAccountStatus }>(
  connections: T[],
) {
  return {
    active: connections.filter((connection) => connection.status === "connected"),
    pending: connections.filter((connection) => connection.status === "pending"),
  };
}
