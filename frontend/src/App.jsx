import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import PrivateRoute from './components/PrivateRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Accounts from './pages/Accounts'
import Debts from './pages/Debts'
import Savings from './pages/Savings'
import Recurring from './pages/Recurring'
import Reports from './pages/Reports'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/accounts" element={<Accounts />} />
                <Route path="/debts" element={<Debts />} />
                <Route path="/savings" element={<Savings />} />
                <Route path="/recurring" element={<Recurring />} />
                <Route path="/reports" element={<Reports />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  )
}
