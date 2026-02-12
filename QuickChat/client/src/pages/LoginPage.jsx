import React from 'react'
import { useNavigate } from 'react-router-dom'
import assets from '../assets/assets'
import { apiFetch } from '../lib/api'

function LoginPage() {
  const [isLogin, setIsLogin] = React.useState(true)
  const [form, setForm] = React.useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!form.email || !form.password || (!isLogin && !form.displayName)) {
        setError('Please fill in all required fields.')
        return
      }

      if (!isLogin && form.password !== form.confirmPassword) {
        setError('Passwords do not match.')
        return
      }

      const payload = isLogin
        ? { email: form.email, password: form.password }
        : { displayName: form.displayName, email: form.email, password: form.password }

      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const user = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      localStorage.setItem('qc_user', JSON.stringify(user))
      navigate('/')
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl grid md:grid-cols-[1.2fr_1fr] rounded-3xl overflow-hidden border border-white/10 bg-[#0f1024]/70 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <div className="hidden md:flex flex-col gap-6 p-10 bg-white/5 border-r border-white/10">
          <img src={assets.logo_big} alt="QuickChat" className="max-w-52" />
          <p className="text-white/70 text-sm leading-6">
            Fast, focused, and beautiful conversations. Join QuickChat and stay connected with the people that matter.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[assets.pic1, assets.pic2, assets.pic3, assets.pic4].map((image, index) => (
              <img key={`${image}-${index}`} src={image} alt="Preview" className="rounded-2xl h-28 w-full object-cover" />
            ))}
          </div>
        </div>

        <div className="p-8 sm:p-10 text-white">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold">{isLogin ? 'Welcome back' : 'Create an account'}</h1>
              <p className="text-sm text-white/60 mt-1">
                {isLogin ? 'Sign in to continue your conversations.' : 'Start chatting with your friends.'}
              </p>
            </div>
            <img src={assets.logo_icon} alt="QuickChat" className="w-10" />
          </div>

          <div className="flex bg-white/10 rounded-full p-1 mb-6">
            <button
              className={`flex-1 py-2 text-sm rounded-full transition ${isLogin ? 'bg-violet-500/80' : 'text-white/60'}`}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button
              className={`flex-1 py-2 text-sm rounded-full transition ${!isLogin ? 'bg-violet-500/80' : 'text-white/60'}`}
              onClick={() => setIsLogin(false)}
            >
              Register
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="text-xs text-white/60">Full Name</label>
                <input
                  type="text"
                  name="displayName"
                  value={form.displayName}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-500/70"
                  placeholder="Jane Doe"
                />
              </div>
            )}
            <div>
              <label className="text-xs text-white/60">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-500/70"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-xs text-white/60">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-500/70"
                placeholder="********"
              />
            </div>
            {!isLogin && (
              <div>
                <label className="text-xs text-white/60">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-500/70"
                  placeholder="********"
                />
              </div>
            )}
            {error && <div className="text-xs text-red-300">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-violet-500/90 py-3 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-60"
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-xs text-white/50">
            By continuing you agree to our Terms & Privacy policy.
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
