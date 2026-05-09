import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Wallet } from 'lucide-react'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        if (password !== passwordConfirm) {
          setError('Passwords do not match')
          return
        }
        await register({ username, email, first_name: firstName, last_name: lastName, password, password_confirm: passwordConfirm })
      }
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.password?.[0] || 'Something went wrong')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 text-white mb-4">
            <Wallet size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Budget Tracker</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{mode === 'login' ? 'Sign in to your account' : 'Create a new account'}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 p-3 rounded-lg">{error}</div>}

          {mode === 'register' && (
            <>
              <input className="input" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
              <div className="grid grid-cols-2 gap-3">
                <input className="input" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                <input className="input" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} required />
              </div>
            </>
          )}

          <input className="input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />

          {mode === 'register' && (
            <input className="input" type="password" placeholder="Confirm Password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} required />
          )}

          <button type="submit" className="btn-primary w-full">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {mode === 'login' ? (
              <> Don't have an account?{' '}
                <button type="button" className="text-primary-600 font-semibold" onClick={() => { setMode('register'); setError('') }}>Sign up</button>
              </>
            ) : (
              <> Already have an account?{' '}
                <button type="button" className="text-primary-600 font-semibold" onClick={() => { setMode('login'); setError('') }}>Sign in</button>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  )
}
