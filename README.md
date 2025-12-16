# 🎓:  Lumina - AI-Powered Learning Assistant

**Hackathon Submission** | Team **Codestrom** | Google Gemini API Challenge

**Lumina** transforms learning through AI-powered analysis. Upload images of learning materials—diagrams, notes, or screenshots—and get instant summaries, quizzes, and explanations powered by **Google's Gemini API**.

---

## 👥 Team Information

| Role | Name |
|------|------|
| **Team Name** | Codestrom |
| **Team Leader** | Mukesh Kumar |
| **Members** | Deepa Tiwari, Sakshi Gupta |

---


### 🎯 Core Capabilities
- **Smart Image Analysis**: Upload any visual learning material and get AI-powered analysis
- **Intelligent Summaries**: Automatically generates concise, context-aware summaries
- **Key Concepts Extraction**: Identifies and explains important entities from your content
- **Memorable Analogies**: Creates relatable real-world analogies for complex concepts
- **Interactive Quizzes**: Generates 3-question knowledge checks with instant feedback
- **Text-to-Speech**: Listen to summaries with AI voice narration
- **Concept Explanations**: Click any concept to get detailed, contextual explanations
- **Quiz Analysis**: Get explanations for wrong answers to understand misconceptions

### 🎨 User Experience
- **Dark Mode UI**: Beautiful, modern dark interface with gradient accents
- **Smooth Animations**: Framer Motion transitions and effects
- **Mobile Responsive**: Fully responsive design for all devices
- **Real-time Feedback**: Interactive quiz with color-coded responses
- **Intuitive Controls**: Drag-and-drop file upload with visual feedback

## � What Makes Lumina Special

### Features
✅ **Smart Image Analysis** - Upload diagrams, notes, screenshots  
✅ **AI Summaries** - Auto-generated study guides  
✅ **Interactive Quizzes** - 3-question knowledge checks  
✅ **Text-to-Speech** - Listen to content  
✅ **Concept Deep-Dives** - Click to explain any term  
✅ **Dynamic Learning Tool** - Upload documents → Get 5 complex questions  
✅ **Persona-Based Generator** - Generate content with consistent AI personas  
✅ **80% Fewer API Calls** - Intelligent batching & optimization  
✅ **Multi-Variant Generation** - Get 1-5 content variants in one call  

---

## ⚡ Quick Start (5 minutes)

### Prerequisites

