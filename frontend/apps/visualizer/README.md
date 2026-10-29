# System Atlas

Standalone Vite + React + TypeScript visualizer for the Multi Tenant Plog API. It runs on port `3003` and is also built to `public/system-map` for static hosting.

## Run

```bash
pnpm dev:visualizer     # http://localhost:3003
pnpm atlas:validate     # reference integrity
pnpm build:visualizer   # writes public/system-map
```

Requests are regenerated from Laravel on `predev`, `pretypecheck`, `prebuild`, and `prevalidate`. The generated file is gitignored.

## Surfaces

| Route        | Purpose                                                |
| ------------ | ------------------------------------------------------ |
| `#/`         | Architecture map and node inspector                    |
| `#/requests` | 60 generated API operations, searchable and filterable |
| `#/files`    | Purpose catalog for every relevant backend file        |
| `#/journeys` | Playable feature journeys and cross-cutting systems    |
| `#/models`   | ERD, model explorer, and table explorer                |
| `#/commands` | Artisan command atlas and daily schedule               |
| `#/present`  | Presenter mode                                         |

Deep links are stable:

```text
#/journeys/tenant-provisioning/transaction
#/models?model=Subscription
#/models?tab=tables&table=posts
#/commands?command=tenants%3Apurge
#/requests?path=%2Fapi%2Fv1%2Fposts
#/present/journeys/stripe-webhook/invoices
```

## Data modules

- `src/data/journeys.ts` — journeys and cross-cutting systems. Each step carries actor, request, middleware, request class, controller, service, models, table impacts, response, errors, files, and speaker notes.
- `src/data/models.ts` — the 13 Eloquent models, columns, relations, readers/writers, system tables, and ERD edges.
- `src/data/commands.ts` — commands, options, writes, external calls, schedules, and output.
- `src/data/files.json` — the file catalog. Every path must exist and have a purpose.
- `src/data/generated/requests.generated.json` — generated from `php artisan route:list --json --except-vendor`.

## Adding a journey

1. Add a `Journey` object to `src/data/journeys.ts` with a unique `id`, `kind: 'journey'` or `'system'`, actors, preconditions, outcome, files, and steps.
2. Give each step a unique `id` inside that journey.
3. Use `request: { method, path }` only when the step maps to a real route. Paths must match the generated catalog exactly, including `{post}` placeholders.
4. Add `tables` entries for every read, insert, update, delete, or upsert. Table names must exist in `models.ts` or `systemTables`.
5. Reference only catalogued files in `files` and `step.files`.
6. Run `pnpm atlas:validate` and `pnpm typecheck:frontend`.

## Adding a model or table

1. Add a `ModelRecord` to `models.ts` with the model file, table, columns, relations, readers, and writers.
2. Keep relation targets inside the model list.
3. For non-model tables (sessions, cache, password reset tokens), add a `TableRecord` to `systemTables`.
4. Add the model or table to the relevant journeys and commands so readers/writers stay honest.
5. Run `composer ide-helper` after backend model changes, then `pnpm atlas:validate`.

## Adding a command

1. Add a `CommandRecord` to `commands.ts`.
2. List every table write with an operation and detail.
3. List external calls (Stripe, mail, queues) and whether the command is idempotent.
4. If it is scheduled, add a `ScheduleRecord` to `schedules`.
5. Run `pnpm atlas:validate`.

## Validation contract

`pnpm atlas:validate` fails when:

- A catalogued file is duplicated or missing on disk.
- A request controller file is not catalogued.
- A journey step points at an unknown request, model, table, or file.
- A journey or step id is duplicated.
- A model relates to an unknown model or has an unknown table.
- A command writes to an unknown table.

The validator reads the TypeScript data modules as plain arrays, so no build step is needed before validation.

## Presenter mode

| Key                        | Action                |
| -------------------------- | --------------------- |
| `→` / `Space` / `PageDown` | Next step or item     |
| `←` / `PageUp`             | Previous step or item |
| `↑` / `↓`                  | Previous / next item  |
| `1`                        | Journeys              |
| `2`                        | Models                |
| `3`                        | Commands              |
| `4`                        | Requests              |
| `F`                        | Toggle focus mode     |
| `Esc`                      | Exit presenter        |

Journey steps show speaker notes. Switching collections keeps the current journey, model, command, or request.

## Suggested presentation flow

1. Overview: trace the architecture map from frontends to databases.
2. Owner login: session realm and owner guard.
3. Tenant provisioning: tenant, admin, hashed invitation, mail.
4. Invitation acceptance: raw token, password, burned invitation.
5. Tenant login: role-aware redirect and `tenant.active`.
6. Post lifecycle: draft, publish, unpublish, soft delete.
7. Viewer directory: the deliberate `TenantScope` bypass.
8. Permission resync: role ∪ profile ∪ extras.
9. Support access: ticket, hidden user, audit row, idle timeout.
10. Checkout and webhook: Stripe-hosted payment and the idempotent mirror.
11. Billing metrics: MRR, revenue, refunds, disputes, timeline.
12. Tenant lifecycle: soft delete, blocked traffic, restore, 30-day purge.
13. Cross-cutting systems: session realms, tenant isolation, error envelope, docs.
14. Models and commands: finish on the ERD and the purge command.

## Static build

`pnpm build:visualizer` writes `public/system-map` with relative asset paths and hash routing. Serve it from Laravel at `/system-map/`. The directory is gitignored and regenerated on every build.

## Accessibility and layout

- Responsive down to 320px: the journey index and table index stack, and detail grids collapse.
- Presenter controls are keyboard-driven and the focus mode hides chrome.
- `prefers-reduced-motion` disables animations and transitions.
- Links expose the destination in text; request and file deep links are plain anchors.
