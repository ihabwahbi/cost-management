# 🚀 Quick Start - Development Tools

**Last Updated:** 2025-10-13

## ✅ All Tools Installed Successfully

This development environment is now fully equipped with all tools necessary for AI agent development.

## 🎯 Quick Reference

### Essential Commands

```bash
# Start Development
pnpm dev                                    # Starts all services

# Database Access  
pnpm --filter @cost-mgmt/db db:studio      # GUI (Drizzle Studio)
psql "postgresql://..."                     # Direct CLI access

# Code Search
rg "search-pattern"                         # Fast code search
tree -L 2                                   # Directory visualization

# GitHub Operations
gh pr create --fill                         # Create PR
gh pr status                                # Check PR status

# Type Safety
pnpm type-check                             # Check types across all packages

# Testing
pnpm test                                   # Run all tests
```

### 📦 Installed Tools

| Tool | Version | Command | Purpose |
|------|---------|---------|---------|
| Node.js | v22.20.0 | `node` | JavaScript runtime |
| pnpm | 10.16.1 | `pnpm` | Package manager (primary) |
| Turborepo | 2.5.8 | `turbo` | Monorepo orchestration |
| GitHub CLI | 2.81.0 | `gh` | GitHub operations |
| PostgreSQL | 16.10 | `psql` | Database client |
| Azure CLI | 2.77.0 | `az` | Azure management |
| ripgrep | ✓ | `rg` | Fast code search |
| jq | ✓ | `jq` | JSON processor |
| yq | v4.48.1 | `yq` | YAML processor |
| tree | v2.1.1 | `tree` | Directory viz |
| Docker | ✓ | `docker` | Containers |

### 🗄️ Database Connection

**Azure PostgreSQL Flexible Server**
- Server: `cost-management-db.postgres.database.azure.com`
- Database: `postgres`
- User: `iwahbi`
- Port: `5432`
- SSL: Required

```bash
# Connect with psql
psql "postgresql://iwahbi:PASSWORD@cost-management-db.postgres.database.azure.com:5432/postgres?sslmode=require"

# Or use Drizzle Studio (GUI)
cd packages/db && pnpm db:studio
```

### 🏗️ Project Structure

```
cost-management-hub/
├── apps/web/              → Next.js 14 app
├── packages/
│   ├── api/              → tRPC procedures
│   └── db/               → Drizzle ORM + schema
├── tools/
│   ├── cell-validator/   → Cell validation CLI
│   └── ledger-query/     → Ledger utilities
├── docs/                 → Documentation
│   └── ai-agent-development-tools.md  ← COMPLETE REFERENCE
└── ledger.jsonl         → Architectural ledger
```

### 🔧 Common Workflows

#### 1. Start Development

```bash
cd /workspace/projects/cost-management
pnpm install              # If first time
pnpm dev                  # Start all services
```

Access at: http://localhost:3000

#### 2. Create New Cell (Component)

```bash
# Create structure
mkdir -p apps/web/components/cells/my-cell/{__tests__,hooks,components}
cd apps/web/components/cells/my-cell

# Create files
touch component.tsx manifest.json pipeline.yaml

# Validate
cd ../../../../tools/cell-validator
pnpm validate ../../apps/web/components/cells/my-cell
```

#### 3. Create tRPC Procedure

```bash
# Create procedure file
cd packages/api/src/procedures/[domain]/
touch get-data.procedure.ts

# Test with curl
curl -X POST http://localhost:3000/api/trpc/domain.getData \
  -H "Content-Type: application/json" \
  -d '{"input":"value"}'
```

#### 4. Search Codebase

```bash
# Find all tRPC procedures
rg "publicProcedure" packages/api/

# Find Cell components
rg "Cell" apps/web/components/cells/

# Find god components (>400 lines) - ANDA violation
find apps/web/components -name "*.tsx" -exec sh -c 'lines=$(wc -l < "$1"); if [ $lines -gt 400 ]; then echo "$1: $lines"; fi' _ {} \;
```

#### 5. GitHub PR Workflow

```bash
# Create branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: Add feature"

# Push and create PR
git push origin feature/my-feature
gh pr create --fill

# Check PR status
gh pr status
```

#### 6. Database Operations

```bash
# Open GUI
pnpm --filter @cost-mgmt/db db:studio

# Generate migration
cd packages/db
pnpm db:generate

# Push to database
pnpm db:push

# Direct SQL
psql "postgresql://..." -c "SELECT * FROM projects LIMIT 5;"
```

### 📚 Documentation

**Complete Reference:** `docs/ai-agent-development-tools.md`  
**Architecture:** `docs/ai-native-codebase-architecture.md`  
**Workflow:** `docs/2025-10-10_anda-native-development-workflow.md`

### 🎓 ANDA Architecture Mandates

This project follows strict architectural mandates:

- **M-CELL-1:** All functionality MUST be Cells
- **M-CELL-2:** Complete atomic migrations (no parallel implementations)
- **M-CELL-3:** NO files > 400 lines (zero god components)
- **M-CELL-4:** All Cells MUST have behavioral contracts (manifest.json)

### 🔍 Before Any Development Task

```bash
# 1. Check database connectivity
psql "postgresql://..." -c "SELECT 1;"

# 2. Verify dev server running
curl http://localhost:3000/api/health

# 3. Check current structure
tree -L 2 -I "node_modules"

# 4. Type check
pnpm type-check

# 5. Query ledger for context
cat ledger.jsonl | jq -s '.[-5:]'  # Last 5 entries
```

### 🚨 Troubleshooting

**Build fails:**
```bash
pnpm clean
rm -rf node_modules pnpm-lock.yaml
pnpm install
turbo build --force
```

**Database connection fails:**
```bash
# Check firewall
az postgres flexible-server firewall-rule list \
  --resource-group cost-management-rg \
  --name cost-management-db
```

**GitHub CLI auth fails:**
```bash
gh auth logout
gh auth login
```

### 💡 Pro Tips for AI Agents

1. **Always check file sizes:** `wc -l file.tsx` (must be ≤400 lines)
2. **Use ripgrep, not grep:** `rg` is 10x faster
3. **Test APIs with curl:** Before implementing UI
4. **Query ledger first:** Context from previous implementations
5. **Use Drizzle Studio:** Visual database exploration
6. **Validate Cells:** Use cell-validator tool before committing

---

**Ready to develop!** 🎉

For detailed information on any tool, see `docs/ai-agent-development-tools.md`
