# Project Structure Guide

This document explains the refined project structure optimized for GitHub Pages hosting.

## 📦 Repository Structure

```
Lumina-AI/                          # Repository root
├── lumina-ai-learning/             # Main application (Vite + React)
│   ├── src/                        # Source code
│   │   ├── LuminaApp.tsx           # Main app component (3-tab navigation)
│   │   ├── main.tsx                # React entry point
│   │   ├── index.css               # Global styles
│   │   ├── components/
│   │   │   ├── DynamicLearningSummaryTool.tsx
│   │   │   └── PersonaDrivenContentGenerator.tsx
│   │   └── tools/
│   │       ├── dynamicLearningSummaryTool.ts
│   │       └── personaDrivenContentGenerator.ts
│   │
│   ├── public/                     # Static assets (copied to dist/)
│   │   ├── .nojekyll              # Prevents Jekyll on GitHub Pages
│   │   └── favicon.ico            # (optional) Website icon
│   │
│   ├── docs/                       # Documentation
│   │   ├── README.md              # Documentation index
│   │   └── assets/                # (optional) Doc images
│   │
│   ├── index.html                  # HTML entry point
│   ├── vite.config.ts             # Vite build config (base: '/Lumina-AI/')
│   ├── tsconfig.json              # TypeScript configuration
│   ├── package.json               # Dependencies & scripts
│   ├── .env.example               # Environment template
│   ├── .env.local                 # ⚠️ Local secrets (NOT committed)
│   ├── .gitignore                 # Git ignore rules
│   ├── README.md                  # Project README
│   ├── HOSTING_GUIDE.md           # GitHub Pages setup guide
│   ├── THEME2_QUICKSTART.md       # Quick start tutorial
│   ├── THEME2_ARCHITECTURE.md     # Technical architecture
│   ├── SETUP.md                   # Setup instructions
│   └── USER_GUIDE.md              # How to use the platform
│
├── .github/
│   └── workflows/
│       └── deploy.yml             # GitHub Actions auto-deploy workflow
│
├── README.md                       # Repository root README
├── .gitignore                      # Root git ignore rules
└── package-lock.json              # Dependency lock file

```

## 🎯 Key Points

### Directory Organization

| Directory | Purpose |
|-----------|---------|
| `lumina-ai-learning/src/` | All React components and TypeScript code |
| `lumina-ai-learning/public/` | Static files (favicon, .nojekyll, etc.) |
| `lumina-ai-learning/docs/` | Documentation files |
| `lumina-ai-learning/dist/` | Build output (git-ignored, generated on build) |
| `.github/workflows/` | GitHub Actions CI/CD automation |

### Important Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Configures Vite build with `base: '/Lumina-AI/'` |
| `package.json` | Dependencies and build scripts |
| `.env.example` | Template for environment variables |
| `.env.local` | Actual secrets (git-ignored, not committed) |
| `.gitignore` | Prevents sensitive files from being committed |
| `.nojekyll` | Disables Jekyll processing on GitHub Pages |

## 🚀 GitHub Pages Deployment

### Setup
1. Configure GitHub Pages in repo Settings → Pages
2. Select source: `main` branch, `/root` folder
3. Automatic deployment runs on every push

### How It Works
1. GitHub Actions runs workflow from `.github/workflows/deploy.yml`
2. Builds project with `npm run build` (outputs to `dist/`)
3. Uploads `dist/` folder to GitHub Pages
4. Site is live at `https://TheMukeshDev.github.io/Lumina-AI/`

### Base Path Configuration
The `vite.config.ts` must have:
```typescript
base: '/Lumina-AI/'
```
This matches the repository name and ensures proper routing.

## 🔐 Security

### Environment Variables
- **`.env.local`** - Stores actual API keys (git-ignored)
- **`.env.example`** - Template file (safe to commit)
- Never commit `.env.local` - it's protected by `.gitignore`

### Sensitive Files
Automatically protected by `.gitignore`:
- `node_modules/`
- `dist/` (build output)
- `.env` and `.env.local`
- `*.log` files

## 📊 Build Process

```bash
# Development
npm run dev         # Starts dev server at localhost:3000

# Production Build
npm run build       # Creates optimized bundle in dist/

# Preview
npm run preview     # Preview production build locally
```

## 📝 Scripts in package.json

| Script | Purpose |
|--------|---------|
| `dev` | Start Vite dev server |
| `build` | Build production bundle |
| `preview` | Preview build locally |
| `lint` | TypeScript type checking |

## ✅ Pre-Deployment Checklist

- [ ] All source code in `src/` directory
- [ ] Static assets in `public/` directory
- [ ] Documentation in `docs/` directory
- [ ] `.env.local` in `.gitignore` ✓
- [ ] `vite.config.ts` has correct `base` path
- [ ] `.github/workflows/deploy.yml` exists
- [ ] GitHub Pages configured correctly
- [ ] `.nojekyll` in `public/` folder

## 🔧 Customization

### Change Repository Name
If you fork/rename the repo, update:
1. `vite.config.ts`: `base: '/new-repo-name/'`
2. `package.json`: `"homepage": "https://github.../new-repo-name"`
3. `README.md`: Update all deployment URLs

### Add Static Assets
Place in `public/` folder:
- Favicons
- Robots.txt
- Manifest.json
- Images
- Any non-processed files

## 📚 Documentation Structure

All documentation files in `lumina-ai-learning/`:
- `README.md` - Main project README
- `HOSTING_GUIDE.md` - GitHub Pages deployment guide
- `THEME2_QUICKSTART.md` - Tutorial
- `THEME2_ARCHITECTURE.md` - Technical design
- `SETUP.md` - Setup instructions
- `USER_GUIDE.md` - Platform usage guide
- `docs/README.md` - Documentation index

## 🎓 Learning Resources

- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
- [GitHub Pages Guide](https://docs.github.com/pages)
- [GitHub Actions Guide](https://docs.github.com/actions)

---

**Last Updated**: December 16, 2025

**Status**: ✅ Optimized for GitHub Pages Hosting