Before starting, you need:
- **Node.js 16+** - Download from [nodejs.org](https://nodejs.org)
- **Gemini API Key** - Get free at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### Installation

```bash
# 1. Navigate to project directory
cd lumina-ai-learning

# 2. Install dependencies
npm install

# 3. Create .env.local file with your API key
echo "VITE_GEMINI_API_KEY=your_api_key_here" > .env.local

# 4. Start development server
npm run dev

# 5. Open http://localhost:3000 in your browser
```

✅ **That's it!** Your app is running.

---

## 🔐 API Key Setup (Mandatory Security)


### Step-by-Step Setup

1. **Get Your API Key**:
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Click "Create API Key"
   - Copy the generated key

2. **Create `.env.local` File**:
   ```bash
   # Create in project root directory
   VITE_GEMINI_API_KEY=sk-...your-actual-key...
   ```

3. **Verify `.gitignore` Protection**:
   ```bash
   # .gitignore should contain:
   .env
   .env.local
   .env.*.local
   node_modules/
   dist/
   ```

4. **For Production**:
   - Use environment secrets in your hosting platform
   - **Vercel**: Add in dashboard → Settings → Environment Variables
   - **Netlify**: Add in dashboard → Site settings → Build & deploy → Environment
   - **Never** hardcode API keys in source code

---

## 🎨 Theme - Advanced Features

Lumina now includes two powerful AI-powered tools:

### 🎓 **Dynamic Learning Summary Tool (DLT)**

Upload any document (PDF, TXT) and get:
- **5 Complex Questions** with progressive difficulty levels
- **Smart Evaluation** with scoring (0-100)
- **3 Specific Suggestions** for improvement per answer
- **Optimized for** educators and students

### ✨ **Persona-Driven Content Generator**

Generate consistent AI-written content:
- **4 Preset Personas**: TechWriter, MarketingPro, TutorBot, CodeArchitect
- **6 Content Types**: Code, Marketing, Docs, Creative, Explanation, Custom
- **Multi-Variant Generation**: Get 1-5 variants in ONE API call
- **Quality Metrics**: Coherence, relevance, readability scores

📖 **[Complete Theme 2 Documentation](./THEME2_DOCUMENTATION_INDEX.md)** | **[Quick Start Guide](./THEME2_QUICKSTART.md)**

---

## 🛠 Technical Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18.2 + TypeScript 5 + Tailwind CSS |
| **Animations** | Framer Motion |
| **Build** | Vite 5.0 |
| **AI Backend** | Google Gemini 2.0 Flash API |
| **Icons** | Lucide React |

---

## 📊 API Usage

### Core Models
- **`gemini-2.0-flash`**: Content analysis, question generation, explanations
- **Gemini TTS**: Text-to-speech conversion

### API Efficiency
- **Theme **: 1-3 API calls per image analysis . 1 API call for multi-variant generation (vs 5+ traditionally)
- **Total Optimization**: 80% reduction in API calls vs baseline approach

---

## � Project Structure

```
lumina-ai-learning/
├── src/
│   ├── LuminaApp.tsx                    # Main app (3-tab navigation)
│   ├── main.tsx                         # Entry point
│   ├── index.css                        # Global styles
│   ├── components/
│   │   ├── DynamicLearningSummaryTool.tsx    # Theme 2: Document QA
│   │   └── PersonaDrivenContentGenerator.tsx # Theme 2: Content Creator
│   └── tools/
│       ├── dynamicLearningSummaryTool.ts     # DLT logic
│       └── personaDrivenContentGenerator.ts  # Persona logic
├── public/                              # Static files
├── THEME2_DOCUMENTATION_INDEX.md       # Docs navigation hub
├── THEME2_QUICKSTART.md                # Theme 2 tutorials
├── THEME2_ARCHITECTURE.md              # Technical design
├── package.json                        # Dependencies
├── vite.config.ts                      # Build config
├── tsconfig.json                       # TypeScript config
├── .env.local                          # ⚠️ NOT committed - API keys only
└── .gitignore                          # Protects sensitive files
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| **`npm run dev` not found** | Make sure you're in `lumina-ai-learning` directory, not parent folder |
| **API Key not working** | 1) Check `.env.local` exists, 2) Verify key at [aistudio.google.com](https://aistudio.google.com) |
| **"Cannot find module 'react'"** | Run `npm install` to install all dependencies |
| **Build fails with errors** | Run `npm run build` to see detailed TypeScript errors |
| **Blank page loads** | Open browser console (F12) and check for errors |

---

## 📚 Documentation

- **[THEME2_DOCUMENTATION_INDEX.md](./THEME2_DOCUMENTATION_INDEX.md)** - Full documentation hub
- **[THEME2_QUICKSTART.md](./THEME2_QUICKSTART.md)** - Step-by-step tutorials
- **[THEME2_ARCHITECTURE.md](./THEME2_ARCHITECTURE.md)** - System design & optimization
- **[THEME2_IMPLEMENTATION.md](./THEME2_IMPLEMENTATION.md)** - Feature reference

---



## 🔗 GitHub Repository

This is a public repository with:
- ✅ Clear README with setup instructions (you're reading it!)
- ✅ Mandatory API Key security disclaimer (see above)
- ✅ `.env.local` in `.gitignore` (keys never exposed)
- ✅ Complete project structure
- ✅ All dependencies in `package.json`

**To clone this repository**:
```bash
git clone https://github.com/TheMukeshdev/lumina-ai.git
cd lumina-ai
npm install
echo "VITE_GEMINI_API_KEY=your_key" > .env.local
cd lumina-ai-learning
npm run dev
```

---

## 📄 License

Created for the **Gemini Blitz Hackathon** by Team Codestrom. Open source.

---

## 🙏 Acknowledgments

- **Google Gemini API** - AI backbone powering the application
- **React & Vite** - Frontend framework and build tool
- **Tailwind CSS** - Modern, responsive styling
- **Framer Motion** - Beautiful animations and transitions

---

## 📞 Support & Questions

- **Setup issues?** → See [Quick Start](#-quick-start-5-minutes) and [Prerequisites](#prerequisites)
- **API problems?** → Check [API Key Setup](#-api-key-setup-mandatory-security)
- **Technical details?** → Read [THEME2_ARCHITECTURE.md](./THEME2_ARCHITECTURE.md)
- **Contact Me** → [Mukesh Kumar](t.me/themukeshdev)

---

**Built with ❤️ for Mukesh**
