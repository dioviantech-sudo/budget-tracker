import React, { useEffect } from 'react'
import { X, CheckCircle, AlertCircle } from 'lucide-react'

export default function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            t.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {t.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="ml-2 hover:opacity-70"><X size={16} /></button>
        </div>
      ))}
    </div>
  )
}

export function useToast() {
  const [toasts, setToasts] = React.useState([])

  const add = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => remove(id), 4000)
  }

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  return { toasts, add, remove }
}
