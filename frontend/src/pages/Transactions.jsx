import React, { useEffect, useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import api from '../api/client'

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [accounts, setAccounts] = useState([])
  const [filters, setFilters] = useState({ year: new Date().getFullYear().toString(), month: String(new Date().getMonth() + 1).padStart(2, '0'), type: '', category: '', account: '' })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'expense', account: '', category: '', amount: '', date: new Date().toISOString().slice(0, 10), description: '', notes: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    setLoading(true)
    const params = {}
    if (filters.year && filters.year !== 'all') params.year = filters.year
    if (filters.month && filters.month !== 'all') params.month = filters.month
    if (filters.type) params.type = filters.type
    if (filters.category) params.category = filters.category
    if (filters.account) params.account = filters.account

    const [txRes, catRes, accRes] = await Promise.all([
      api.get('/transactions/', { params }),
      api.get('/categories/'),
      api.get('/accounts/'),
    ])
    setTransactions(txRes.data.results || txRes.data)
    setCategories(catRes.data.results || catRes.data)
    setAccounts(accRes.data.results || accRes.data)
    setLoading(false)
  }

  const submit = async (e) => {
    e.preventDefault()
    await api.post('/transactions/', { ...form, amount: parseFloat(form.amount) })
    setShowForm(false)
    setForm({ type: 'expense', account: '', category: '', amount: '', date: new Date().toISOString().slice(0, 10), description: '', notes: '' })
    loadData()
  }

  const del = async (id) => {
    if (!confirm('Delete this transaction?')) return
    await api.delete(`/transactions/${id}/`)
    loadData()
  }

  const fmt = n => '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const years = Array.from({ length: 10 }, (_, i) => 2020 + i)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Transactions</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={18} /> Add Transaction</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select className="input w-auto" value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })}>
          <option value="all">All Years</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="input w-auto" value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })}>
          <option value="all">All Months</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
              {new Date(0, i).toLocaleString('default', { month: 'long' })}
            </option>
          ))}
        </select>
        <select className="input w-auto" value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select className="input w-auto" value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold">New Transaction</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
            <input className="input" type="number" step="0.01" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
            <input className="input" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <select className="input" value={form.account} onChange={e => setForm({ ...form, account: e.target.value })}>
              <option value="">Select Account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              <option value="">Select Category</option>
              {categories.filter(c => c.type === form.type).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input className="input sm:col-span-2" placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary">Save Transaction</button>
        </form>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-400 border-b border-gray-100 dark:border-slate-700"><th className="pb-2">Date</th><th className="pb-2">Type</th><th className="pb-2">Description</th><th className="pb-2">Category</th><th className="pb-2">Account</th><th className="pb-2 text-right">Amount</th><th></th></tr></thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {transactions.map(t => (
              <tr key={t.id}>
                <td className="py-2">{t.date}</td>
                <td><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${t.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{t.type}</span></td>
                <td>{t.description || '-'}</td>
                <td>{t.category_detail?.name || '-'}</td>
                <td>{t.account_detail?.name || '-'}</td>
                <td className={`text-right font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(t.amount)}</td>
                <td><button onClick={() => del(t.id)} className="text-red-500 hover:text-red-700 text-xs">Delete</button></td>
              </tr>
            ))}
            {!transactions.length && <tr><td colSpan="7" className="py-6 text-center text-gray-400">No transactions found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
