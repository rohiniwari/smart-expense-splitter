# 💸 SplitSmart — AI-Powered Group Expense Splitter

A lightweight, full-featured web app to split shared expenses among groups — with AI-powered auto-categorization and spending insights powered by Claude (Anthropic).

🔗 **Live Demo**: [your-app.vercel.app](https://your-app.vercel.app)

---

## ✨ Features

### Core Features
- **Group Management** — Create multiple groups (trips, roommates, teams) and manage members
- **Add Expenses** — Log any expense with description, amount, and payer
- **Equal Split** — Automatically divide costs equally among selected participants
- **Custom Split** — Assign specific amounts to each person manually
- **Real-time Balances** — Instantly see who owes how much
- **Minimum Transactions** — Smart algorithm to settle all debts with the fewest transfers (greedy approach)

### 🤖 AI-Powered Features (Anthropic Claude)
- **Smart Auto-Categorization** — Blur the expense description field and Claude automatically detects the category (Food, Travel, Rent, Entertainment, etc.)
- **Spending Insights** — Click "Get Insights" to receive personalized, data-driven analysis of spending patterns, imbalances, and saving tips
- **Category Analytics** — Visual breakdown of expenses by category with percentage distribution

---

## 🏗 Architecture

```
smart-expense-splitter/
├── app/
│   ├── api/
│   │   └── ai/
│   │       ├── categorize/route.js   ← Server-side AI categorization
│   │       └── insights/route.js     ← Server-side spending insights
│   ├── globals.css
│   ├── layout.jsx
│   └── page.jsx
├── components/
│   └── ExpenseSplitter.jsx           ← Main UI component (~400 lines)
├── utils/
│   ├── calculations.js               ← Balance & settlement algorithms
│   └── constants.js                  ← Categories, colors, demo data
├── .env.example
└── README.md
```

**Tech Stack**: Next.js 14 (App Router) · React 18 · Tailwind CSS · Anthropic SDK · Lucide Icons

**Why Next.js?** The AI API key is kept secure in server-side API routes — it never reaches the browser.

---

## ⚖ Settlement Algorithm

Uses the **greedy minimum-transactions algorithm**:

1. Compute each member's net balance (total paid − total owed)
2. Separate into creditors (positive balance) and debtors (negative balance)
3. Sort both lists in descending order
4. Greedily match the largest creditor with the largest debtor, settling as much as possible in each step
5. Continue until all balances are settled

This guarantees the **minimum number of transactions** to fully settle the group.

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/smart-expense-splitter.git
cd smart-expense-splitter

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁ Deployment (Vercel)

1. Push your code to a public GitHub repository
2. Go to [vercel.com](https://vercel.com) → "New Project" → Import your repo
3. Under **Environment Variables**, add:
   ```
   ANTHROPIC_API_KEY = sk-ant-api03-...
   ```
4. Click **Deploy**

> Vercel automatically detects Next.js — no extra configuration needed.

---

## 🧠 AI Integration Details

### Auto-Categorization
- **Trigger**: When user finishes typing the expense description (onBlur)
- **Model**: `claude-sonnet-4-20250514`
- **Endpoint**: `POST /api/ai/categorize`
- **Response**: Single category string
- **Categories**: food · travel · rent · entertainment · shopping · utilities · health · other

### Spending Insights
- **Trigger**: On-demand via "Get Insights" button
- **Model**: `claude-sonnet-4-20250514`
- **Endpoint**: `POST /api/ai/insights`
- **Sends**: Expense list, member names, category totals
- **Returns**: Array of `{ insight: string, type: "info" | "warning" | "tip" }`

---

## 📸 Screenshots

| Expenses Tab | Balances Tab | AI Insights Tab |
|---|---|---|
| Add & manage expenses | Net balances + settlement plan | Category chart + AI insights |

---

## 📝 Evaluation Criteria Addressed

| Criteria | Implementation |
|---|---|
| Feature Completion | Groups, members, equal/custom splits, balances, settlements, AI categorization, AI insights |
| Code Quality | Modular components, separate utils, JSDoc comments, clean state management |
| Real-Time Performance | Instant balance recalculation on every state change, no loading for non-AI operations |
| AI Accuracy | Claude Sonnet 4 for both categorization and insights with structured prompts |
| UX & UI | Clean fintech-style design, responsive layout, smooth animations, contextual feedback |
| Bonus | Greedy minimum-transactions algorithm, AI insights with 3 insight types, category analytics |

---

*Built for NeevAI SuperCloud internship assignment · 2026*

---

## 🆕 v2 — Additional Features

| Feature | Details |
|---|---|
| **Expense Edit** | Pencil icon on each expense to edit any field inline |
| **Settle Up Button** | Mark individual settlements as paid, with undo support |
| **Export Summary** | Copy full expense + settlement summary to clipboard in one click |
| **Per-person Statements** | Balances tab shows Total Paid / Total Owed / Net Balance per member |
| **Search & Filter** | Real-time search bar + category filter on the Expenses tab |
| **Stats Header Cards** | Total Spend · Avg Per Person · Top Spender · Top Category shown at glance |
| **Persistent Storage** | All data auto-saved to localStorage — survives page refresh |
| **AI Natural Language Chat** | 4th tab: ask questions like "Who owes the most?" in plain English |
