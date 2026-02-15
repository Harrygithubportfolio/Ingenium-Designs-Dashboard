'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFinance } from '@/store/useFinance';
import { StatCard } from '@/components/shared/charts';
import type { FinanceCategory, FinanceTransaction } from '@/lib/finance/types';

type Tab = 'transactions' | 'categories';

export default function FinancePage() {
  const {
    categories,
    transactions,
    loading,
    fetchCategories,
    seedDefaultCategories,
    fetchTransactions,
    addTransaction,
    deleteTransaction,
  } = useFinance();

  const [tab, setTab] = useState<Tab>('transactions');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isIncome, setIsIncome] = useState(false);
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  // Month navigation
  const [monthOffset, setMonthOffset] = useState(0);

  const currentMonth = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const monthLabel = currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const monthRange = useMemo(() => {
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    return {
      from: start.toISOString().slice(0, 10),
      to: end.toISOString().slice(0, 10),
    };
  }, [currentMonth]);

  useEffect(() => {
    fetchCategories().then(() => seedDefaultCategories());
  }, [fetchCategories, seedDefaultCategories]);

  useEffect(() => {
    fetchTransactions(monthRange.from, monthRange.to);
  }, [fetchTransactions, monthRange]);

  // Monthly summary
  const summary = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    const byCat: Record<string, { name: string; colour: string; total: number }> = {};

    for (const tx of transactions) {
      const amt = Number(tx.amount);
      if (tx.is_income) {
        totalIncome += amt;
      } else {
        totalExpenses += amt;
        const catName = tx.category?.name ?? 'Uncategorised';
        const catColour = tx.category?.colour ?? '#6b7280';
        if (!byCat[catName]) byCat[catName] = { name: catName, colour: catColour, total: 0 };
        byCat[catName].total += amt;
      }
    }

    const byCategory = Object.values(byCat).sort((a, b) => b.total - a.total);
    return { totalIncome, totalExpenses, net: totalIncome - totalExpenses, byCategory };
  }, [transactions]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, FinanceTransaction[]> = {};
    for (const tx of transactions) {
      const d = tx.transaction_date;
      if (!groups[d]) groups[d] = [];
      groups[d].push(tx);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [transactions]);

  const handleSave = async () => {
    if (!amount || !description.trim()) return;
    setSaving(true);
    await addTransaction({
      amount: Number(amount),
      description: description.trim(),
      category_id: categoryId || null,
      is_income: isIncome,
      transaction_date: txDate,
      notes: notes || null,
    });
    setAmount('');
    setDescription('');
    setCategoryId('');
    setIsIncome(false);
    setNotes('');
    setShowForm(false);
    setSaving(false);
    fetchTransactions(monthRange.from, monthRange.to);
  };

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
    fetchTransactions(monthRange.from, monthRange.to);
  };

  const expenseCategories = categories.filter((c) => !c.is_income);
  const incomeCategories = categories.filter((c) => c.is_income);
  const filteredCategories = isIncome ? incomeCategories : expenseCategories;

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-heading">Finance</h1>
            <p className="text-dim text-[11px]">Track spending and income</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {showForm ? 'Cancel' : '+ Add Transaction'}
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Summary + Category Breakdown */}
          <div className="lg:col-span-1 space-y-4">
            {/* Month Navigator */}
            <div className="flex items-center justify-between bg-gradient-to-br from-card to-inner rounded-2xl border border-edge px-4 py-3">
              <button
                type="button"
                onClick={() => setMonthOffset((o) => o - 1)}
                title="Previous month"
                className="p-1.5 rounded-lg hover:bg-elevated text-sub hover:text-heading transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm font-semibold text-heading">{monthLabel}</span>
              <button
                type="button"
                onClick={() => setMonthOffset((o) => o + 1)}
                disabled={monthOffset >= 0}
                title="Next month"
                className="p-1.5 rounded-lg hover:bg-elevated text-sub hover:text-heading transition-colors disabled:opacity-30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Income" value={`£${summary.totalIncome.toFixed(2)}`} />
              <StatCard label="Expenses" value={`£${summary.totalExpenses.toFixed(2)}`} />
              <StatCard
                label="Net"
                value={`${summary.net >= 0 ? '+' : ''}£${summary.net.toFixed(2)}`}
                trend={summary.net !== 0 ? { direction: summary.net >= 0 ? 'up' : 'down', label: summary.net >= 0 ? 'Surplus' : 'Deficit' } : undefined}
              />
            </div>

            {/* Category Breakdown */}
            <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5">
              <h3 className="text-sm font-semibold text-heading mb-3">Spending by Category</h3>
              {summary.byCategory.length === 0 ? (
                <p className="text-xs text-dim text-center py-4">No expenses this month</p>
              ) : (
                <div className="space-y-2.5">
                  {summary.byCategory.map((cat) => {
                    const pct = summary.totalExpenses > 0 ? (cat.total / summary.totalExpenses) * 100 : 0;
                    return (
                      <div key={cat.name}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: cat.colour }}
                            />
                            <span className="text-xs text-sub">{cat.name}</span>
                          </div>
                          <span className="text-xs font-medium text-heading">£{cat.total.toFixed(2)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-elevated overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: cat.colour }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Budget Progress */}
            {expenseCategories.filter((c) => c.budget_monthly).length > 0 && (
              <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5">
                <h3 className="text-sm font-semibold text-heading mb-3">Budget Progress</h3>
                <div className="space-y-3">
                  {expenseCategories
                    .filter((c) => c.budget_monthly)
                    .map((cat) => {
                      const spent = summary.byCategory.find((b) => b.name === cat.name)?.total ?? 0;
                      const budget = Number(cat.budget_monthly);
                      const pct = Math.min((spent / budget) * 100, 100);
                      const over = spent > budget;
                      return (
                        <div key={cat.id}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-sub">{cat.name}</span>
                            <span className={`text-xs font-medium ${over ? 'text-red-400' : 'text-heading'}`}>
                              £{spent.toFixed(0)} / £{budget.toFixed(0)}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-elevated overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: over ? '#ef4444' : cat.colour,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Right: Form + Transaction List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Add Transaction Form */}
            {showForm && (
              <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-5 space-y-4">
                <h3 className="text-sm font-semibold text-heading">New Transaction</h3>

                {/* Income/Expense Toggle */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setIsIncome(false); setCategoryId(''); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      !isIncome
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-elevated text-sub hover:text-heading'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsIncome(true); setCategoryId(''); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isIncome
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-elevated text-sub hover:text-heading'
                    }`}
                  >
                    Income
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-dim uppercase tracking-wide mb-1 block">Amount (£)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 rounded-lg bg-inner border border-edge text-heading text-sm placeholder-dim"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-dim uppercase tracking-wide mb-1 block">Date</label>
                    <input
                      type="date"
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      title="Transaction date"
                      className="w-full px-3 py-2 rounded-lg bg-inner border border-edge text-heading text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-dim uppercase tracking-wide mb-1 block">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Weekly shop, Bus fare..."
                    className="w-full px-3 py-2 rounded-lg bg-inner border border-edge text-heading text-sm placeholder-dim"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-dim uppercase tracking-wide mb-1 block">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    title="Category"
                    className="w-full px-3 py-2 rounded-lg bg-inner border border-edge text-heading text-sm"
                  >
                    <option value="">No category</option>
                    {filteredCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon ? `${c.icon} ` : ''}{c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-dim uppercase tracking-wide mb-1 block">Notes (optional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional details..."
                    className="w-full px-3 py-2 rounded-lg bg-inner border border-edge text-heading text-sm placeholder-dim"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !amount || !description.trim()}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                  {saving ? 'Saving...' : `Save ${isIncome ? 'Income' : 'Expense'}`}
                </button>
              </div>
            )}

            {/* Tab Switcher */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTab('transactions')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === 'transactions'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-card text-sub hover:text-heading border border-edge'
                }`}
              >
                Transactions ({transactions.length})
              </button>
              <button
                type="button"
                onClick={() => setTab('categories')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === 'categories'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-card text-sub hover:text-heading border border-edge'
                }`}
              >
                Categories ({categories.length})
              </button>
            </div>

            {/* Transaction List */}
            {tab === 'transactions' && (
              <div className="space-y-3">
                {loading ? (
                  <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-8 text-center">
                    <p className="text-sm text-dim">Loading transactions...</p>
                  </div>
                ) : groupedTransactions.length === 0 ? (
                  <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge p-8 text-center">
                    <p className="text-sm text-dim">No transactions this month</p>
                    <p className="text-xs text-dim mt-1">Tap &quot;+ Add Transaction&quot; to get started</p>
                  </div>
                ) : (
                  groupedTransactions.map(([date, txs]) => (
                    <div key={date} className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge overflow-hidden">
                      {/* Date Header */}
                      <div className="px-4 py-2.5 border-b border-edge bg-elevated/30">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-heading">
                            {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                          <span className="text-xs text-dim">
                            {txs.length} transaction{txs.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Transactions */}
                      <div className="divide-y divide-edge">
                        {txs.map((tx) => (
                          <div key={tx.id} className="px-4 py-3 flex items-center gap-3 group hover:bg-elevated/20 transition-colors">
                            {/* Category dot */}
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: tx.category?.colour ?? '#6b7280' }}
                            />

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-heading truncate">{tx.description}</p>
                              <p className="text-[10px] text-dim">
                                {tx.category?.icon ? `${tx.category.icon} ` : ''}
                                {tx.category?.name ?? 'Uncategorised'}
                                {tx.notes ? ` · ${tx.notes}` : ''}
                              </p>
                            </div>

                            {/* Amount */}
                            <span className={`text-sm font-semibold flex-shrink-0 ${tx.is_income ? 'text-emerald-400' : 'text-red-400'}`}>
                              {tx.is_income ? '+' : '-'}£{Number(tx.amount).toFixed(2)}
                            </span>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDelete(tx.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-dim hover:text-red-400 transition-all flex-shrink-0"
                              title="Delete transaction"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Categories List */}
            {tab === 'categories' && (
              <div className="bg-gradient-to-br from-card to-inner rounded-2xl border border-edge overflow-hidden">
                <div className="divide-y divide-edge">
                  {categories.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-sm text-dim">No categories yet</p>
                    </div>
                  ) : (
                    categories.map((cat) => (
                      <div key={cat.id} className="px-4 py-3 flex items-center gap-3">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cat.colour }}
                        />
                        <span className="text-lg flex-shrink-0">{cat.icon ?? ''}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-heading">{cat.name}</p>
                          <p className="text-[10px] text-dim">
                            {cat.is_income ? 'Income' : 'Expense'}
                            {cat.budget_monthly ? ` · Budget: £${Number(cat.budget_monthly).toFixed(0)}/mo` : ''}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
