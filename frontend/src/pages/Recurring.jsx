import React, { useEffect, useState } from 'react'
import { Plus, X, CheckCircle } from 'lucide-react'
import api from '../api/client'

export default function Recurring() {
  const [items, setItems] = useState([])
  const [accounts, setAccounts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', amount: '', due_day: 1, account: '', auto_pay: false, notes: '' })

  useEffect(() => { load() }, [])

  const load = async () => {
    const [r, a] = await Promise.all([api.get('/recurring/'), api.get('/accounts/')])
    setItems(r.data.results || r.data)
    setAccounts(a.data.results || a.data)
  }

  const submit = async (e) => {
    e.preventDefault()
    await api.post('/recurring/', {
      name: form.name,
      amount: parseFloat(form.amount),
      due_day: parseInt(form.due_day),
      account: form.account || null,
      auto_pay: form.auto_pay,
      notes: form.notes,
    })
    setShowForm(false)
    setForm({ name: '', amount: '', due_day: 1, account: '', auto_pay: false, notes: '' })
    load()
  }

  const markPaid = async (item) => {
    const date = prompt(`Date for "${item.name}" transaction:`, new Date().toISOString().slice(0, 10))
    if (!date) return
    await api.post('/transactions/', {
      type: 'expense',
      account: item.account,
      amount: item.amount,
      date,
      description: item.name,
      category: '',
    })
    alert(`Paid ${item.name} — ₱${item.amount} on ${date}`)
    load()
  }

  const del = async (id) => {
    if (!confirm('Delete this recurring item?')) return
    await api.delete(`/recurring/${id}/`)
    load()
  }

  const fmt = n => '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const total = items.reduce((s, i) => s + parseFloat(i.amount), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Recurring Bills</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={18} /> Add Bill</button>
      </div>

      <div className="card">
        <p className="text-sm text-gray-500">Monthly Total: <span className="font-bold text-rose-600">{fmt(total)}</span></p>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card space-y-3">
          <div className="flex justify-between"><h2 className="text-sm font-semibold">New Recurring Bill</h2><button type="button" onClick={() => setShowForm(false)}><X size={18} /></button></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input className="input" placeholder="Bill Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <input className="input" type="number" step="0.01" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
            <input className="input" type="number" min="1" max="31" placeholder="Due Day" value={form.due_day} onChange={e => setForm({ ...form, due_day: e.target.value })} required />
            <select className="input" value={form.account} onChange={e => setForm({ ...form, account: e.target.value })}>
              <option value="">Select Account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.auto_pay} onChange={e => setForm({ ...form, auto_pay: e.target.checked })} />
              Auto-pay
            </label>
            <input className="input" placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary">Save Bill</button>
        </form>
      )}

      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="card flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="font-semibold">{item.name}</p>
              <p className="text-xs text-gray-400">Due day {item.due_day} • {item.account_detail?.name || 'No account'} {item.auto_pay && '• Auto-pay'}</p>
            </div>
            <p className="font-bold text-rose-600">{fmt(item.amount)}</p>
            <div className="flex gap-2">
              <button onClick={() => markPaid(item)} className="btn-primary text-xs"><CheckCircle size={14} /> Paid</button>
              <button onClick={() => del(item.id)} className="btn-danger text-xs">Delete</button>
            </div>
          </div>
        ))}
        {!items.length && <p className="text-gray-400">No recurring bills yet.</p>}
      </div>
    </div>
  )
}
