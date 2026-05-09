import React, { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import api from '../api/client'

export default function Debts() {
  const [debts, setDebts] = useState([])
  const [accounts, setAccounts] = useState([])
  const [showDebt, setShowDebt] = useState(false)
  const [showPayment, setShowPayment] = useState(null)
  const [debtForm, setDebtForm] = useState({ name: '', original_balance: '', current_balance: '', interest_rate: '', monthly_payment: '' })
  const [payForm, setPayForm] = useState({ account: '', amount: '', date: new Date().toISOString().slice(0, 10), notes: '' })

  useEffect(() => { load() }, [])

  const load = async () => {
    const [d, a] = await Promise.all([api.get('/debts/'), api.get('/accounts/')])
    setDebts(d.data.results || d.data)
    setAccounts(a.data.results || a.data)
  }

  const addDebt = async (e) => {
    e.preventDefault()
    await api.post('/debts/', {
      name: debtForm.name,
      original_balance: parseFloat(debtForm.original_balance),
      current_balance: parseFloat(debtForm.current_balance || debtForm.original_balance),
      interest_rate: parseFloat(debtForm.interest_rate || 0),
      monthly_payment: parseFloat(debtForm.monthly_payment || 0),
    })
    setShowDebt(false)
    setDebtForm({ name: '', original_balance: '', current_balance: '', interest_rate: '', monthly_payment: '' })
    load()
  }

  const addPayment = async (e, debtId) => {
    e.preventDefault()
    await api.post('/debts/payments/', {
      debt: debtId,
      account: payForm.account || null,
      amount: parseFloat(payForm.amount),
      date: payForm.date,
      notes: payForm.notes,
    })
    setShowPayment(null)
    setPayForm({ account: '', amount: '', date: new Date().toISOString().slice(0, 10), notes: '' })
    load()
  }

  const del = async (id) => {
    if (!confirm('Delete this debt?')) return
    await api.delete(`/debts/${id}/`)
    load()
  }

  const fmt = n => '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Debts</h1>
        <button onClick={() => setShowDebt(true)} className="btn-primary"><Plus size={18} /> Add Debt</button>
      </div>

      {showDebt && (
        <form onSubmit={addDebt} className="card space-y-3">
          <div className="flex justify-between"><h2 className="text-sm font-semibold">New Debt</h2><button type="button" onClick={() => setShowDebt(false)}><X size={18} /></button></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input className="input" placeholder="Debt Name" value={debtForm.name} onChange={e => setDebtForm({ ...debtForm, name: e.target.value })} required />
            <input className="input" type="number" step="0.01" placeholder="Original Balance" value={debtForm.original_balance} onChange={e => setDebtForm({ ...debtForm, original_balance: e.target.value })} required />
            <input className="input" type="number" step="0.01" placeholder="Current Balance" value={debtForm.current_balance} onChange={e => setDebtForm({ ...debtForm, current_balance: e.target.value })} />
            <input className="input" type="number" step="0.01" placeholder="Interest Rate %" value={debtForm.interest_rate} onChange={e => setDebtForm({ ...debtForm, interest_rate: e.target.value })} />
            <input className="input" type="number" step="0.01" placeholder="Monthly Payment" value={debtForm.monthly_payment} onChange={e => setDebtForm({ ...debtForm, monthly_payment: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary">Save Debt</button>
        </form>
      )}

      <div className="space-y-4">
        {debts.map(d => {
          const pct = d.original_balance > 0 ? Math.min(100, ((d.original_balance - d.current_balance) / d.original_balance) * 100) : 0
          return (
            <div key={d.id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{d.name}</p>
                  <p className="text-sm text-gray-400">Rate: {d.interest_rate || 0}% • Min: {fmt(d.monthly_payment)}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowPayment(d.id)} className="btn-primary text-xs">Pay</button>
                  <button onClick={() => del(d.id)} className="text-red-500 hover:text-red-700 text-xs">Delete</button>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">{fmt(d.current_balance)} remaining</span>
                  <span className="text-gray-500">{fmt(d.original_balance)} original</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
                  <div className="bg-primary-500 h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">{pct.toFixed(1)}% paid off</p>
              </div>

              {showPayment === d.id && (
                <form onSubmit={e => addPayment(e, d.id)} className="mt-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select className="input" value={payForm.account} onChange={e => setPayForm({ ...payForm, account: e.target.value })}>
                      <option value="">Select Account</option>
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <input className="input" type="number" step="0.01" placeholder="Amount" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} required />
                    <input className="input" type="date" value={payForm.date} onChange={e => setPayForm({ ...payForm, date: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary">Record Payment</button>
                    <button type="button" onClick={() => setShowPayment(null)} className="btn-ghost">Cancel</button>
                  </div>
                </form>
              )}

              {d.payments?.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="text-left text-gray-400 border-b border-gray-100 dark:border-slate-700"><th className="pb-1">Date</th><th className="pb-1">Amount</th><th className="pb-1">Notes</th></tr></thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                      {d.payments.map(p => (
                        <tr key={p.id}><td className="py-1">{p.date}</td><td className="py-1 font-semibold">{fmt(p.amount)}</td><td className="py-1">{p.notes || '-'}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
        {!debts.length && <p className="text-gray-400">No debts yet.</p>}
      </div>
    </div>
  )
}
