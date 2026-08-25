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

/**
 * Some action searches return compact schema references instead of the full action schema.
 * Resolve the provider's standard schema-reference form before exposing the actions to the model.
 */
export function connectedAppMissingSchemaSlugs(data: unknown): string[] {
  const slugs = new Set<string>();
  for (const value of toolSchemas(data)) {
    const schema = asRecord(value);
    if (asRecord(schema?.input_schema)) continue;
    const schemaRef = asRecord(schema?.schemaRef);
    const args = asRecord(schemaRef?.args);
    if (schemaRef?.tool !== "COMPOSIO_GET_TOOL_SCHEMAS" || !Array.isArray(args?.tool_slugs)) {
      continue;
    }
    for (const slug of args.tool_slugs) {
      if (typeof slug === "string" && slug.trim()) slugs.add(slug.trim());
    }
  }
  return [...slugs];
}

export function mergeConnectedAppToolSchemas(initial: unknown, resolved: unknown): unknown {
  const initialRecord = asRecord(initial);
  if (!initialRecord) return initial;
  const resolvedBySlug = new Map(
    toolSchemas(resolved)
      .map((value) => asRecord(value))
      .filter((schema): schema is Record<string, unknown> => Boolean(schema))
      .map((schema) => [toolSchemaSlug(schema), schema] as const)
      .filter(([slug]) => Boolean(slug)),
  );
  const merged = toolSchemas(initial).map((value) => {
    const schema = asRecord(value) ?? {};
    const resolvedSchema = resolvedBySlug.get(toolSchemaSlug(schema));
    return resolvedSchema ? { ...schema, ...resolvedSchema } : schema;
  });
  const initialSlugs = new Set(merged.map((value) => toolSchemaSlug(value)).filter(Boolean));
  for (const [slug, schema] of resolvedBySlug) {
    if (!initialSlugs.has(slug)) merged.push(schema);
  }
  return { ...initialRecord, tool_schemas: merged };
}

export function prefetchedConnectedAppActions(data: unknown): PrefetchedConnectedAppAction[] {
  const record = asRecord(data);
  const session = asRecord(record?.session);
  const sessionId = typeof session?.id === "string" ? session.id.trim() : "";
  if (!sessionId) return [];
  const seenToolNames = new Set<string>();
  return toolSchemas(data).flatMap((value) => {
    const schema = asRecord(value);
    const toolSlug = toolSchemaSlug(schema);
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

function toolSchemas(data: unknown): unknown[] {
  const record = asRecord(data);
  return Array.isArray(record?.tool_schemas)
    ? record.tool_schemas
    : Object.values(asRecord(record?.tool_schemas) ?? {});
}

function toolSchemaSlug(schema: Record<string, unknown> | undefined): string {
  const slug = schema?.tool_slug ?? schema?.slug;
  return typeof slug === "string" ? slug.trim() : "";
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}
