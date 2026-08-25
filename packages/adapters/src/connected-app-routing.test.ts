import type { ConnectorTool } from "@rakazo/adapter-kit";
import { describe, expect, it } from "vitest";
import { connectedAppRoutingInstruction } from "./connected-app-routing.js";

const actionSearch: ConnectorTool = {
  name: "COMPOSIO_SEARCH_TOOLS",
  description: "Search connected app actions",
  inputSchema: { type: "object", properties: {} },
  route: { connectorId: "composio", toolName: "COMPOSIO_SEARCH_TOOLS" },
};

describe("connected app routing", () => {
  it("routes a named Drive request through connected-app action search before browser tools", () => {
    const instruction = connectedAppRoutingInstruction({
      request: "Find recent proposals in my Google Drive",
      apps: [{ connectorId: "composio", provider: "googledrive", displayName: "Google Drive" }],
      tools: [actionSearch],
    });

    expect(instruction).toContain("Google Drive");
    expect(instruction).toContain("COMPOSIO_SEARCH_TOOLS");
    expect(instruction).toContain("Do not use computer or browser tools first");
    expect(instruction).toContain("Never tell the user the integration is unavailable");
    expect(instruction).toContain("Find recent proposals in my Google Drive");
  });

  it("gives Calendar the same connected-app-first rule", () => {
    const instruction = connectedAppRoutingInstruction({
      request: "Put this on my work calendar",
      apps: [
        { connectorId: "composio", provider: "googlecalendar", displayName: "Google Calendar" },
      ],
      tools: [actionSearch],
    });

    expect(instruction).toContain("Google Calendar");
    expect(instruction).toContain("saved account default");
  });

  it("does not override an explicit browser request", () => {
    expect(
      connectedAppRoutingInstruction({
        request: "Open Google Drive in the browser and click Export",
        apps: [{ connectorId: "composio", provider: "googledrive", displayName: "Google Drive" }],
        tools: [actionSearch],
      }),
    ).toBeUndefined();
  });
});
