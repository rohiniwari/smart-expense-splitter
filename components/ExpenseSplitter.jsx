"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus, Receipt, DollarSign, Sparkles, ArrowRight,
  Trash2, Check, Loader2, Users, MessageCircle,
  Search, Pencil, Download, X, Send, TrendingUp,
  Moon, Sun, Image as ImageIcon,
} from "lucide-react";
import html2canvas from "html2canvas";
import {
  calculateBalances, getSettlements, getCategorySpend,
  getMemberStats, getGroupStats, formatINR, uid,
} from "@/utils/calculations";
import { CATEGORIES, AVATAR_COLORS, DEMO_DATA } from "@/utils/constants";

// ─── Storage key
const STORAGE_KEY = "splitsmart_data_v1";

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ name, size = "sm" }) {
  const initials = name.trim().split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const c = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  const dim =
    size === "lg" ? "w-10 h-10 text-sm"
    : size === "md" ? "w-8 h-8 text-xs"
    : size === "xs" ? "w-5 h-5 text-[9px]"
    : "w-7 h-7 text-xs";
  return (
    <div className={`${dim} ${c.bg} ${c.text} rounded-full flex items-center justify-center font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
}

function CategoryBadge({ category }) {
  const c = CATEGORIES[category] || CATEGORIES.other;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
      <span className="text-[11px]">{c.icon}</span> {c.label}
    </span>
  );
}

function StatCard({ label, value, sub, color = "text-gray-800 dark:text-gray-200" }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 shadow-sm">
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${color} leading-tight`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Expense Form (shared between Add and Edit) ────────────────────────────

function ExpenseForm({ form, setForm, members, onSave, onCancel, categorizing, title }) {
  const perPerson =
    form.splitType === "equal" && form.participants.length > 0 && form.amount
      ? (parseFloat(form.amount || 0) / form.participants.length).toFixed(2)
      : null;
  const customSum = Object.values(form.customSplits).reduce((s, v) => s + parseFloat(v || 0), 0);
  const customValid = form.amount && Math.abs(customSum - parseFloat(form.amount || 0)) < 0.01;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-5 fade-in shadow-sm">
      <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">{title}</h3>
      <div className="grid grid-cols-2 gap-4">

        {/* Description */}
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description</label>
          <div className="relative">
            <input
              autoFocus type="text" placeholder="e.g. Dinner at restaurant"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              onBlur={(e) => form.onDescBlur?.(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-9"
            />
            {categorizing && <Loader2 className="absolute right-2.5 top-2.5 w-4 h-4 text-teal-500 animate-spin" />}
          </div>
          {form.category !== "other" && !categorizing && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <CategoryBadge category={form.category} />
              <span className="text-xs text-gray-400 dark:text-gray-500">AI detected</span>
            </div>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Amount (₹)</label>
          <input
            type="number" min="0" step="0.01" placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Paid by */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Paid by</label>
          <select
            value={form.paidBy}
            onChange={(e) => setForm((p) => ({ ...p, paidBy: e.target.value }))}
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>

        {/* Category override */}
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Category</label>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setForm((p) => ({ ...p, category: key }))}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  form.category === key
                    ? `${cat.bg} ${cat.text} ${cat.border}`
                    : "bg-white dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Split type */}
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Split type</label>
          <div className="flex gap-2">
            {["equal", "custom"].map((t) => (
              <button
                key={t}
                onClick={() => setForm((p) => ({ ...p, splitType: t }))}
                className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  form.splitType === t
                    ? "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900 dark:text-teal-300 dark:border-teal-700"
                    : "bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                }`}
              >
                {t === "equal" ? "Equal split" : "Custom split"}
              </button>
            ))}
          </div>
        </div>

        {/* Equal — participants */}
        {form.splitType === "equal" && (
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Split among</label>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => {
                const selected = form.participants.includes(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        participants: selected
                          ? p.participants.filter((id) => id !== m.id)
                          : [...p.participants, m.id],
                      }))
                    }
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      selected
                        ? "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900 dark:text-teal-300 dark:border-teal-700"
                        : "bg-white dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                    }`}
                  >
                    {selected && <Check className="w-3 h-3" />} {m.name}
                  </button>
                );
              })}
            </div>
            {perPerson && <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">₹{perPerson} per person</p>}
          </div>
        )}

        {/* Custom — per-person amounts */}
        {form.splitType === "custom" && (
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Custom amounts</label>
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-2">
                  <Avatar name={m.name} size="xs" />
                  <span className="text-sm text-gray-600 dark:text-gray-300 w-20 flex-shrink-0">{m.name}</span>
                  <input
                    type="number" min="0" step="0.01" placeholder="0.00"
                    value={form.customSplits[m.id] || ""}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, customSplits: { ...p.customSplits, [m.id]: e.target.value } }))
                    }
                    className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1 text-sm outline-none focus:border-teal-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              ))}
            </div>
            {form.amount && (
              <p className={`text-xs mt-2 font-medium ${customValid ? "text-teal-600 dark:text-teal-400" : "text-orange-500 dark:text-orange-400"}`}>
                Total: ₹{customSum.toFixed(2)} / ₹{parseFloat(form.amount || 0).toFixed(2)} {customValid && "✓"}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-5">
        <button onClick={onSave} className="flex-1 py-2.5 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 transition-colors">
          {title === "Edit Expense" ? "Save Changes" : "Add Expense"}
        </button>
        <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ExpenseSplitter() {

  // ── Persisted state ────────────────────────────────────────────────────────

  const [groups, setGroups] = useState(() => {
    if (typeof window === "undefined") return DEMO_DATA.groups;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).groups : DEMO_DATA.groups;
    } catch { return DEMO_DATA.groups; }
  });

  const [expenses, setExpenses] = useState(() => {
    if (typeof window === "undefined") return DEMO_DATA.expenses;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).expenses : DEMO_DATA.expenses;
    } catch { return DEMO_DATA.expenses; }
  });

  const [settledTxns, setSettledTxns] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).settledTxns || [] : [];
    } catch { return []; }
  });

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ groups, expenses, settledTxns }));
    } catch (_) {}
  }, [groups, expenses, settledTxns]);

  // ── UI state ───────────────────────────────────────────────────────────────

  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || null);
  const [activeTab, setActiveTab] = useState("expenses");

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // Expense form
  const [expForm, setExpForm] = useState(null);
  const [categorizing, setCategorizing] = useState(false);

  // AI: insights
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightError, setInsightError] = useState(null);

  // AI: chat
  const [chatHistory, setChatHistory] = useState([
    { role: "assistant", content: "Hi! I can answer questions about your group expenses. Try asking: *\"Who spent the most?\"* or *\"What's the biggest category?\"*" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Export feedback
  const [exported, setExported] = useState(false);

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("darkMode") === "true";
  });

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

  // ── Derived data ──────────────────────────────────────────────────────────

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const memberMap = {};
  selectedGroup?.members.forEach((m) => (memberMap[m.id] = m.name));

  const allGroupExpenses = expenses.filter((e) => e.groupId === selectedGroupId);
  const filteredExpenses = allGroupExpenses.filter((e) => {
    const matchSearch = e.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = filterCategory === "all" || e.category === filterCategory;
    return matchSearch && matchCat;
  });

  const balances = selectedGroup ? calculateBalances(selectedGroup, expenses) : {};
  const allSettlements = selectedGroup ? getSettlements(balances, selectedGroup.members) : [];
  const pendingSettlements = allSettlements.filter(
    (t) => !settledTxns.some((s) => s.from === t.from && s.to === t.to && Math.abs(s.amount - t.amount) < 0.01)
  );
  const memberStats = selectedGroup ? getMemberStats(selectedGroup, expenses) : {};
  const groupStats = selectedGroup ? getGroupStats(selectedGroup, expenses) : null;
  const catSpend = getCategorySpend(allGroupExpenses);
  const totalSpend = allGroupExpenses.reduce((s, e) => s + e.amount, 0);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const makeBlankForm = (group) => ({
    description: "", amount: "", paidBy: group.members[0]?.id || "",
    splitType: "equal", participants: group.members.map((m) => m.id),
    customSplits: {}, category: "other",
    onDescBlur: handleDescBlur,
  });

  async function handleDescBlur(value) {
    if (!value || value.trim().length < 3) return;
    setCategorizing(true);
    try {
      const res = await fetch("/api/ai/categorize", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: value }),
      });
      const data = await res.json();
      setExpForm((p) => ({ ...p, category: data.category || "other" }));
    } catch (_) {}
    finally { setCategorizing(false); }
  }

  // ── Group / member actions ─────────────────────────────────────────────────

  const createGroup = () => {
    if (!newGroupName.trim()) return;
    const g = { id: uid(), name: newGroupName.trim(), members: [] };
    setGroups((prev) => [...prev, g]);
    setSelectedGroupId(g.id);
    setNewGroupName(""); setShowCreateGroup(false);
    resetAI();
  };

  const addMember = () => {
    if (!newMemberName.trim()) return;
    setGroups((prev) =>
      prev.map((g) =>
        g.id === selectedGroupId
          ? { ...g, members: [...g.members, { id: uid(), name: newMemberName.trim() }] }
          : g
      )
    );
    setNewMemberName(""); setShowAddMember(false);
  };

  const removeMember = (mId) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === selectedGroupId ? { ...g, members: g.members.filter((m) => m.id !== mId) } : g
      )
    );
  };

  // ── Expense actions ────────────────────────────────────────────────────────

  const openAddForm = () => {
    if (!selectedGroup || selectedGroup.members.length === 0) {
      alert("Please add at least one member first."); return;
    }
    setExpForm(makeBlankForm(selectedGroup));
    setEditingExpenseId(null);
    setShowExpenseForm(true);
  };

  const openEditForm = (expense) => {
    setExpForm({
      description: expense.description,
      amount: String(expense.amount),
      paidBy: expense.paidBy,
      splitType: expense.splitType,
      participants: [...expense.participants],
      customSplits: { ...expense.customSplits },
      category: expense.category,
      onDescBlur: handleDescBlur,
    });
    setEditingExpenseId(expense.id);
    setShowExpenseForm(true);
  };

  const validateAndSave = () => {
    const amount = parseFloat(expForm.amount);
    if (!expForm.description.trim() || isNaN(amount) || amount <= 0 || !expForm.paidBy) {
      alert("Please fill in all required fields."); return;
    }
    if (expForm.splitType === "equal" && expForm.participants.length === 0) {
      alert("Please select at least one participant."); return;
    }
    if (expForm.splitType === "custom") {
      const sum = Object.values(expForm.customSplits).reduce((s, v) => s + parseFloat(v || 0), 0);
      if (Math.abs(sum - amount) > 0.01) {
        alert(`Custom splits must add up to ₹${amount.toFixed(2)}. Current: ₹${sum.toFixed(2)}`); return;
      }
    }

    const payload = {
      description: expForm.description.trim(), amount,
      paidBy: expForm.paidBy, splitType: expForm.splitType,
      participants: [...expForm.participants],
      customSplits: Object.fromEntries(
        Object.entries(expForm.customSplits).map(([k, v]) => [k, parseFloat(v || 0)])
      ),
      category: expForm.category,
      date: new Date().toISOString().split("T")[0],
    };

    if (editingExpenseId) {
      setExpenses((prev) =>
        prev.map((e) => e.id === editingExpenseId ? { ...e, ...payload } : e)
      );
    } else {
      setExpenses((prev) => [...prev, { id: uid(), groupId: selectedGroupId, ...payload }]);
    }

    setShowExpenseForm(false);
    setEditingExpenseId(null);
    resetAI();
  };

  const deleteExpense = (id) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    resetAI();
  };

  // ── Settle up ──────────────────────────────────────────────────────────────

  const markSettled = (txn) => {
    setSettledTxns((prev) => [
      ...prev,
      { ...txn, settledAt: new Date().toISOString(), groupId: selectedGroupId },
    ]);
  };

  const unmarkSettled = (txn) => {
    setSettledTxns((prev) =>
      prev.filter((s) => !(s.from === txn.from && s.to === txn.to && Math.abs(s.amount - txn.amount) < 0.01))
    );
  };

  // ── Export ─────────────────────────────────────────────────────────────────

  const exportSummary = () => {
    if (!selectedGroup) return;
    const lines = [
      `💸 ${selectedGroup.name} — Expense Summary`,
      `Generated: ${new Date().toLocaleDateString("en-IN")}`,
      `─────────────────────────────────`,
      `Total spend: ₹${totalSpend.toLocaleString("en-IN")}`,
      ``,
      `📋 Expenses:`,
      ...allGroupExpenses.map(
        (e) => `• ${e.description} — ₹${e.amount} (paid by ${memberMap[e.paidBy]})`
      ),
      ``,
      `⚖ Settlements:`,
      ...allSettlements.map((t) => `• ${t.from} → ${t.to}: ${formatINR(t.amount)}`),
    ];
    navigator.clipboard?.writeText(lines.join("\n")).then(() => {
      setExported(true);
      setTimeout(() => setExported(false), 2000);
    });
  };

  const exportAsImage = async () => {
    const element = document.getElementById('export-summary');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `${selectedGroup.name}-expense-summary.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error exporting image:', error);
    }
  };

  // ── AI actions ─────────────────────────────────────────────────────────────

  const resetAI = () => { setInsights(null); };

  const fetchInsights = async () => {
    if (allGroupExpenses.length === 0) return;
    setLoadingInsights(true); setInsights(null); setInsightError(null);
    try {
      const res = await fetch("/api/ai/insights", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group: selectedGroup, expenses }),
      });
      const data = await res.json();
      setInsights(data.insights);
    } catch (_) { setInsightError("Failed to load insights. Please try again."); }
    finally { setLoadingInsights(false); }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");

    const newHistory = [...chatHistory, { role: "user", content: userMsg }];
    setChatHistory(newHistory);
    setChatLoading(true);

    try {
      // Build history without the initial assistant greeting
      const apiHistory = newHistory
        .filter((h) => !(h.role === "assistant" && h.content.startsWith("Hi!")))
        .map((h) => ({ role: h.role, content: h.content }));

      const res = await fetch("/api/ai/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          group: selectedGroup,
          expenses,
          history: apiHistory.slice(0, -1), // exclude the message we just added
        }),
      });
      const data = await res.json();
      setChatHistory((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (_) {
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally { setChatLoading(false); }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="w-full lg:w-56 bg-white dark:bg-gray-800 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-gray-700 flex flex-col flex-shrink-0 shadow-sm">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 lg:border-b-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm bg-teal-500">₹</div>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">SplitSmart</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">AI Expense Splitter</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Groups</span>
            <button onClick={() => setShowCreateGroup((v) => !v)}
              className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors">
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {groups.map((g) => (
            <button key={g.id}
              onClick={() => { setSelectedGroupId(g.id); resetAI(); setShowExpenseForm(false); setSearchQuery(""); setFilterCategory("all"); }}
              className={`w-full text-left p-2.5 rounded-lg mb-1 transition-colors ${selectedGroupId === g.id ? "bg-teal-50 text-teal-700" : "text-gray-600 hover:bg-gray-50"}`}>
              <p className="text-sm font-medium">{g.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{g.members.length} members · {expenses.filter(e=>e.groupId===g.id).length} expenses</p>
            </button>
          ))}

          {showCreateGroup && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100 fade-in">
              <input autoFocus type="text" placeholder="Group name" value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createGroup()}
                className="w-full text-sm border border-gray-200 rounded-md px-2.5 py-1.5 mb-2 outline-none focus:border-teal-400" />
              <div className="flex gap-1.5">
                <button onClick={createGroup} className="flex-1 text-xs bg-teal-500 text-white rounded-md py-1.5 hover:bg-teal-600 font-medium">Create</button>
                <button onClick={() => setShowCreateGroup(false)} className="flex-1 text-xs border border-gray-200 text-gray-500 rounded-md py-1.5 hover:bg-gray-100">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      {selectedGroup ? (
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Header */}
          <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 lg:px-6 py-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
              <div className="flex-1">
                <h1 className="text-lg font-semibold text-gray-800 dark:text-white">{selectedGroup.name}</h1>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {selectedGroup.members.map((m) => (
                    <div key={m.id} className="relative group/av">
                      <Avatar name={m.name} />
                      <button onClick={() => removeMember(m.id)} title={`Remove ${m.name}`}
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-400 text-white rounded-full text-[8px] hidden group-hover/av:flex items-center justify-center">✕</button>
                    </div>
                  ))}
                  <button onClick={() => setShowAddMember((v) => !v)}
                    className="w-7 h-7 rounded-full border-2 border-dashed border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-400 hover:border-teal-400 hover:text-teal-500 transition-colors">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                {showAddMember && (
                  <div className="flex flex-col sm:flex-row gap-2 mt-3 fade-in">
                    <input autoFocus type="text" placeholder="Member name" value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addMember()}
                      className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 outline-none focus:border-teal-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full sm:w-44" />
                    <div className="flex gap-2">
                      <button onClick={addMember} className="px-3 py-1.5 bg-teal-500 text-white text-sm rounded-lg hover:bg-teal-600 font-medium">Add</button>
                      <button onClick={() => setShowAddMember(false)} className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
              {/* Export buttons and dark mode toggle */}
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setDarkMode(!darkMode)}
                  className="p-2 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <button onClick={exportSummary}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-xs rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  {exported ? <><Check className="w-3 h-3 text-teal-500" /> Copied!</> : <><Download className="w-3 h-3" /> Copy</>}
                </button>
                <button onClick={exportAsImage}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-xs rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <ImageIcon className="w-3 h-3" /> Save Image
                </button>
              </div>
            </div>

            {/* Stats row */}
            {groupStats && allGroupExpenses.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <StatCard label="Total spend" value={`₹${groupStats.totalSpend.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} />
                <StatCard label="Avg per person" value={`₹${groupStats.avgPerPerson.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} />
                <StatCard label="Top spender" value={groupStats.highestSpender?.name || "—"}
                  sub={groupStats.highestSpender ? `₹${groupStats.highestSpender.amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })} paid` : ""} color="text-teal-600 dark:text-teal-400" />
                <StatCard label="Top category"
                  value={groupStats.topCategory ? (CATEGORIES[groupStats.topCategory.name]?.icon + " " + CATEGORIES[groupStats.topCategory.name]?.label) : "—"}
                  sub={groupStats.topCategory ? `₹${groupStats.topCategory.amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : ""} />
              </div>
            )}
          </header>

          {/* Tabs */}
          <nav className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 lg:px-6 flex gap-3 lg:gap-5 overflow-x-auto">
            {[
              { id: "expenses", label: "Expenses", Icon: Receipt },
              { id: "balances", label: "Balances", Icon: DollarSign },
              { id: "insights", label: "AI Insights", Icon: Sparkles },
              { id: "chat", label: "Ask AI", Icon: MessageCircle },
            ].map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1 lg:gap-1.5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === id ? "border-teal-500 text-teal-600 dark:text-teal-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}>
                <Icon className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </nav>

          {/* Tab content */}
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">

            {/* ══ EXPENSES TAB ══ */}
            {activeTab === "expenses" && (
              <div className="p-6">
                {/* Toolbar */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                    <input type="text" placeholder="Search expenses…" value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-teal-400 bg-white" />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-teal-400 bg-white text-gray-600">
                    <option value="all">All categories</option>
                    {Object.entries(CATEGORIES).map(([k, c]) => (
                      <option key={k} value={k}>{c.icon} {c.label}</option>
                    ))}
                  </select>
                  <button onClick={openAddForm}
                    className="flex items-center gap-1.5 px-4 py-2 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 transition-colors shadow-sm whitespace-nowrap">
                    <Plus className="w-3.5 h-3.5" /> Add Expense
                  </button>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-500">{filteredExpenses.length} expense{filteredExpenses.length !== 1 ? "s" : ""}{searchQuery || filterCategory !== "all" ? " (filtered)" : ""}</p>
                </div>

                {/* Add / Edit Form */}
                {showExpenseForm && expForm && (
                  <ExpenseForm
                    form={expForm} setForm={setExpForm}
                    members={selectedGroup.members}
                    onSave={validateAndSave}
                    onCancel={() => { setShowExpenseForm(false); setEditingExpenseId(null); }}
                    categorizing={categorizing}
                    title={editingExpenseId ? "Edit Expense" : "New Expense"}
                  />
                )}

                {/* Expense list */}
                {filteredExpenses.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <Receipt className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">{allGroupExpenses.length === 0 ? "No expenses yet. Add one above." : "No expenses match your search."}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredExpenses.map((expense) => (
                      <div key={expense.id}
                        className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 hover:border-gray-200 transition-colors shadow-sm">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-800 text-sm truncate">{expense.description}</p>
                              <div className="flex items-center flex-wrap gap-2 mt-1.5">
                                <CategoryBadge category={expense.category} />
                                <span className="text-xs text-gray-400">{expense.date}</span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-semibold text-gray-800">₹{expense.amount.toLocaleString("en-IN")}</p>
                              <p className="text-xs text-gray-400">paid by {memberMap[expense.paidBy] || "?"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 mt-2">
                            <span className="text-xs text-gray-400">{expense.splitType === "equal" ? "Equal ·" : "Custom ·"}</span>
                            {(expense.participants || selectedGroup.members.map((m) => m.id)).map((pid) => (
                              <Avatar key={pid} name={memberMap[pid] || "?"} size="xs" />
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => openEditForm(expense)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-teal-500 hover:bg-teal-50 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteExpense(expense.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══ BALANCES TAB ══ */}
            {activeTab === "balances" && (
              <div className="p-6">
                {/* Per-person statement cards */}
                <h3 className="text-sm font-semibold text-gray-600 mb-3">Member Statements</h3>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {selectedGroup.members.map((m) => {
                    const s = memberStats[m.id] || {};
                    const bal = balances[m.id] || 0;
                    return (
                      <div key={m.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <Avatar name={m.name} size="md" />
                          <span className="font-medium text-gray-700 text-sm">{m.name}</span>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Total paid</span>
                            <span className="font-medium text-gray-700">₹{(s.totalPaid || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Total owed</span>
                            <span className="font-medium text-gray-700">₹{(s.totalOwed || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="flex justify-between pt-1.5 border-t border-gray-100">
                            <span className="text-gray-500 font-medium">Net balance</span>
                            <span className={`font-bold text-sm ${bal > 0.01 ? "text-emerald-500" : bal < -0.01 ? "text-red-400" : "text-gray-300"}`}>
                              {bal > 0.01 ? "+" : ""}{formatINR(bal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Settlement plan */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-teal-500" /> Settlement Plan
                    </h3>
                    {settledTxns.filter((s) => s.groupId === selectedGroupId).length > 0 && (
                      <span className="text-xs text-gray-400">
                        {settledTxns.filter((s) => s.groupId === selectedGroupId).length} settled ✓
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-4">Minimum transactions needed to settle all debts.</p>

                  {allSettlements.length === 0 ? (
                    <div className="text-center py-6">
                      <Check className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
                      <p className="text-sm text-gray-500 font-medium">Everyone is settled up!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {allSettlements.map((t, i) => {
                        const isSettled = settledTxns.some(
                          (s) => s.from === t.from && s.to === t.to && Math.abs(s.amount - t.amount) < 0.01
                        );
                        return (
                          <div key={i}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isSettled ? "bg-emerald-50 border border-emerald-100" : "bg-gray-50"}`}>
                            <Avatar name={t.from} />
                            <div className="flex-1">
                              <span className={`text-sm font-medium ${isSettled ? "text-gray-400 line-through" : "text-gray-800"}`}>{t.from}</span>
                              <span className="text-gray-400 text-sm mx-2">→</span>
                              <span className={`text-sm font-medium ${isSettled ? "text-gray-400 line-through" : "text-gray-800"}`}>{t.to}</span>
                            </div>
                            <span className={`font-semibold text-sm mr-2 ${isSettled ? "text-gray-400" : "text-gray-800"}`}>{formatINR(t.amount)}</span>
                            <button
                              onClick={() => isSettled ? unmarkSettled(t) : markSettled(t)}
                              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                                isSettled
                                  ? "bg-emerald-100 text-emerald-600 border-emerald-200 hover:bg-emerald-200"
                                  : "bg-white text-gray-500 border-gray-200 hover:border-teal-300 hover:text-teal-600"
                              }`}>
                              {isSettled ? "✓ Settled" : "Settle up"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══ AI INSIGHTS TAB ══ */}
            {activeTab === "insights" && (
              <div className="p-6">
                {/* Category breakdown */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4 shadow-sm">
                  <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-500" /> Spending by Category
                  </h3>
                  {Object.entries(catSpend).length === 0 ? (
                    <p className="text-sm text-gray-400">No expenses to analyze yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(catSpend).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => (
                        <div key={cat} className="flex items-center gap-3">
                          <div className="w-32 flex-shrink-0"><CategoryBadge category={cat} /></div>
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-teal-400 h-full rounded-full transition-all"
                              style={{ width: `${((amount / totalSpend) * 100).toFixed(0)}%` }} />
                          </div>
                          <span className="text-sm font-medium text-gray-600 w-20 text-right">
                            ₹{amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                          </span>
                          <span className="text-xs text-gray-400 w-8 text-right">
                            {((amount / totalSpend) * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI insights */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500" /> AI Spending Insights
                    </h3>
                    <button onClick={fetchInsights}
                      disabled={loadingInsights || allGroupExpenses.length === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 border border-purple-100 text-xs font-medium rounded-full hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      {loadingInsights
                        ? <><Loader2 className="w-3 h-3 animate-spin" /> Analyzing…</>
                        : <><Sparkles className="w-3 h-3" /> Get Insights</>}
                    </button>
                  </div>

                  {!insights && !loadingInsights && !insightError && (
                    <p className="text-sm text-gray-400 text-center py-6">
                      Click "Get Insights" to analyze your spending patterns with AI.
                    </p>
                  )}
                  {insightError && <p className="text-sm text-red-400 text-center py-4">{insightError}</p>}
                  {insights && (
                    <div className="space-y-2 fade-in">
                      {insights.map((item, i) => (
                        <div key={i} className={`p-3 rounded-lg text-sm leading-relaxed border ${
                          item.type === "warning" ? "bg-orange-50 border-orange-100 text-orange-700"
                          : item.type === "tip" ? "bg-blue-50 border-blue-100 text-blue-700"
                          : "bg-gray-50 border-gray-100 text-gray-600"
                        }`}>
                          <span className="mr-1">{item.type === "warning" ? "⚠" : item.type === "tip" ? "💡" : "ℹ"}</span>
                          {item.insight}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══ AI CHAT TAB ══ */}
            {activeTab === "chat" && (
              <div className="flex flex-col h-full">
                {/* Suggested prompts */}
                <div className="px-6 pt-4 pb-2 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs text-gray-400 mb-2">Try asking:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Who spent the most?",
                      "What's the biggest expense?",
                      "How much does each person owe?",
                      "Which category had most spending?",
                      "Give me a full summary",
                    ].map((q) => (
                      <button key={q} onClick={() => { setChatInput(q); }}
                        className="px-2.5 py-1 bg-white border border-gray-200 text-xs text-gray-500 rounded-full hover:border-teal-300 hover:text-teal-600 transition-colors">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                      {msg.role === "assistant" && (
                        <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 text-purple-600 text-xs font-bold mt-0.5">AI</div>
                      )}
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-teal-500 text-white rounded-tr-sm"
                          : "bg-white border border-gray-100 text-gray-700 rounded-tl-sm shadow-sm"
                      }`}>
                        {/* Render simple markdown-ish bold/italic */}
                        {msg.content.split(/(\*[^*]+\*)/).map((part, j) =>
                          part.startsWith("*") && part.endsWith("*")
                            ? <em key={j} className="not-italic font-medium">{part.slice(1, -1)}</em>
                            : part
                        )}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 text-purple-600 text-xs font-bold">AI</div>
                      <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                        <div className="flex gap-1 items-center">
                          <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-100 bg-white">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ask anything about your expenses…"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
                      disabled={chatLoading || !selectedGroup}
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-teal-400 disabled:opacity-50"
                    />
                    <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()}
                      className="w-10 h-10 bg-teal-500 text-white rounded-xl flex items-center justify-center hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5 text-center">Powered by Claude · Answers are based on your group data</p>
                </div>
              </div>
            )}

          </main>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center flex-col gap-3 text-gray-400">
          <Users className="w-12 h-12 opacity-30" />
          <p className="text-sm">Select or create a group to get started.</p>
        </div>
      )}
      
      {/* Hidden export summary for image capture */}
      <div id="export-summary" className="fixed -top-full -left-full p-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm max-w-md">
        <div className="mb-4">
          <h2 className="text-lg font-bold mb-2">💸 {selectedGroup?.name} — Expense Summary</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Generated: {new Date().toLocaleDateString("en-IN")}</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">📊 Overview</h3>
            <p>Total spend: ₹{totalSpend?.toLocaleString("en-IN")}</p>
            <p>Members: {selectedGroup?.members.length}</p>
            <p>Expenses: {allGroupExpenses?.length}</p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">📋 Expenses</h3>
            <div className="space-y-1">
              {allGroupExpenses?.slice(0, 10).map((e, i) => (
                <div key={i} className="text-xs">
                  • {e.description} — ₹{e.amount} ({memberMap[e.paidBy]})
                </div>
              ))}
              {allGroupExpenses?.length > 10 && <div className="text-xs text-gray-500">... and {allGroupExpenses.length - 10} more</div>}
            </div>
          </div>
          
          {allSettlements?.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">⚖ Settlements</h3>
              <div className="space-y-1">
                {allSettlements?.slice(0, 5).map((t, i) => (
                  <div key={i} className="text-xs">
                    • {t.from} → {t.to}: ₹{t.amount.toLocaleString("en-IN")}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
          Generated by Smart Expense Splitter
        </div>
      </div>
    </div>
  );
}
