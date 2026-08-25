import type { ConnectorTool } from "@rakazo/adapter-kit";

type ConnectedApp = {
  connectorId: string;
  provider: string;
  displayName: string;
};

export type ConnectedAppRoutingPlan = {
  app: ConnectedApp;
  instruction: string;
  appToolNames: string[];
  withholdComputerTools: true;
};

export function connectedAppRoutingInstruction(input: {
  request: string;
  apps: ConnectedApp[];
  tools: ConnectorTool[];
}): string | undefined {
  return connectedAppRoutingPlan(input)?.instruction;
}

export function connectedAppRoutingPlan(input: {
  request: string;
  apps: ConnectedApp[];
  tools: ConnectorTool[];
}): ConnectedAppRoutingPlan | undefined {
  if (isExplicitBrowserRequest(input.request)) return undefined;

  const app = input.apps.find((candidate) => requestMentionsApp(input.request, candidate));
  if (!app) return undefined;

  const searchTool = input.tools.find(
    (tool) =>
      tool.route?.connectorId === "composio" && /(?:^|\.)COMPOSIO_SEARCH_TOOLS$/i.test(tool.name),
  );
  const directTools = input.tools.filter(
    (tool) =>
      tool.route?.connectorId === "composio" &&
      tool.route.resourceId?.trim().toLowerCase() === app.provider.trim().toLowerCase(),
  );
  const actionsAvailable = Boolean(searchTool) || directTools.length > 0;

  const firstStep = !actionsAvailable
    ? `${app.displayName} actions could not be loaded for this request. Do not use computer or browser tools as a substitute; explain that the ${app.displayName} integration needs to be retried or reconnected.`
    : searchTool
      ? `Begin by calling ${searchTool.name} to find the ${app.displayName} action that matches the request.`
      : `Begin by choosing the listed ${app.displayName} tool that matches the request.`;

  const instruction = [
    "CONNECTED-APP ROUTING (internal instruction):",
    `The user explicitly asked about ${app.displayName}, which is connected. ${firstStep}`,
    actionsAvailable
      ? "Do not use computer or browser tools first. After an action is found, use its returned schema and execute it through the connected app."
      : "Keep this request on the connected-app path; do not attempt browser work.",
    "Use the saved account default when one applies. If multiple accounts could apply and no default or request selects one, ask a short account-choice question before acting.",
    actionsAvailable
      ? "Never tell the user the integration is unavailable until the connected-app action search has been attempted. Browser control is allowed only when that search has no matching action, the connected-app action fails, or the user explicitly requests browser work."
      : "The action catalog has already been attempted. Do not claim that browser sign-in would fix it.",
    `In user-facing language, say “${app.displayName}” or “${app.displayName} integration”; never mention internal connector framework names, provider IDs, or raw tool names.`,
    "Examples: “Find recent proposals in my Google Drive” starts by finding a Drive file action. “Put this on my work calendar” uses the saved Work calendar account. “Open this website and click Export” uses browser control because it explicitly asks for browser work.",
  ].join("\n");

  return {
    app,
    instruction,
    appToolNames: (searchTool
      ? input.tools.filter(
          (tool) =>
            tool.route?.connectorId === "composio" &&
            tool.route.resourceId?.trim().toLowerCase() !== app.provider.trim().toLowerCase(),
        )
      : directTools
    ).map((tool) => tool.name),
    withholdComputerTools: true,
  };
}

function isExplicitBrowserRequest(request: string): boolean {
  return /\b(?:in|using|with)\s+(?:the\s+)?browser\b|\b(?:website|web page|url)\b|\bclick\b/i.test(
    request,
  );
}

function requestMentionsApp(request: string, app: ConnectedApp): boolean {
  const normalizedRequest = request.toLowerCase();
  const normalizedName = app.displayName.trim().toLowerCase();
  if (normalizedName && normalizedRequest.includes(normalizedName)) return true;
  const terms = normalizedName
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length >= 4 && term !== "google" && term !== "microsoft");
  return terms.some((term) => new RegExp(`\\b${escapeRegExp(term)}\\b`, "i").test(request));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
