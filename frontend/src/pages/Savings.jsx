import React, { useEffect, useState } from 'react'
import { Plus, X, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import api from '../api/client'

export default function Savings() {
  const [goals, setGoals] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [showTx, setShowTx] = useState(null)
  const [form, setForm] = useState({ name: '', target_amount: '', current_balance: '' })
  const [txForm, setTxForm] = useState({ type: 'deposit', amount: '', date: new Date().toISOString().slice(0, 10), notes: '' })

  useEffect(() => { load() }, [])

  const load = async () => {
    const res = await api.get('/savings/')
    setGoals(res.data.results || res.data)
  }

  const submit = async (e) => {
    e.preventDefault()
    await api.post('/savings/', {
      name: form.name,
      target_amount: parseFloat(form.target_amount),
      current_balance: parseFloat(form.current_balance || 0),
    })
    setShowForm(false)
    setForm({ name: '', target_amount: '', current_balance: '' })
    load()
  }

  const addTx = async (e, goalId) => {
    e.preventDefault()
    await api.post('/savings/transactions/', {
      goal: goalId,
      type: txForm.type,
      amount: parseFloat(txForm.amount),
      date: txForm.date,
      notes: txForm.notes,
    })
    setShowTx(null)
    setTxForm({ type: 'deposit', amount: '', date: new Date().toISOString().slice(0, 10), notes: '' })
    load()
  }

  const del = async (id) => {
    if (!confirm('Delete this goal?')) return
    await api.delete(`/savings/${id}/`)
    load()
  }

  const fmt = n => '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Savings Goals</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={18} /> Add Goal</button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card space-y-3">
          <div className="flex justify-between"><h2 className="text-sm font-semibold">New Goal</h2><button type="button" onClick={() => setShowForm(false)}><X size={18} /></button></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input className="input" placeholder="Goal Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <input className="input" type="number" step="0.01" placeholder="Target Amount" value={form.target_amount} onChange={e => setForm({ ...form, target_amount: e.target.value })} required />
            <input className="input" type="number" step="0.01" placeholder="Starting Balance" value={form.current_balance} onChange={e => setForm({ ...form, current_balance: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary">Save Goal</button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map(g => {
          const pct = g.target_amount > 0 ? Math.min(100, (g.current_balance / g.target_amount) * 100) : 0
          return (
            <div key={g.id} className="card">
              <div className="flex justify-between items-start">
                <p className="text-lg font-bold text-gray-900 dark:text-white">{g.name}</p>
                <button onClick={() => del(g.id)} className="text-red-500 hover:text-red-700 text-xs">Delete</button>
              </div>
              <p className="text-sm text-gray-400 mt-1">{fmt(g.current_balance)} / {fmt(g.target_amount)}</p>
              <div className="mt-3">
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
                  <div className="bg-amber-500 h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{pct.toFixed(1)}%</span>
                  <span>{fmt(Math.max(0, g.target_amount - g.current_balance))} to go</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => { setShowTx(g.id); setTxForm({ type: 'deposit', amount: '', date: new Date().toISOString().slice(0, 10), notes: '' }) }} className="btn-primary text-xs"><ArrowUpCircle size={14} /> Deposit</button>
                <button onClick={() => { setShowTx(g.id); setTxForm({ type: 'withdraw', amount: '', date: new Date().toISOString().slice(0, 10), notes: '' }) }} className="btn-ghost text-xs"><ArrowDownCircle size={14} /> Withdraw</button>
              </div>

              {showTx === g.id && (
                <form onSubmit={e => addTx(e, g.id)} className="mt-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg space-y-2">
                  <p className="text-xs font-semibold">{txForm.type === 'deposit' ? 'Deposit' : 'Withdraw'} to {g.name}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input className="input" type="number" step="0.01" placeholder="Amount" value={txForm.amount} onChange={e => setTxForm({ ...txForm, amount: e.target.value })} required />
                    <input className="input" type="date" value={txForm.date} onChange={e => setTxForm({ ...txForm, date: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary text-xs">Save</button>
                    <button type="button" onClick={() => setShowTx(null)} className="btn-ghost text-xs">Cancel</button>
                  </div>
                </form>
              )}
            </div>
          )
        })}
        {!goals.length && <p className="text-gray-400">No savings goals yet.</p>}
      </div>
    </div>
  )
}
