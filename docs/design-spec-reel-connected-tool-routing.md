# Design-spec reel: Use the right connected app

Status: `approved — implementation in progress`

Visual mockup: [`docs/mockups/connected-tool-routing.html`](./mockups/connected-tool-routing.html)

## Feature message

Ask Ari to work in a connected app and know it will use that app before opening a browser.

## Storyboard

### Beat 1 — Ask naturally

The user asks, “Find recent proposals in my Google Drive.” The normal chat transcript remains the
starting surface.

### Beat 2 — Choose the connected app

Rakazo recognizes that Google Drive is connected and shows `Using Google Drive` with
`Google Drive · Personal`. It does not open the computer screen.

### Beat 3 — Find the right action

Rakazo searches the connected app’s available Drive actions, then states the plain-language next action:
`Searching files`. The agent does not claim that Drive is unavailable merely because it has not yet
looked up a specific Drive action.

### Beat 4 — Use the intended account

When a default is saved, the activity names that Rakazo account label. When no default applies and
more than one account is possible, Ari asks a short account-choice question before acting.

### Beat 5 — Use browser only as a real fallback

If the connected app has no matching action or its call fails, Ari says why it is switching to browser control.
If browser control cannot help, it says that plainly instead of claiming the connector is absent.

## Interaction rules

- Classify an explicitly named connected app before the model starts a tool call.
- For a connected app request, guide the agent to search the connected app’s action catalog first, then use
  the returned action. Do not open browser tools first.
- Browser control remains available for sign-in, unsupported actions, an explicit browser request,
  or an honest connector failure.
- Never infer an account identity; show only the saved Rakazo account label and safe identity when
  present.
- The transcript and activity language describe the user’s task, never Composio tool slugs,
  provider IDs, arguments, credentials, or raw provider errors.

## Examples used by the rule

| User request | First tool path | Browser fallback |
| --- | --- | --- |
| “Find recent proposals in my Google Drive” | Search Drive file search/list actions, then execute the selected action. | Only if no matching action exists or its execution fails. |
| “Put this on my work calendar” | Use Calendar with the saved Work account. | Only for sign-in or an unsupported Calendar action. |
| “Open this website and click the export button” | Use browser control. | Not applicable; the request explicitly asks for browser work. |

## Implementation contract

- Add a deterministic connected-app routing instruction built from the actual connected providers,
  their Composio action-discovery tools, and the resolved account default.
- For a named connected provider, the instruction requires an action search before the agent may say
  that provider cannot perform the task.
- Emit a sanitized progress event for connector selection, action discovery, execution, and any
  browser fallback reason.
- Preserve the model’s ability to ask for an account choice and retain existing approval rules for
  mutations.
- Add executor-level regression coverage proving that a Drive request receives the Composio-first
  instruction and that an explicit browser request does not.
