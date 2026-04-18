// ─── Expense Categories ───────────────────────────────────────────────────────

export const CATEGORIES = {
  food: {
    label: "Food & Drink",
    icon: "🍽",
    bg: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-200",
  },
  travel: {
    label: "Travel",
    icon: "✈",
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
  },
  rent: {
    label: "Rent & Housing",
    icon: "🏠",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-200",
  },
  entertainment: {
    label: "Entertainment",
    icon: "🎮",
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-200",
  },
  shopping: {
    label: "Shopping",
    icon: "🛍",
    bg: "bg-pink-50",
    text: "text-pink-600",
    border: "border-pink-200",
  },
  utilities: {
    label: "Utilities",
    icon: "💡",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
  health: {
    label: "Health",
    icon: "❤",
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
  },
  other: {
    label: "Other",
    icon: "📦",
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
  },
};

// ─── Avatar Color Pairs ───────────────────────────────────────────────────────

export const AVATAR_COLORS = [
  { bg: "bg-violet-100", text: "text-violet-600" },
  { bg: "bg-teal-100",   text: "text-teal-600"   },
  { bg: "bg-orange-100", text: "text-orange-600"  },
  { bg: "bg-pink-100",   text: "text-pink-600"    },
  { bg: "bg-blue-100",   text: "text-blue-600"    },
  { bg: "bg-amber-100",  text: "text-amber-600"   },
];

// ─── Demo Seed Data ───────────────────────────────────────────────────────────

export const DEMO_DATA = {
  groups: [
    {
      id: "g1",
      name: "Goa Trip 2025",
      members: [
        { id: "m1", name: "Arjun" },
        { id: "m2", name: "Priya" },
        { id: "m3", name: "Rahul" },
        { id: "m4", name: "Sneha" },
      ],
    },
  ],
  expenses: [
    {
      id: "e1",
      groupId: "g1",
      description: "Hotel booking",
      amount: 4800,
      paidBy: "m1",
      splitType: "equal",
      participants: ["m1", "m2", "m3", "m4"],
      customSplits: {},
      category: "rent",
      date: "2025-03-10",
    },
    {
      id: "e2",
      groupId: "g1",
      description: "Dinner at beach shack",
      amount: 1200,
      paidBy: "m2",
      splitType: "equal",
      participants: ["m1", "m2", "m3", "m4"],
      customSplits: {},
      category: "food",
      date: "2025-03-11",
    },
    {
      id: "e3",
      groupId: "g1",
      description: "Water sports activity",
      amount: 2400,
      paidBy: "m3",
      splitType: "equal",
      participants: ["m1", "m2", "m3", "m4"],
      customSplits: {},
      category: "entertainment",
      date: "2025-03-12",
    },
    {
      id: "e4",
      groupId: "g1",
      description: "Flight tickets",
      amount: 9600,
      paidBy: "m4",
      splitType: "equal",
      participants: ["m1", "m2", "m3", "m4"],
      customSplits: {},
      category: "travel",
      date: "2025-03-09",
    },
  ],
};
