import React from 'react'

export default function ChartCard({ title, children }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{title}</h3>
      <div className="relative h-64">{children}</div>
    </div>
  )
}
