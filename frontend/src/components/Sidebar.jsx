import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, ArrowLeftRight, Wallet, CreditCard, PiggyBank, CalendarDays, BarChart3, LogOut, Moon, Sun, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../api/client'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/accounts', label: 'Accounts', icon: Wallet },
  { to: '/debts', label: 'Debts', icon: CreditCard },
  { to: '/savings', label: 'Savings', icon: PiggyBank },
  { to: '/recurring', label: 'Recurring', icon: CalendarDays },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
]

export default function Sidebar({ open, setOpen }) {
  const { pathname } = useLocation()
  const { logout } = useAuth()
  const { theme, toggle } = useTheme()
  const [showReset, setShowReset] = useState(false)
  const [password, setPassword] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetting, setResetting] = useState(false)

  const handleReset = async (e) => {
    e.preventDefault()
    setResetError('')
    setResetting(true)
    try {
      await api.post('/auth/reset/', { password })
      setShowReset(false)
      setPassword('')
      window.location.reload()
    } catch (err) {
      setResetError(err.response?.data?.detail || 'Reset failed.')
    } finally {
      setResetting(false)
    }
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setOpen(false)} />
      )}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 flex flex-col transition-transform ${
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-6 border-b border-gray-100 dark:border-slate-800">
          <h1 className="text-lg font-bold text-primary-700 dark:text-primary-400">Budget Tracker</h1>
          <p className="text-xs text-gray-400 mt-1">Personal Finance</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {links.map(l => {
            const active = pathname === l.to
            return (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-slate-800'
                }`}
              >
                <l.icon size={18} />
                {l.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-slate-800 space-y-1">
          <button
            onClick={toggle}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-slate-800 w-full"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            onClick={() => setShowReset(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20 w-full"
          >
            <Trash2 size={18} />
            Reset Data
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 w-full"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {showReset && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Trash2 size={20} className="text-rose-500" />
              Reset All Data
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This will permanently delete all your transactions, accounts, debts, savings, and recurring bills. Enter your password to confirm.
            </p>
            <form onSubmit={handleReset} className="space-y-3">
              <input
                type="password"
                className="input w-full"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              {resetError && (
                <p className="text-sm text-rose-600">{resetError}</p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowReset(false); setPassword(''); setResetError('') }}
                  className="btn-ghost flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting || !password}
                  className="btn-danger flex-1"
                >
                  {resetting ? 'Resetting...' : 'Confirm Reset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
