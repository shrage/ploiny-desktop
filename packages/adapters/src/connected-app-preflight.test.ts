import { describe, expect, it } from "vitest";
import { connectedAppPreflightInstruction } from "./connected-app-preflight.js";

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
});
