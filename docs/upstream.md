# Upstream and divergence contract

This repository is the managed Ploiny for Atavya desktop fork. Rakazo remains an active source of
ideas, fixes, provider support, and computer-runtime improvements; it is not the authority for
Atavya identity, permissions, policy, audit, or orchestration.

## Repository identity

| Role | Repository / remote | Contract |
| --- | --- | --- |
| Product fork | `shrage/ploiny-desktop` / `origin` | Ploiny for Atavya product history and reviewed changes. |
| Upstream | `elie222/rakazo` / `upstream` | Read-only source for reviewed intake. |
| Atavya | `shrage/atavya` | Canonical people, conversations, work, permissions, policy, and audit. |

GitHub repository names are case-insensitive. The shorter `shrage/ploiny` name is unavailable
because `shrage/Ploiny` is an existing private product repository; it is unrelated to this fork and
must not be renamed, overwritten, or used as an upstream remote.

The fork already existed as `shrage/rakazo`. On 2026-09-02 its existing history and branches were
retained under the canonical `shrage/ploiny-desktop` name. Its default branch was a strict ancestor
of upstream with no fork-only commits, so it was fast-forwarded from `2f734bb0` to the baseline
below. Existing topic branches were not deleted or rewritten.

## Recorded baseline

- Review date: 2026-09-02
- Upstream default branch: `main`
- Upstream baseline: `0f5c4cefd59cdbe440deb7e05fd3f503164a6068`
- Previously audited behavior/UI harvest: `63899e3ded3c97a517891818e83132eca3dcb981`
- Reviewed delta after that audit: one upstream appearance commit (`63899e3..0f5c4ce`), adding
  System / Light / Dark support across shared tokens, web, and mobile
- Upstream release/tag at review: none published
- License: Apache-2.0; preserve `LICENSE`, source headers, attribution, and applicable NOTICE duties

The baseline is reproducible only when the recorded SHA and lockfile are used together. Baseline
verification results belong in the M0 task/PR notes; a failed check blocks product work but does not
justify rewriting upstream history.

### Windows baseline verification

Run on 2026-09-02 with Node 24.19.0 and pnpm 9.15.0:

- `pnpm install --frozen-lockfile`: passed. The optional `cpu-features` and `ssh2` native
  accelerators could not compile because the host Visual Studio installation lacks ClangCL; pnpm
  completed with their supported JavaScript fallbacks.
- `pnpm lint`: passed with one pre-existing Android contract warning and two simplification notices.
- `pnpm check`: passed, 20/20 tasks.
- `pnpm build`: passed, 4/4 tasks. The upstream build reports its existing large-web-chunk and Astro
  `@source` minifier warnings.
- `pnpm test` before the first fork fix: 2,239 passed, 35 failed, 118 skipped. Six failures were a
  real Windows local-sandbox descriptor bug: ordinary file creation reached `NtCreateFile` with an
  invalid HANDLE because Node's libuv descriptor was treated as a CRT descriptor.
- `pnpm test` after the fix: 2,245 passed, 29 failed, 118 skipped. The focused ordinary Windows
  create-and-replace regression passes.

The 29 remaining failures are the recorded upstream Windows-compatibility backlog: 12 Linux-only
updater path fixtures, 10 tests that cannot create symlinks without Windows developer/elevated
privileges, three Unix executable-bit expectations, two process-tree cleanup races, one Linux
`env`/`sleep` Python harness, and one native directory-swap expectation whose operation remains
inside the held directory handle. They are not treated as a green suite; each must be fixed,
platform-gated, or proven on its intended OS before its area is promoted into a Ploiny milestone.

## Intake policy

1. Fetch both remotes and compare the recorded baseline with `upstream/main`.
2. Create a temporary branch named `integration/upstream-YYYYMMDD-<short-sha>`.
3. Classify every relevant change as **adopt**, **adapt**, or **decline** and record the reason in the
   intake task or PR.
4. Run the untouched upstream checks first, then the Atavya adapter contract tests. Security,
   sandbox, auth, data-integrity, provider, and desktop-release changes receive explicit review.
5. Land selected changes as one coherent reviewed update. Do not auto-merge upstream, reset product
   history to upstream, or force-push shared branches.
6. Update this file when the accepted upstream SHA or a code-zone classification changes.

The initial baseline fast-forward is the only whole-history synchronization. Once product commits
exist, upstream is harvested selectively through integration branches.

## Change dispositions

| Disposition | Meaning | Examples |
| --- | --- | --- |
| **Adopt** | Keep close to upstream with minimal product adjustment. | Accessibility, rendering, provider compatibility, secret redaction, sandbox and desktop reliability. |
| **Adapt** | Preserve the useful behavior behind an explicit Ploiny/Atavya contract. | Thread events, messages, approvals, identities, group waves, routines, artifacts, and computer leases. |
| **Decline** | Keep the Ploiny/Atavya rule and document why upstream does not fit. | Rakazo-local identity or storage assumptions, first-member-only ambient routing, and effects that bypass Atavya authorization. |

## Divergence map

### Mirrored

- Electron and mobile shell mechanics that do not encode product authority
- Generic computer/sandbox provider contracts and provider-specific adapters
- Model-provider compatibility, rendering, accessibility, and low-level reliability utilities
- Upstream tests that pin those reusable contracts

Local edits in mirrored zones should be rare and easy to rebase conceptually.

### Adapted

- Thread and message presentation through an `AtavyaThreadEvents` compatibility seam
- Typed message blocks through the versioned `bodyContent.blocks` envelope
- Runtime identity, auth, skills, memory, routines, approvals, evidence, artifacts, and computers
- Web and desktop presentation translated into Atavya's design system and product vocabulary

Adapted behavior keeps a narrow contract test at the seam. Atavya internals must not spread through
the fork's UI and provider code.

### Replaced

- Canonical people, organization membership, conversation, work, permission, policy, and audit data
- Ambient group-wave arbitration and its durable journal
- Standing locks, information-flow enforcement, artifact accepted-version pointers, effect
  reservations, expiring grants, and evidence freshness
- Any direct external effect path that can bypass Atavya authorization and receipts

For replaced zones, upstream changes are design input, not patches to merge.

## Non-negotiable boundaries

- Atavya remains the source of truth for identity and authority.
- Provider and linked-computer secrets never enter Git, message bodies, client-visible URLs, or
  screenshots. Store only opaque references and short-lived authorized session handles.
- Runtime proposals do not perform effects. Atavya reserves, authorizes, executes, and receipts
  consequential actions.
- Keep web, Electron, and Expo mobile packages in the repository. Unsupported surfaces may remain
  unbuilt during an MVP, but deleting them requires a measured maintenance reason.
- A visible fork UI change still requires its approved design-spec reel and the applicable product
  design-system review before implementation.
