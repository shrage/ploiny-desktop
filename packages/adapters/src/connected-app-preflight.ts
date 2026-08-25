import type { ConnectorTool } from "@rakazo/adapter-kit";

type SearchCandidate = {
  tool_slug?: unknown;
  slug?: unknown;
  description?: unknown;
};

export function connectedAppPreflightInstruction(input: {
  appName: string;
  data: unknown;
}): string | undefined {
  const record = asRecord(input.data);
  const session = asRecord(record?.session);
  const sessionId = typeof session?.id === "string" ? session.id.trim() : "";
  const schemas = Array.isArray(record?.tool_schemas)
    ? record.tool_schemas
    : Object.values(asRecord(record?.tool_schemas) ?? {});
  const candidates = schemas
    .map((schema) => asRecord(schema) as SearchCandidate | undefined)
    .map((schema) => ({
      slug:
        typeof schema?.tool_slug === "string"
          ? schema.tool_slug
          : typeof schema?.slug === "string"
            ? schema.slug
            : "",
      description: typeof schema?.description === "string" ? schema.description : "",
    }))
    .filter((candidate) => candidate.slug)
    .slice(0, 6);
  if (!sessionId || candidates.length === 0) return undefined;

  return [
    "CONNECTED-APP PREFLIGHT (internal instruction):",
    `${input.appName} action lookup is complete. Do not use a browser or repeat the lookup.`,
    `Use COMPOSIO_MULTI_EXECUTE_TOOL with session_id "${sessionId}" and one of these exact action slugs:`,
    ...candidates.map(
      (candidate) =>
        `- ${candidate.slug}${candidate.description ? `: ${candidate.description}` : ""}`,
    ),
    "Supply only arguments supported by the chosen action. Use the saved account default, or ask the user to choose an account when needed.",
  ].join("\n");
}

export const connectedAppExecutionTool: ConnectorTool = {
  name: "COMPOSIO_MULTI_EXECUTE_TOOL",
  description: "Run an action selected for a connected app.",
  inputSchema: {
    type: "object",
    properties: {
      tools: {
        type: "array",
        items: {
          type: "object",
          properties: {
            tool_slug: { type: "string" },
            arguments: { type: "object" },
            account: { type: "string" },
          },
          required: ["tool_slug", "arguments"],
        },
      },
      session_id: { type: "string" },
    },
    required: ["tools"],
  },
  route: {
    connectorId: "composio",
    toolName: "COMPOSIO_MULTI_EXECUTE_TOOL",
    resourceId: "composio",
  },
};

export type PrefetchedConnectedAppAction = {
  toolName: string;
  toolSlug: string;
  sessionId: string;
  tool: ConnectorTool;
};

export function prefetchedConnectedAppActions(data: unknown): PrefetchedConnectedAppAction[] {
  const record = asRecord(data);
  const session = asRecord(record?.session);
  const sessionId = typeof session?.id === "string" ? session.id.trim() : "";
  if (!sessionId) return [];
  const schemas = Array.isArray(record?.tool_schemas)
    ? record.tool_schemas
    : Object.values(asRecord(record?.tool_schemas) ?? {});
  const seenToolNames = new Set<string>();
  return schemas.flatMap((value) => {
    const schema = asRecord(value);
    const toolSlug = typeof schema?.tool_slug === "string" ? schema.tool_slug.trim() : "";
    const inputSchema = asRecord(schema?.input_schema);
    if (!toolSlug || !inputSchema) return [];
    const toolName = `connected_app_${toolSlug}`;
    if (seenToolNames.has(toolName)) return [];
    seenToolNames.add(toolName);
    return [
      {
        toolName,
        toolSlug,
        sessionId,
        tool: {
          name: toolName,
          description:
            typeof schema?.description === "string" ? schema.description : `Use ${toolSlug}.`,
          inputSchema,
          route: {
            connectorId: "composio",
            toolName: "COMPOSIO_MULTI_EXECUTE_TOOL",
            resourceId: "composio",
          },
        },
      },
    ];
  });
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}
