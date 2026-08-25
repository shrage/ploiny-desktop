import { describe, expect, it } from "vitest";
import {
  connectedAppMissingSchemaSlugs,
  connectedAppPreflightInstruction,
  mergeConnectedAppToolSchemas,
  prefetchedConnectedAppActions,
} from "./connected-app-preflight.js";

describe("connected app preflight", () => {
  it("turns a generic action lookup into an internal next-step instruction", () => {
    const instruction = connectedAppPreflightInstruction({
      appName: "Google Drive",
      data: {
        session: { id: "session-1" },
        tool_schemas: [
          { tool_slug: "GOOGLEDRIVE_FIND_FOLDER", description: "Find a Drive folder" },
          { tool_slug: "GOOGLEDRIVE_LIST_CHILDREN_V2", description: "List folder children" },
        ],
      },
    });

    expect(instruction).toContain("Google Drive action lookup is complete");
    expect(instruction).toContain("session-1");
    expect(instruction).toContain("GOOGLEDRIVE_FIND_FOLDER");
    expect(instruction).toContain("COMPOSIO_MULTI_EXECUTE_TOOL");
  });

  it("returns nothing when the action lookup is incomplete", () => {
    expect(
      connectedAppPreflightInstruction({ appName: "Google Drive", data: { success: false } }),
    ).toBeUndefined();
  });

  it("requires a listed direct action once schemas are loaded", () => {
    const instruction = connectedAppPreflightInstruction({
      appName: "Google Drive",
      data: {
        session: { id: "session-1" },
        tool_schemas: [
          {
            tool_slug: "GOOGLEDRIVE_FIND_FOLDER",
            input_schema: { type: "object", properties: {} },
          },
        ],
      },
    });

    expect(instruction).toContain("direct action tool");
    expect(instruction).not.toContain("COMPOSIO_MULTI_EXECUTE_TOOL");
  });

  it("exposes only candidates with a concrete schema as direct action tools", () => {
    const actions = prefetchedConnectedAppActions({
      session: { id: "session-1" },
      tool_schemas: [
        {
          tool_slug: "GOOGLEDRIVE_FIND_FILE",
          description: "Find Drive files",
          input_schema: { type: "object", properties: { query: { type: "string" } } },
        },
        { tool_slug: "GOOGLEDRIVE_FIND_FOLDER", schemaRef: "later" },
      ],
    });

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      toolName: "connected_app_GOOGLEDRIVE_FIND_FILE",
      toolSlug: "GOOGLEDRIVE_FIND_FILE",
      sessionId: "session-1",
    });
  });

  it("does not expose duplicate actions when the catalog repeats a schema", () => {
    const actions = prefetchedConnectedAppActions({
      session: { id: "session-1" },
      tool_schemas: [
        { tool_slug: "GOOGLEDRIVE_FIND_FILE", input_schema: { type: "object" } },
        { tool_slug: "GOOGLEDRIVE_FIND_FILE", input_schema: { type: "object" } },
      ],
    });

    expect(actions.map((action) => action.toolName)).toEqual([
      "connected_app_GOOGLEDRIVE_FIND_FILE",
    ]);
  });

  it("resolves referenced schemas into direct actions without app-specific logic", () => {
    const initial = {
      session: { id: "session-1" },
      tool_schemas: [
        {
          tool_slug: "GOOGLEDRIVE_FIND_FOLDER",
          schemaRef: {
            tool: "COMPOSIO_GET_TOOL_SCHEMAS",
            args: { tool_slugs: ["GOOGLEDRIVE_FIND_FOLDER"] },
          },
        },
      ],
    };
    const resolved = {
      tool_schemas: [
        {
          tool_slug: "GOOGLEDRIVE_FIND_FOLDER",
          description: "Find folders",
          input_schema: { type: "object", properties: { query: { type: "string" } } },
        },
      ],
    };

    expect(connectedAppMissingSchemaSlugs(initial)).toEqual(["GOOGLEDRIVE_FIND_FOLDER"]);
    expect(
      prefetchedConnectedAppActions(mergeConnectedAppToolSchemas(initial, resolved)),
    ).toMatchObject([{ toolName: "connected_app_GOOGLEDRIVE_FIND_FOLDER" }]);
  });
});
