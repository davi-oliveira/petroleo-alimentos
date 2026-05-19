'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, User, Eye, EyeOff, UtensilsCrossed, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const redirect = params.get('redirect') || '/'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.login(username, password)
      localStorage.setItem('auth_token', data.access_token)
      localStorage.setItem('auth_role', data.role)
      localStorage.setItem('auth_username', data.username)
      router.push(redirect)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-[#060608]">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-[100px]"
          style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-15 blur-[100px]"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
            <UtensilsCrossed className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gradient">Petroleo Alimentos</h1>
          <p className="text-slate-400 mt-1 text-sm">Acesso restrito à equipe</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-6">Entrar no sistema</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Usuário</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="cozinha, atendente, admin..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/60 focus:bg-white/8 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/60 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.97 }}
              className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
            >
              {loading ? (
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : 'Entrar'}
            </motion.button>
          </form>

          {/* Hints */}
          <div className="mt-6 pt-5 border-t border-white/5">
            <p className="text-xs text-slate-600 mb-3">Credenciais de teste:</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
              {[
                { u: 'cozinha', p: 'cozinha123', label: 'Cozinha' },
                { u: 'atendente', p: 'atendente123', label: 'Atendente' },
                { u: 'admin', p: 'admin123', label: 'Admin' },
                { u: 'painel', p: 'painel123', label: 'Telão' },
              ].map((c) => (
                <button
                  key={c.u}
                  type="button"
                  onClick={() => { setUsername(c.u); setPassword(c.p) }}
                  className="text-left px-2.5 py-1.5 rounded-lg bg-white/3 hover:bg-white/8 border border-white/5 transition-all"
                >
                  <span className="block font-semibold text-slate-400">{c.label}</span>
                  <span className="text-slate-600">{c.u} / {c.p}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <Link
          href="/"
          className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm mt-6 justify-center transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao início
        </Link>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
