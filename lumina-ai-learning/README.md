# Lumina AI Learning Platform

> An AI-powered personalized learning application built with React and Google Gemini API

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-Active-brightgreen)

## 🎯 Overview

Lumina is a hyper-personalized learning platform that uses AI to adapt to individual learning styles and preferences. Built with React and powered by Google's Gemini API, it provides intelligent tutoring and content generation.

## ✨ Key Features

- **Dynamic Learning Summary Tool** - Intelligent document analysis and question answering
- **Persona-Driven Content Generator** - Personalized content creation based on user profiles
- **Multi-Tab Navigation** - Intuitive interface with three main learning tools
- **Real-time AI Assistance** - Powered by Google Gemini API
- **Fully Responsive Design** - Works seamlessly on desktop, tablet, and mobile

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm (or yarn/pnpm)
- Google Gemini API Key ([Get it here](https://aistudio.google.com/app/apikeys))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/TheMukeshDev/Lumina-AI.git
   cd Lumina-AI/lumina-ai-learning
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and add your Gemini API key:
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   The app will open at `http://localhost:3000`

## 📁 Project Structure

```
lumina-ai-learning/
├── src/
│   ├── LuminaApp.tsx                    # Main app component
│   ├── main.tsx                         # React entry point
│   ├── index.css                        # Global styles
│   ├── components/
│   │   ├── DynamicLearningSummaryTool.tsx
│   │   └── PersonaDrivenContentGenerator.tsx
│   └── tools/
│       ├── dynamicLearningSummaryTool.ts
│       └── personaDrivenContentGenerator.ts
├── public/                              # Static assets
├── docs/                                # Documentation
├── .env.example                         # Environment template
├── .env.local                           # ⚠️ Local secrets (not committed)
├── vite.config.ts                       # Vite configuration
├── tsconfig.json                        # TypeScript config
├── package.json                         # Dependencies & scripts
└── index.html                           # HTML entry point
```

## 🛠️ Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start development server at `localhost:3000` |
| `npm run build` | Build production bundle to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run TypeScript type checking |

## 🌐 Deployment

### Deploy to GitHub Pages

The project is configured for GitHub Pages deployment:

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Configure GitHub Pages**
   - Go to repository Settings → Pages
   - Set source to `Deploy from a branch`
   - Select `main` branch and `/root` folder

3. **View your site**
   ```
   https://TheMukeshDev.github.io/Lumina-AI
   ```

---

### Deploy to Vercel (recommended for serverless proxy & secure API keys)

Steps (quick):

1. **Create a new Vercel project** and import the GitHub repo.
2. On the import page use these settings:
   - **Root Directory**: `/` (leave blank) — the root `vercel.json` points to the subfolder
   - **Build Command**: `npm run build`
   - **Output Directory**: `lumina-ai-learning/dist`
3. **Root package.json** (recommended): add a top-level `package.json` with forwarded scripts so `npm run build` calls the subpackage build:

```json
{
  "scripts": {
    "build": "npm --prefix lumina-ai-learning run build",
    "dev": "npm --prefix lumina-ai-learning run dev",
    "preview": "npm --prefix lumina-ai-learning run preview"
  }
}
```

4. **Add environment variables** (Vercel Dashboard → Settings → Environment Variables):
   - **Key**: `GEMINI_API_KEY` (server only)
   - **Key (optional for client)**: `VITE_GEMINI_API_KEY` for local dev only (keep in `.env.local`)
5. **Deploy** and visit the generated Vercel URL.

Notes & troubleshooting:
- If Vercel prints a plain sentence instead of running `npm run build`, ensure the root `package.json` has the requested `build` script (see above).
- Avoid duplicate `builds` blocks in `lumina-ai-learning/vercel.json` — keep the root `vercel.json` authoritative.
- If you get 404/blank pages: check `Output Directory` and `routes` in `vercel.json`.

#### Vercel recommendations
Vercel offers several optional recommendations in the project UI that can improve build time and deployment safety:

- **Build Multiple Deployments Simultaneously** (On-Demand Concurrent Builds) — reduces queue times when many commits land.
- **Get builds up to 40% faster** (increase Build Machine size) — helpful for large builds or heavy dependency installs.
- **Prevent Frontend-Backend Mismatches** (Deployment Protection, Skew Protection) — sync client and server deployments to avoid runtime mismatches.

You can enable these from your Vercel Project → Settings → Build & Development (and Safety/Protection). Apply the ones that match your workflow and budget.

If you'd like a full step-by-step verification checklist, see the new `DEPLOYING_ON_VERCEL.md` in the repository root.

## 📚 Documentation

For detailed documentation, see the [docs/README.md](docs/README.md) or visit the following:

- **[Getting Started Guide](THEME2_QUICKSTART.md)** - Step-by-step tutorial
- **[Architecture Documentation](THEME2_ARCHITECTURE.md)** - System design details
- **[Setup Instructions](SETUP.md)** - Detailed setup guide
- **[User Guide](USER_GUIDE.md)** - How to use the platform

## 🔐 Security

- **API Keys**: Never commit `.env.local` to Git. Use `.env.example` as a template.
- **Environment Variables**: All API keys must be prefixed with `VITE_` to be safely exposed to the client.
- **`.gitignore`**: Automatically prevents sensitive files from being committed.

## 🛠️ Tech Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **AI API**: Google Gemini API
- **Animation**: Framer Motion
- **Icons**: Lucide React

## 📋 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

Contributions are welcome! Please ensure:

1. Follow the project structure guidelines
2. Keep environment variables in `.env.local`
3. Don't commit sensitive files
4. Test your changes locally with `npm run dev`

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 👤 Author

**Mukesh Dev**
- GitHub: [@TheMukeshDev](https://github.com/TheMukeshDev)

## 📞 Support

For issues, questions, or suggestions, please open a [GitHub Issue](https://github.com/TheMukeshDev/Lumina-AI/issues)

---

**Last Updated**: December 16, 2025

**Status**: ✅ Active & Maintained
