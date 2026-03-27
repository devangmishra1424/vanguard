<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/activity.svg" alt="ReportRaahat Logo" width="80" height="80">
  <h1 align="center">ReportRaahat</h1>
  <p align="center">
    <strong>Transforming complex medical reports into a gamified, personalized health journey.</strong>
  </p>
</div>

---

## 🎯 The Vision & Project Status

Our mission with ReportRaahat is to build a comprehensive engine consisting of 5 core modules. **We are incredibly close to completion**, with the vast majority of the core engine and UI fully operational.

Here is the exact breakdown of our current progress:

### ✅ Module 1: Report Analyzer
*Upload, parse, and visualize any medical report.*
- **Status: COMPLETED**
- **Details:** The system successfully processes lab values, extracts critical organ and dietary flags (e.g., Anemia, Liver issues), and instantly visualizes the data via beautiful UI components, dynamic status bars, and intricate radar charts.

### 🟡 Module 2: AI Doctor Chatbot
*Ask follow-up questions like talking to a doctor.*
- **Status: IN PROGRESS / PARTIAL**
- **Details:** The health summaries and avatar interface are successfully built into the dashboard. We are currently finalizing the continuous LLM chat integration to allow seamless back-and-forth Q&A regarding the uploaded report.

### ✅ Module 3: Nutrition & Diet Planner
*Personalized Indian food nutrient profiles.*
- **Status: COMPLETED**
- **Details:** The nutrition lab is fully functional. It leverages a dataset of over 1,000 distinct Indian food items to provide real-time, autocomplete food logging. Daily macro targets adjust specifically to the user's uploaded medical flags, and the system intelligently warns users via a dynamic UI when consuming contra-indicated junk foods.

### ✅ Module 4: Exercise & Mental Wellness
*Adaptive plans based on health condition.*
- **Status: COMPLETED**
- **Details:** The exercise engine successfully generates dynamic, 7-day adaptive workout regimens tailored strictly to the user's medical report. It features an intelligent safety-tiering architecture that blocks/warns against high-intensity activities if the user's report indicates vulnerability (e.g., severe anemia).

### ✅ Module 5: Gamified Health Avatar
*XP system, health bar, visual progression.*
- **Status: COMPLETED**
- **Details:** Driven by a robust `Zustand` persistence state architecture (`reportraahat-v2`), the application successfully isolates session-based daily progress from long-term XP history. Gamification includes dynamic levelling, an avatar progression interface, micro-animations (confetti), and a responsive 7-day XP chart.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS, Framer Motion, Shadcn UI
- **State Management:** Zustand (with custom `persist` strategies for gamification vs. ephemeral medical data)
- **Data Visualization:** Recharts
- **Data Engine:** Custom CSV-backed API routing for 0-latency nutrition queries

## 🚀 Getting Started

To run the platform locally:

```bash
# 1. Clone the repository
git clone https://github.com/devangmishra1424/vanguard.git

# 2. Enter directory
cd reportraahat

# 3. Install dependencies
npm install

# 4. Start the localized gamification engine
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
