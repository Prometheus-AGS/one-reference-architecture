+++
id = "pkg-manager-pnpm"
title = "Package Manager Standards"
scope = "project"
target_audience = ["developers", "ai-assistants"]
status = "active"
priority = "high"
tags = ["pnpm", "package-management", "dependencies"]
version = "1.0.0"
created_date = "2025-01-24"
+++

# Package Manager Standards

## Primary Rule: pnpm Only

**MANDATORY**: This project uses `pnpm` as the exclusive package manager. Never use `npm` or `yarn`.

### Commands to Use:
- `pnpm install` - Install dependencies
- `pnpm add <package>` - Add new dependency
- `pnpm add -D <package>` - Add dev dependency  
- `pnpm remove <package>` - Remove dependency
- `pnpm run <script>` - Run package.json scripts
- `pnpm update` - Update dependencies

### Commands to NEVER Use:
- ❌ `npm install`
- ❌ `npm add`
- ❌ `yarn install`
- ❌ `yarn add`

### Rationale:
- pnpm provides better disk space efficiency through hard linking
- Faster installations compared to npm/yarn
- Better dependency resolution and hoisting
- Stricter dependency management prevents phantom dependencies
- Consistent with our monorepo workspace structure

### Workspace Configuration:
The project uses pnpm workspaces as defined in `pnpm-workspace.yaml`. Always respect workspace boundaries and dependencies.