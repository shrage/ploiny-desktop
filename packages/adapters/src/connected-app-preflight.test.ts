import { describe, expect, it } from "vitest";
import {
  connectedAppPreflightInstruction,
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
});
