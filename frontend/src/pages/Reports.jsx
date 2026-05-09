import React, { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { Chart as ChartJS, ArcElement, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler } from 'chart.js'
import { Doughnut, Bar, Line } from 'react-chartjs-2'
import ChartCard from '../components/ChartCard'
import api from '../api/client'

ChartJS.register(ArcElement, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler)

export default function Reports() {
  const [filters, setFilters] = useState({ year: new Date().getFullYear().toString() })
  const [expenseCats, setExpenseCats] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    load()
  }, [filters])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const catsRes = await api.get('/transactions/by_category/', { params: { year: filters.year } })
      setExpenseCats(catsRes.data || [])

      const months = Array.from({ length: 12 }, (_, i) => i + 1)
      const promises = months.map(m =>
        api.get('/transactions/summary/', { params: { year: filters.year, month: String(m).padStart(2, '0') } })
      )
      const responses = await Promise.all(promises)
      const data = responses.map((res, i) => ({
        month: i + 1,
        income: res.data.income || 0,
        expenses: res.data.expenses || 0,
        net: res.data.net || 0,
      }))
      setMonthlyData(data)
    } catch (err) {
      setError('Failed to load report data.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    const headers = 'Month,Income,Expenses,Net\n'
    const rows = monthlyData.map(d => `${d.month},${d.income},${d.expenses},${d.net}`).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `report-${filters.year}.csv`
    a.click()
  }

  const years = Array.from({ length: 10 }, (_, i) => 2020 + i)
  const fmt = n => Number(n || 0).toLocaleString('en-PH')

  const hasCatData = expenseCats.length > 0
  const hasMonthlyData = monthlyData.some(d => d.income > 0 || d.expenses > 0)

  const catChartData = {
    labels: expenseCats.map(c => c.category__name || 'Uncategorized'),
    datasets: [{
      data: expenseCats.map(c => c.total),
      backgroundColor: ['#0d9488','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#10b981','#6366f1','#ec4899'],
      borderWidth: 0,
    }],
  }

  const barChartData = {
    labels: monthlyData.map(d => new Date(0, d.month - 1).toLocaleString('default', { month: 'short' })),
    datasets: [
      { label: 'Income', data: monthlyData.map(d => d.income), backgroundColor: '#059669', borderRadius: 4 },
      { label: 'Expenses', data: monthlyData.map(d => d.expenses), backgroundColor: '#dc2626', borderRadius: 4 },
    ],
  }

  const lineChartData = {
    labels: monthlyData.map(d => new Date(0, d.month - 1).toLocaleString('default', { month: 'short' })),
    datasets: [{
      label: 'Net Balance',
      data: monthlyData.map(d => d.net),
      borderColor: '#0d9488',
      backgroundColor: 'rgba(13,148,136,0.1)',
      fill: true,
      tension: 0.3,
    }],
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Reports &amp; Analytics</h1>
        <div className="flex gap-3">
          <select className="input w-auto" value={filters.year} onChange={e => setFilters({ year: e.target.value })}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={exportCSV} className="btn-ghost"><Download size={16} /> Export CSV</button>
        </div>
      </div>

      {loading && <p className="text-gray-500">Loading reports...</p>}
      {error && <p className="text-rose-600">{error}</p>}

      {!loading && !error && (
        <React.Fragment>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Spending by Category">
              {hasCatData ? (
                <Doughnut
                  data={catChartData}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  No expense data yet. Add transactions to see this chart.
                </div>
              )}
            </ChartCard>

            <ChartCard title="Monthly Cash Flow">
              {hasMonthlyData ? (
                <Bar
                  data={barChartData}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  No transaction data yet. Add income or expenses to see this chart.
                </div>
              )}
            </ChartCard>
          </div>

          <ChartCard title="Net Balance Trend">
            {hasMonthlyData ? (
              <Line
                data={lineChartData}
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                No transaction data yet. Add transactions to see this chart.
              </div>
            )}
          </ChartCard>

          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100 dark:border-slate-700">
                  <th className="pb-2">Month</th>
                  <th className="pb-2 text-right">Income</th>
                  <th className="pb-2 text-right">Expenses</th>
                  <th className="pb-2 text-right">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {monthlyData.map(d => (
                  <tr key={d.month}>
                    <td className="py-2">{new Date(0, d.month - 1).toLocaleString('default', { month: 'long' })}</td>
                    <td className="py-2 text-right text-emerald-600 font-semibold">{fmt(d.income)}</td>
                    <td className="py-2 text-right text-rose-600 font-semibold">{fmt(d.expenses)}</td>
                    <td className={`py-2 text-right font-bold ${d.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(d.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </React.Fragment>
      )}
    </div>
  )
}
