import React, { useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import Toast, { useToast } from './Toast'

export default function Layout({ children }) {
  const [open, setOpen] = useState(false)
  const { toasts, add, remove } = useToast()

  return (
    <div className="min-h-screen flex">
      <Sidebar open={open} setOpen={setOpen} />
      <div className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-gray-100 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
            <Menu size={20} />
          </button>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Budget & Debt Tracker</h2>
        </header>
        <main className="p-4 lg:p-6">{children}</main>
      </div>
      <Toast toasts={toasts} removeToast={remove} />
    </div>
  )
}
