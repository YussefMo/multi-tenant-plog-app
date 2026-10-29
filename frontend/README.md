# Frontend Workspace

pnpm workspace for the four Vite applications.

```text
apps/owner        http://localhost:3000
apps/tenant       http://localhost:3001
apps/user         http://localhost:3002
apps/visualizer   http://localhost:3003
```

Run everything from the repository root:

```bash
pnpm install
pnpm dev               # all four apps
pnpm dev:frontend
pnpm dev:owner
pnpm dev:tenant
pnpm dev:user
pnpm dev:visualizer
pnpm typecheck:frontend
pnpm build:frontend
```

The owner, tenant, and user apps are Phase 1 placeholders. `apps/visualizer` is the completed System Atlas: architecture map, request and file catalogs, journeys, ERD, table explorer, command atlas, and presenter mode. See `apps/visualizer/README.md`.

## Dependency catalog

All shared dependency and dev-dependency versions live in the root `pnpm-workspace.yaml` under `catalog:`. Apps reference them with `"catalog:"` instead of repeating version ranges.

To add or bump a package:

1. Update the version in `pnpm-workspace.yaml`.
2. Use `"catalog:"` in the app `package.json`.
3. Run `pnpm install`.

## Type checking

Type checking uses `tsgo` from `@typescript/native-preview`, the Go-native TypeScript checker. Each app includes `vite.config.ts` in its `tsconfig.json`, so config files are typechecked too.

If pnpm reports `no @pnpm/exe.linux-x64 native binary was found for this host`, install a native Linux pnpm and keep package-manager version management disabled:

```bash
rm -f ~/.local/bin/pnpm ~/.local/bin/pnpx
npm install -g pnpm@12.15.0 --prefix ~/.local --force
hash -r
which pnpm
pnpm -v
```

`which pnpm` should point to a Linux path such as `/home/youssef/.local/bin/pnpm` or `/home/youssef/.local/share/pnpm/bin/pnpm`, not `/mnt/c/...`.
