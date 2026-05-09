import React, { useEffect, useState } from 'react'
import { Plus, X, ArrowRightLeft } from 'lucide-react'
import api from '../api/client'

export default function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'bank', balance: 0, initial_balance: 0 })
  const [transfer, setTransfer] = useState({ from: '', to: '', amount: '' })

  useEffect(() => { load() }, [])

  const load = async () => {
    const res = await api.get('/accounts/')
    setAccounts(res.data.results || res.data)
  }

  const submit = async (e) => {
    e.preventDefault()
    await api.post('/accounts/', { ...form, balance: parseFloat(form.balance), initial_balance: parseFloat(form.initial_balance) })
    setShowForm(false)
    setForm({ name: '', type: 'bank', balance: 0, initial_balance: 0 })
    load()
  }

  const doTransfer = async (e) => {
    e.preventDefault()
    const amt = parseFloat(transfer.amount)
    if (!amt || transfer.from === transfer.to) return
    // Create expense from source, income to destination
    await api.post('/transactions/', { type: 'expense', account: transfer.from, amount: amt, date: new Date().toISOString().slice(0, 10), description: 'Transfer out', category: '' })
    await api.post('/transactions/', { type: 'income', account: transfer.to, amount: amt, date: new Date().toISOString().slice(0, 10), description: 'Transfer in', category: '' })
    setShowTransfer(false)
    setTransfer({ from: '', to: '', amount: '' })
    load()
  }

  const del = async (id) => {
    if (!confirm('Delete this account?')) return
    await api.delete(`/accounts/${id}/`)
    load()
  }

  const fmt = n => '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const types = { bank: 'Bank Account', cash: 'Cash Wallet', credit: 'Credit Card', digital: 'Digital Wallet', check: 'Checks' }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Accounts</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowTransfer(true)} className="btn-ghost"><ArrowRightLeft size={16} /> Transfer</button>
          <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={18} /> Add Account</button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card space-y-3">
          <div className="flex justify-between"><h2 className="text-sm font-semibold">New Account</h2><button type="button" onClick={() => setShowForm(false)}><X size={18} /></button></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input className="input" placeholder="Account Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              {Object.entries(types).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input className="input" type="number" step="0.01" placeholder="Initial Balance" value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value, initial_balance: e.target.value })} required />
          </div>
          <button type="submit" className="btn-primary">Save Account</button>
        </form>
      )}

      {showTransfer && (
        <form onSubmit={doTransfer} className="card space-y-3">
          <div className="flex justify-between"><h2 className="text-sm font-semibold">Transfer Money</h2><button type="button" onClick={() => setShowTransfer(false)}><X size={18} /></button></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select className="input" value={transfer.from} onChange={e => setTransfer({ ...transfer, from: e.target.value })} required>
              <option value="">From Account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} — {fmt(a.balance)}</option>)}
            </select>
            <select className="input" value={transfer.to} onChange={e => setTransfer({ ...transfer, to: e.target.value })} required>
              <option value="">To Account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} — {fmt(a.balance)}</option>)}
            </select>
            <input className="input" type="number" step="0.01" placeholder="Amount" value={transfer.amount} onChange={e => setTransfer({ ...transfer, amount: e.target.value })} required />
          </div>
          <button type="submit" className="btn-primary">Transfer</button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(a => (
          <div key={a.id} className="card">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">{types[a.type]}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{a.name}</p>
              </div>
              <button onClick={() => del(a.id)} className="text-red-500 hover:text-red-700 text-xs">Delete</button>
            </div>
            <p className={`text-2xl font-bold mt-3 ${a.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(a.balance)}</p>
          </div>
        ))}
        {!accounts.length && <p className="text-gray-400">No accounts yet.</p>}
      </div>
    </div>
  )
}
