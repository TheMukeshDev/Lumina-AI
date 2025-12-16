# 🚀 Quick Reference Card

## Essential Commands

```bash
# Development
npm install              # Install dependencies
npm run dev             # Start dev server (localhost:3000)

# Production
npm run build           # Build for production (outputs to dist/)
npm run preview         # Preview production build

# Maintenance
npm run lint            # TypeScript type checking
```

## File Locations

| What | Where |
|------|-------|
| React Code | `src/` |
| Components | `src/components/` |
| Business Logic | `src/tools/` |
| Styles | `src/index.css` |
| Static Assets | `public/` |
| Documentation | `docs/` and root `.md` files |
| Build Output | `dist/` (auto-generated) |
| API Keys | `.env.local` (⚠️ never commit) |

## GitHub Pages Deployment

### Initial Setup (One Time)
1. Go to repo → **Settings** → **Pages**
2. Set: `main` branch, `/root` folder
3. Save

### Deploy (Every Commit)
```bash
git add .
git commit -m "Your message"
git push origin main
# ✅ Automatic deployment via GitHub Actions!
```

### View Your Site
```
https://TheMukeshDev.github.io/Lumina-AI/
```

## Environment Setup

```bash
# 1. Create local env file
cp .env.example .env.local

# 2. Edit .env.local (add your API key)
VITE_GEMINI_API_KEY=your_key_here

# 3. Never commit .env.local (it's in .gitignore)
```

## Project Structure (Simplified)

```
lumina-ai-learning/
├── src/              # React code
├── public/           # Static files
├── docs/             # Documentation
├── dist/             # Build output (git-ignored)
├── .env.local        # ⚠️ Local secrets (git-ignored)
├── .env.example      # Template (safe to commit)
├── vite.config.ts    # Build config
├── package.json      # Dependencies
└── README.md         # Project info
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | `npm install` then `npm run build` |
| Site shows 404 | Check `vite.config.ts` has `base: '/Lumina-AI/'` |
| Changes not showing | Hard refresh: `Ctrl+Shift+R` |
| GitHub Pages not updating | Check **Actions** tab for workflow errors |

## Key Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Build configuration |
| `package.json` | Dependencies & scripts |
| `.env.example` | Environment template |
| `.env.local` | ⚠️ Local secrets |
| `.github/workflows/deploy.yml` | Auto-deployment |

## Important Reminders

- ⚠️ **Never commit** `.env.local`
- ✅ **Always use** `npm install` before building
- ✅ **Check** `vite.config.ts` base path matches repo name
- ✅ **Configure** GitHub Pages in Settings
- ✅ **Push** to `main` branch for auto-deployment

---

**Last Updated**: December 16, 2025
