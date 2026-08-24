import { describe, expect, it } from "vitest";
import { composioAccountIdentity } from "./composio-account-identity.js";

describe("composioAccountIdentity", () => {
  it("prefers a provider-supplied email over the connection alias", () => {
    expect(
      composioAccountIdentity({
        alias: "Personal calendar",
        data: { email_address: "owner@example.test" },
      }),
    ).toBe("owner@example.test");
  });

  it("uses other generic account identity fields without provider-specific handling", () => {
    expect(
      composioAccountIdentity({
        state: { profile: { account_name: "Smilowitz Inc." } },
      }),
    ).toBe("Smilowitz Inc.");
  });

  it("never treats credentials or values nested below credential keys as an identity", () => {
    expect(
      composioAccountIdentity({
        data: {
          access_token: { email: "must-not-be-displayed@example.test" },
          refreshToken: "secret-value",
        },
      }),
    ).toBeUndefined();
  });
});
