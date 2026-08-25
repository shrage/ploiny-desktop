import type { ConnectorTool } from "@rakazo/adapter-kit";
import { describe, expect, it } from "vitest";
import {
  connectedAppRoutingInstruction,
  connectedAppRoutingPlan,
} from "./connected-app-routing.js";

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
    expect(instruction).toContain("matching Google Drive action");
    expect(instruction).not.toContain("COMPOSIO_SEARCH_TOOLS");
    expect(instruction).toContain("Do not use computer or browser tools first");
    expect(instruction).toContain("Never tell the user the integration is unavailable");
    expect(instruction).toContain("Find recent proposals in my Google Drive");
  });

  it("keeps the generic action tools needed to finish an on-demand app action", () => {
    const executeAction: ConnectorTool = {
      name: "COMPOSIO_MULTI_EXECUTE_TOOL",
      description: "Execute a discovered action",
      inputSchema: { type: "object", properties: {} },
      route: { connectorId: "composio", toolName: "COMPOSIO_MULTI_EXECUTE_TOOL" },
    };

    const plan = connectedAppRoutingPlan({
      request: "Find recent proposals in my Google Drive",
      apps: [{ connectorId: "composio", provider: "googledrive", displayName: "Google Drive" }],
      tools: [actionSearch, executeAction],
    });

    expect(plan?.appToolNames).toEqual(["COMPOSIO_SEARCH_TOOLS", "COMPOSIO_MULTI_EXECUTE_TOOL"]);
  });

  it("does not fall back to browser tools when a named app's actions are temporarily unavailable", () => {
    const plan = connectedAppRoutingPlan({
      request: "Find the top-level folders in my Google Drive",
      apps: [{ connectorId: "composio", provider: "googledrive", displayName: "Google Drive" }],
      tools: [],
    });

    expect(plan?.app.displayName).toBe("Google Drive");
    expect(plan?.appToolNames).toEqual([]);
    expect(plan?.withholdComputerTools).toBe(true);
    expect(plan?.instruction).toContain("could not be loaded");
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

  it("holds computer controls until a named connected app action has been attempted", () => {
    const plan = connectedAppRoutingPlan({
      request: "Find the top-level folders in my Google Drive",
      apps: [{ connectorId: "composio", provider: "googledrive", displayName: "Google Drive" }],
      tools: [
        {
          name: "GOOGLEDRIVE_FIND_FOLDER",
          description: "Find a folder",
          inputSchema: { type: "object", properties: {} },
          route: {
            connectorId: "composio",
            toolName: "GOOGLEDRIVE_FIND_FOLDER",
            resourceId: "googledrive",
          },
        },
      ],
    });

    expect(plan?.app.displayName).toBe("Google Drive");
    expect(plan?.appToolNames).toEqual(["GOOGLEDRIVE_FIND_FOLDER"]);
    expect(plan?.withholdComputerTools).toBe(true);
  });
});
