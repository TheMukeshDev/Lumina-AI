# GitHub Pages Hosting Guide

This guide will help you deploy Lumina AI to GitHub Pages.

## ✅ Prerequisites

- Repository pushed to GitHub
- GitHub Actions enabled (default)
- Node.js 16+ installed locally

## 🚀 Setup Steps

### Step 1: Repository Setup

Make sure your repository structure is correct:
```
Lumina-AI/
├── lumina-ai-learning/       # Your Vite project
│   ├── src/
│   ├── public/
│   ├── dist/                 # (Build output, git-ignored)
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
├── .github/
│   └── workflows/
│       └── deploy.yml        # Auto deployment workflow
└── ...
```

### Step 2: Configure GitHub Pages

1. Go to your repository: **Settings** → **Pages**
2. Set the following:
   - **Source**: Deploy from a branch
   - **Branch**: `main`
   - **Folder**: `/root`
3. Click **Save**

GitHub will now automatically deploy from the root of your `main` branch.

### Step 3: Automatic Deployment

The `.github/workflows/deploy.yml` workflow will:

1. Trigger on every push to `main` branch
2. Install dependencies
3. Run TypeScript linter
4. Build the project
5. Deploy to GitHub Pages

Your site will be live at:
```
https://TheMukeshDev.github.io/Lumina-AI/
```

## 🔧 Configuration Files

### vite.config.ts
```typescript
export default defineConfig({
  base: '/Lumina-AI/',  // Must match repo name
  build: {
    outDir: 'dist',     // GitHub Actions will upload this
  }
})
```

### package.json
```json
{
  "homepage": "https://TheMukeshDev.github.io/Lumina-AI",
  "scripts": {
    "build": "tsc && vite build"
  }
}
```

## 🔐 Environment Variables

**Important**: API keys are NOT stored in GitHub!

### Local Development
1. Create `.env.local` in `lumina-ai-learning/`
2. Add your API keys (these are `.gitignore`'d)

### GitHub Actions
If you need environment variables in CI/CD:
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add secrets for any sensitive data
4. Reference in workflow: `${{ secrets.SECRET_NAME }}`

Example in workflow:
```yaml
- name: Build project
  env:
    VITE_API_KEY: ${{ secrets.GEMINI_API_KEY }}
  run: npm run build
```

## 📊 Monitoring Deployment

### View Workflow Status
1. Go to **Actions** tab
2. See the "Deploy to GitHub Pages" workflow
3. Check logs for any errors

### View Deployment History
1. Go to **Settings** → **Pages**
2. Scroll to "Deployments" section
3. See all previous deployments

## 🐛 Troubleshooting

### Build Fails
Check the workflow logs:
1. Go to **Actions** tab
2. Click the failed workflow run
3. See detailed error messages

Common issues:
- **Build errors**: Fix locally with `npm run build`
- **Missing files**: Check `.gitignore` isn't excluding needed files
- **Node version**: Ensure Node 18+ is used

### Site Not Updated
1. Verify push was successful: `git log --oneline`
2. Check workflow ran: **Actions** tab
3. Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
4. Clear browser cache if persistent

### 404 on Subpages
Ensure `base` in `vite.config.ts` is set correctly:
```typescript
base: '/Lumina-AI/'  // Not '/lumina-ai-learning/'
```

## 🔄 Manual Deployment

To deploy manually without GitHub Actions:

```bash
cd lumina-ai-learning
npm run build
cd dist
git add -A
git commit -m "Deploy to GitHub Pages"
git push origin main
```

Then set GitHub Pages source to `main` branch, `/root` folder.

## 📚 Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## ✅ Checklist

Before deployment:
- [ ] All code committed to `main` branch
- [ ] `.env.local` is in `.gitignore`
- [ ] No API keys in version control
- [ ] `vite.config.ts` has correct `base` path
- [ ] `package.json` has correct `homepage`
- [ ] `.github/workflows/deploy.yml` exists
- [ ] GitHub Pages configured for `/root` folder

---

**Last Updated**: December 16, 2025
