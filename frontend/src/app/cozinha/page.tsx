'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChefHat, RefreshCw, LogOut, Clock, CheckCheck,
  Flame, Package, Bell, ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import type { Order, OrderStatus } from '@/lib/types'

const REFRESH_INTERVAL = 30

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; action: string }> = {
  PAID:           { label: 'Novo',       color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', action: 'Iniciar Preparo' },
  IN_PREPARATION: { label: 'Preparando', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)', action: 'Marcar Pronto' },
  READY:          { label: 'Pronto',     color: '#22c55e', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.25)',  action: 'Entrega Confirmada' },
}

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }

function ElapsedTimer({ since, warn = 5, danger = 10 }: { since: string; warn?: number; danger?: number }) {
  const [secs, setSecs] = useState(0)

  useEffect(() => {
    const ref = new Date(since + 'Z').getTime()
    function update() { setSecs(Math.floor((Date.now() - ref) / 1000)) }
    update()
    const t = setInterval(update, 5000)
    return () => clearInterval(t)
  }, [since])

  const mins = Math.floor(secs / 60)
  const label = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`
  const color = mins >= danger ? '#ef4444' : mins >= warn ? '#f59e0b' : '#22c55e'

  return (
    <span className="text-xs font-semibold flex items-center gap-1" style={{ color }}>
      <Clock className="w-3 h-3" /> {label}
    </span>
  )
}

export default function CozinhaPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL)
  const [token, setToken] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const tok = localStorage.getItem('auth_token')
    const role = localStorage.getItem('auth_role')
    const uname = localStorage.getItem('auth_username') ?? ''
    if (!tok || !['KITCHEN', 'ADMIN'].includes(role ?? '')) {
      router.replace('/login?redirect=/cozinha')
      return
    }
    setToken(tok)
    setUsername(uname)
  }, [router])

  const fetchOrders = useCallback(async (tok: string, silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const data = await api.getKitchenOrders(tok)
      setOrders(data)
    } catch {
      showToast('Erro ao carregar pedidos', 'err')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (!token) return
    fetchOrders(token)
  }, [token, fetchOrders])

  // Countdown auto-refresh
  useEffect(() => {
    if (!token) return
    setCountdown(REFRESH_INTERVAL)
    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          fetchOrders(token, true)
          return REFRESH_INTERVAL
        }
        return c - 1
      })
    }, 1000)
    countdownRef.current = tick
    return () => clearInterval(tick)
  }, [token, fetchOrders])

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleAction(order: Order) {
    if (!token) return
    setActionLoading(order.id)
    try {
      if (order.status === 'PAID') {
        await api.startPreparation(order.id, token)
        showToast(`Pedido ${order.code} — preparo iniciado!`, 'ok')
      } else if (order.status === 'IN_PREPARATION') {
        await api.markReady(order.id, token)
        showToast(`Pedido ${order.code} — marcado como pronto!`, 'ok')
      } else if (order.status === 'READY') {
        await api.markDelivered(order.id, token)
        showToast(`Pedido ${order.code} — entrega confirmada!`, 'ok')
      }
      await fetchOrders(token, true)
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro na operação', 'err')
    } finally {
      setActionLoading(null)
    }
  }

  function logout() {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_role')
    localStorage.removeItem('auth_username')
    router.push('/')
  }

  const paid = orders.filter((o) => o.status === 'PAID')
  const inPrep = orders.filter((o) => o.status === 'IN_PREPARATION')
  const ready = orders.filter((o) => o.status === 'READY')

  return (
    <div className="min-h-screen bg-[#060608] flex flex-col">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4 flex items-center gap-4 bg-black/40 backdrop-blur-md sticky top-0 z-20">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
          <ChefHat className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base leading-tight">Cozinha</h1>
          <p className="text-slate-500 text-xs">Olá, {username}</p>
        </div>

        {/* Stats */}
        <div className="flex-1 flex items-center justify-center gap-4 text-xs">
          {[
            { count: paid.length, label: 'Novos', color: '#f59e0b', Icon: Bell },
            { count: inPrep.length, label: 'Preparando', color: '#3b82f6', Icon: Flame },
            { count: ready.length, label: 'Prontos', color: '#22c55e', Icon: Package },
          ].map(({ count, label, color, Icon }) => (
            <div key={label} className="flex items-center gap-1.5" style={{ color }}>
              <Icon className="w-3.5 h-3.5" />
              <span className="font-bold">{count}</span>
              <span className="text-slate-500">{label}</span>
            </div>
          ))}
        </div>

        {/* Refresh */}
        <button
          onClick={() => token && fetchOrders(token, true)}
          disabled={refreshing}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{countdown}s</span>
        </button>

        <button onClick={logout}
          className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Carregando pedidos...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/5">
          {(['PAID', 'IN_PREPARATION', 'READY'] as OrderStatus[]).map((status) => {
            const cfg = STATUS_CONFIG[status]
            const statusOrders = orders.filter((o) => o.status === status)
            return (
              <div key={status} className="flex flex-col min-h-0">
                {/* Column header */}
                <div
                  className="px-5 py-3 flex items-center gap-3 sticky top-[65px] z-10 backdrop-blur-md"
                  style={{ background: `${cfg.bg}`, borderBottom: `1px solid ${cfg.border}` }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: cfg.color, boxShadow: `0 0 8px ${cfg.color}80` }}
                  />
                  <span className="font-bold text-sm" style={{ color: cfg.color }}>{cfg.label}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold ml-auto"
                    style={{ background: `${cfg.color}20`, color: cfg.color }}>
                    {statusOrders.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <AnimatePresence>
                    {statusOrders.length === 0 ? (
                      <div className="text-center py-12 text-slate-700">
                        <p className="text-4xl mb-2">
                          {status === 'PAID' ? '🎉' : status === 'IN_PREPARATION' ? '🍳' : '✅'}
                        </p>
                        <p className="text-sm">Nenhum pedido {cfg.label.toLowerCase()}</p>
                      </div>
                    ) : statusOrders.map((order) => (
                      <motion.div
                        key={order.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="rounded-xl p-4 border"
                        style={{ background: cfg.bg, borderColor: cfg.border }}
                      >
                        {/* Order header */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <span className="font-black text-xl" style={{ color: cfg.color }}>
                              {order.code}
                            </span>
                            {order.customer_name && (
                              <p className="text-slate-400 text-xs mt-0.5">{order.customer_name}</p>
                            )}
                          </div>
                          <ElapsedTimer
                            since={order.status === 'PAID' ? (order.paid_at ?? order.created_at) : order.updated_at}
                          />
                        </div>

                        {/* Items */}
                        <div className="space-y-1 mb-4">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <span className="text-slate-400 font-semibold w-5">{item.quantity}x</span>
                              <span className="text-white">{item.name}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 text-xs font-semibold">{fmt(order.total_amount)}</span>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAction(order)}
                            disabled={actionLoading === order.id}
                            className="px-4 py-2 rounded-lg text-white text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-60"
                            style={{ background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}99)` }}
                          >
                            {actionLoading === order.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCheck className="w-3 h-3" />
                            )}
                            {cfg.action}
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl text-white text-sm font-semibold shadow-2xl border ${
              toast.type === 'ok'
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/20 border-red-500/30 text-red-300'
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-6 py-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-700">
        <Link href="/" className="flex items-center gap-1 hover:text-slate-500 transition-colors">
          <ArrowLeft className="w-3 h-3" /> Início
        </Link>
        <span>Atualiza em {countdown}s</span>
      </div>
    </div>
  )
}
