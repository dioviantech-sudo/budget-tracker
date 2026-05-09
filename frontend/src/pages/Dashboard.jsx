import React, { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, TrendingDown, CreditCard, PiggyBank, AlertCircle } from 'lucide-react'
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import SummaryCard from '../components/SummaryCard'
import ChartCard from '../components/ChartCard'
import api from '../api/client'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

export default function Dashboard() {
  const [filters, setFilters] = useState({ year: new Date().getFullYear().toString(), month: String(new Date().getMonth() + 1).padStart(2, '0') })
  const [summary, setSummary] = useState({ income: 0, expenses: 0, net: 0, debt: 0, savings: 0, paid: 0 })
  const [recentTxns, setRecentTxns] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [expenseData, setExpenseData] = useState({ labels: [], data: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [filters])

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const [txSummary, debtSum, savSum, recent, up, cats] = await Promise.all([
        api.get('/transactions/summary/', { params: filters }),
        api.get('/debts/summary/'),
        api.get('/savings/summary/'),
        api.get('/transactions/recent/'),
        api.get('/recurring/upcoming/'),
        api.get('/transactions/by_category/', { params: filters }),
      ])
      setSummary({
        income: txSummary.data.income,
        expenses: txSummary.data.expenses,
        net: txSummary.data.net,
        debt: debtSum.data.total_debt,
        savings: savSum.data.total_savings,
        paid: 0,
      })
      setRecentTxns(recent.data)
      setUpcoming(up.data)
      setExpenseData({
        labels: cats.data.map(c => c.category__name || 'Uncategorized'),
        data: cats.data.map(c => c.total),
      })
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const fmt = n => '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const years = Array.from({ length: 10 }, (_, i) => 2020 + i)
  const months = [
    { v: '01', l: 'January' }, { v: '02', l: 'February' }, { v: '03', l: 'March' }, { v: '04', l: 'April' },
    { v: '05', l: 'May' }, { v: '06', l: 'June' }, { v: '07', l: 'July' }, { v: '08', l: 'August' },
    { v: '09', l: 'September' }, { v: '10', l: 'October' }, { v: '11', l: 'November' }, { v: '12', l: 'December' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <div className="flex gap-3">
          <select className="input w-auto" value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })}>
            <option value="all">All Time</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="input w-auto" value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })}>
            <option value="all">All Months</option>
            {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SummaryCard title="Total Income" value={fmt(summary.income)} icon={TrendingUp} color="income" />
        <SummaryCard title="Total Expenses" value={fmt(summary.expenses)} icon={TrendingDown} color="expense" />
        <SummaryCard title="Net Balance" value={fmt(summary.net)} icon={DollarSign} color="primary" />
        <SummaryCard title="Total Debt" value={fmt(summary.debt)} icon={CreditCard} color="debt" />
        <SummaryCard title="Total Savings" value={fmt(summary.savings)} icon={PiggyBank} color="savings" />
        <SummaryCard title="Free Cash Flow" value={fmt(summary.net - summary.debt)} icon={DollarSign} color="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Expense Breakdown">
          <Doughnut
            data={{
              labels: expenseData.labels,
              datasets: [{ data: expenseData.data, backgroundColor: ['#0d9488','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#10b981','#6366f1','#ec4899'], borderWidth: 0 }],
            }}
            options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
          />
        </ChartCard>

        <ChartCard title="Income vs Expenses">
          <Bar
            data={{
              labels: ['Income', 'Expenses'],
              datasets: [{ data: [summary.income, summary.expenses], backgroundColor: ['#059669','#dc2626'], borderRadius: 8 }],
            }}
            options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }}
          />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Recent Transactions</h3>
          {!recentTxns.length ? <p className="text-sm text-gray-400">No transactions this month.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-400 border-b border-gray-100 dark:border-slate-700"><th className="pb-2">Date</th><th className="pb-2">Desc</th><th className="pb-2 text-right">Amount</th></tr></thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {recentTxns.map(t => (
                    <tr key={t.id}><td className="py-2 text-gray-500">{t.date}</td><td className="py-2">{t.description || '-'}</td><td className={`py-2 text-right font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(t.amount)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-500" />
            Upcoming Bills
          </h3>
          {!upcoming.length ? <p className="text-sm text-gray-400">No upcoming bills.</p> : (
            <div className="space-y-2">
              {upcoming.map(b => (
                <div key={b.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-slate-800">
                  <div>
                    <p className="text-sm font-medium">{b.name}</p>
                    <p className="text-xs text-gray-400">Due in {b.days_until} day{b.days_until !== 1 ? 's' : ''}</p>
                  </div>
                  <p className="text-sm font-bold text-rose-600">{fmt(b.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
