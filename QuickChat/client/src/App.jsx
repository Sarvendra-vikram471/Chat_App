import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import LoginPage from './pages/LoginPage.jsx'

const hasValidSession = () => {
  const cached = localStorage.getItem('qc_user')
  if (!cached) return false

  try {
    const parsed = JSON.parse(cached)
    return Boolean(parsed?.id)
  } catch {
    return false
  }
}

function App() {
  const hasSession = hasValidSession()

  return (
    <div className="min-h-screen bg-[url('./src/assets/bgImage.svg')] bg-no-repeat bg-center bg-cover">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={hasSession ? <HomePage /> : <Navigate to="/login" replace />} />
        <Route path="/profile" element={hasSession ? <ProfilePage /> : <Navigate to="/login" replace />} />
      </Routes>
    </div>
  )
}

export default App
