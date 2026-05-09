import React from 'react'

export default function SummaryCard({ title, value, icon: Icon, color = 'primary' }) {
  const colorMap = {
    primary: 'text-primary-600 bg-primary-50',
    income: 'text-emerald-600 bg-emerald-50',
    expense: 'text-rose-600 bg-rose-50',
    debt: 'text-violet-600 bg-violet-50',
    savings: 'text-amber-600 bg-amber-50',
  }

  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colorMap[color] || colorMap.primary}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{title}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  )
}
