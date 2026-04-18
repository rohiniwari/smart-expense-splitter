/**
 * Utility functions for expense balance calculations.
 */

export function calculateBalances(group, expenses) {
  const balances = {};
  group.members.forEach((m) => { balances[m.id] = 0; });
  expenses.filter((e) => e.groupId === group.id).forEach((expense) => {
    balances[expense.paidBy] = (balances[expense.paidBy] || 0) + expense.amount;
    if (expense.splitType === "equal") {
      const participants = expense.participants || group.members.map((m) => m.id);
      const share = expense.amount / participants.length;
      participants.forEach((mId) => { balances[mId] = (balances[mId] || 0) - share; });
    } else {
      Object.entries(expense.customSplits || {}).forEach(([mId, amount]) => {
        balances[mId] = (balances[mId] || 0) - amount;
      });
    }
  });
  return balances;
}

export function getSettlements(balances, members) {
  const memberMap = {};
  members.forEach((m) => (memberMap[m.id] = m.name));
  const creditors = [], debtors = [];
  Object.entries(balances).forEach(([id, amount]) => {
    if (amount > 0.01) creditors.push({ id, name: memberMap[id], amount });
    else if (amount < -0.01) debtors.push({ id, name: memberMap[id], amount: -amount });
  });
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);
  const transactions = [];
  let i = 0, j = 0;
  while (i < creditors.length && j < debtors.length) {
    const amount = Math.min(creditors[i].amount, debtors[j].amount);
    transactions.push({ from: debtors[j].name, to: creditors[i].name, amount });
    creditors[i].amount -= amount;
    debtors[j].amount -= amount;
    if (creditors[i].amount < 0.01) i++;
    if (debtors[j].amount < 0.01) j++;
  }
  return transactions;
}

export function getMemberStats(group, expenses) {
  const stats = {};
  group.members.forEach((m) => { stats[m.id] = { totalPaid: 0, totalOwed: 0, netBalance: 0 }; });
  expenses.filter((e) => e.groupId === group.id).forEach((expense) => {
    stats[expense.paidBy].totalPaid += expense.amount;
    if (expense.splitType === "equal") {
      const participants = expense.participants || group.members.map((m) => m.id);
      const share = expense.amount / participants.length;
      participants.forEach((mId) => { if (stats[mId]) stats[mId].totalOwed += share; });
    } else {
      Object.entries(expense.customSplits || {}).forEach(([mId, amt]) => {
        if (stats[mId]) stats[mId].totalOwed += amt;
      });
    }
  });
  Object.keys(stats).forEach((id) => { stats[id].netBalance = stats[id].totalPaid - stats[id].totalOwed; });
  return stats;
}

export function getCategorySpend(expenses) {
  return expenses.reduce((acc, e) => {
    const cat = e.category || "other";
    acc[cat] = (acc[cat] || 0) + e.amount;
    return acc;
  }, {});
}

export function getGroupStats(group, expenses) {
  const gExp = expenses.filter((e) => e.groupId === group.id);
  const totalSpend = gExp.reduce((s, e) => s + e.amount, 0);
  const avgPerPerson = group.members.length > 0 ? totalSpend / group.members.length : 0;
  const paidMap = {};
  gExp.forEach((e) => { paidMap[e.paidBy] = (paidMap[e.paidBy] || 0) + e.amount; });
  let highestSpenderId = null, highestAmount = 0;
  Object.entries(paidMap).forEach(([id, amt]) => { if (amt > highestAmount) { highestAmount = amt; highestSpenderId = id; } });
  const highestSpender = group.members.find((m) => m.id === highestSpenderId);
  const catSpend = getCategorySpend(gExp);
  const topCat = Object.entries(catSpend).sort((a, b) => b[1] - a[1])[0];
  return {
    totalSpend, avgPerPerson,
    expenseCount: gExp.length,
    highestSpender: highestSpender ? { name: highestSpender.name, amount: highestAmount } : null,
    topCategory: topCat ? { name: topCat[0], amount: topCat[1] } : null,
  };
}

export function uid() { return Math.random().toString(36).substr(2, 9); }

export function formatINR(amount) {
  return "₹" + Math.abs(amount).toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}
