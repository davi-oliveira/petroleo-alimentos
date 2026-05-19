'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tv2, UtensilsCrossed } from 'lucide-react'
import { api } from '@/lib/api'
import type { Order } from '@/lib/types'

const REFRESH_MS = 15_000
const READY_SECS = 300 // 5 minutes

function useNow(interval = 1000) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(t)
  }, [interval])
  return now
}

function CountdownRing({ updatedAt }: { updatedAt: string }) {
  const now = useNow()
  const updated = new Date(updatedAt + 'Z').getTime()
  const elapsed = (now - updated) / 1000
  const remaining = Math.max(0, READY_SECS - elapsed)
  const pct = remaining / READY_SECS
  const r = 22
  const circ = 2 * Math.PI * r
  const dash = circ * pct

  const color = pct > 0.5 ? '#22c55e' : pct > 0.2 ? '#f59e0b' : '#ef4444'
  const mins = Math.floor(remaining / 60)
  const secs = Math.floor(remaining % 60)

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle
          cx="28" cy="28" r={r} fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
          style={{ transition: 'stroke-dasharray 1s linear, stroke 1s' }}
        />
        <text x="28" y="32" textAnchor="middle" fill={color} fontSize="10" fontWeight="bold">
          {mins}:{secs.toString().padStart(2, '0')}
        </text>
      </svg>
      <span className="text-xs font-semibold" style={{ color }}>restante</span>
    </div>
  )
}

function CurrentTime() {
  const now = useNow(1000)
  return (
    <span className="tabular-nums">
      {new Date(now).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  )
}

export default function TelaoPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [lastFetch, setLastFetch] = useState<Date | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      const data = await api.getDisplayOrders()
      setOrders(data)
      setLastFetch(new Date())
    } catch {
      // silently retry on next interval
    }
  }, [])

  useEffect(() => {
    fetchOrders()
    const t = setInterval(fetchOrders, REFRESH_MS)
    return () => clearInterval(t)
  }, [fetchOrders])

  const inPreparation = orders.filter((o) => o.status === 'IN_PREPARATION')
  const ready = orders.filter((o) => o.status === 'READY')

  return (
    <div className="min-h-screen bg-[#030304] flex flex-col overflow-hidden">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-0 w-1/2 h-full opacity-5"
          style={{ background: 'linear-gradient(to right, #f59e0b, transparent)' }} />
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-5"
          style={{ background: 'linear-gradient(to left, #22c55e, transparent)' }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
            <UtensilsCrossed className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Petroleo Alimentos</h1>
            <p className="text-slate-600 text-sm">Acompanhe seu pedido</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {lastFetch && (
            <span className="text-slate-700 text-xs">
              Atualizado às {lastFetch.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <div className="text-right">
            <div className="text-3xl font-black text-white tabular-nums">
              <CurrentTime />
            </div>
            <div className="text-slate-600 text-xs capitalize">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
            </div>
          </div>
          <Tv2 className="w-6 h-6 text-slate-700" />
        </div>
      </div>

      {/* Two columns */}
      <div className="flex-1 grid grid-cols-2 divide-x divide-white/5 overflow-hidden">
        {/* Em Preparo */}
        <div className="flex flex-col overflow-hidden">
          <div className="px-8 py-4 flex items-center gap-3 border-b border-amber-500/15"
            style={{ background: 'rgba(245,158,11,0.04)' }}>
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" style={{ boxShadow: '0 0 10px #f59e0b80' }} />
            <h2 className="text-amber-400 font-black text-lg tracking-widest uppercase">Em Preparo</h2>
            <span className="ml-auto text-amber-500 font-bold text-2xl">{inPreparation.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            <AnimatePresence mode="popLayout">
              {inPreparation.length === 0 ? (
                <motion.div
                  key="empty-prep"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-64 text-slate-800"
                >
                  <span className="text-6xl mb-4">🍳</span>
                  <p className="text-lg font-semibold">Aguardando novos pedidos</p>
                </motion.div>
              ) : inPreparation.map((order) => (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="rounded-2xl px-6 py-4 flex items-center gap-4 border"
                  style={{
                    background: 'rgba(245,158,11,0.07)',
                    borderColor: 'rgba(245,158,11,0.2)',
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-5xl font-black text-amber-400 leading-none tracking-tight">
                      {order.code}
                    </div>
                    {order.customer_name && (
                      <div className="text-slate-400 text-lg mt-1 font-medium truncate">{order.customer_name}</div>
                    )}
                    <div className="text-slate-600 text-sm mt-1">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                    </div>
                  </div>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(245,158,11,0.15)' }}>
                    <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Prontos para Retirada */}
        <div className="flex flex-col overflow-hidden">
          <div className="px-8 py-4 flex items-center gap-3 border-b border-emerald-500/15"
            style={{ background: 'rgba(34,197,94,0.04)' }}>
            <div className="w-3 h-3 rounded-full bg-emerald-500" style={{ boxShadow: '0 0 10px #22c55e80' }} />
            <h2 className="text-emerald-400 font-black text-lg tracking-widest uppercase">Prontos para Retirada</h2>
            <span className="ml-auto text-emerald-500 font-bold text-2xl">{ready.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            <AnimatePresence mode="popLayout">
              {ready.length === 0 ? (
                <motion.div
                  key="empty-ready"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-64 text-slate-800"
                >
                  <span className="text-6xl mb-4">✅</span>
                  <p className="text-lg font-semibold">Nenhum pedido pronto</p>
                </motion.div>
              ) : ready.map((order) => (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="rounded-2xl px-6 py-4 flex items-center gap-4 border"
                  style={{
                    background: 'rgba(34,197,94,0.07)',
                    borderColor: 'rgba(34,197,94,0.25)',
                    boxShadow: '0 0 30px rgba(34,197,94,0.06)',
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-5xl font-black text-emerald-400 leading-none tracking-tight">
                      {order.code}
                    </div>
                    {order.customer_name && (
                      <div className="text-slate-300 text-lg mt-1 font-semibold truncate">{order.customer_name}</div>
                    )}
                    <div className="text-slate-500 text-sm mt-1">
                      Retire no balcão
                    </div>
                  </div>
                  <CountdownRing updatedAt={order.updated_at} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-3 border-t border-white/3 flex items-center justify-between text-xs text-slate-800">
        <span>Retire seu pedido no balcão assim que o número aparecer nesta tela</span>
        <span>Atualiza automaticamente a cada {REFRESH_MS / 1000}s</span>
      </div>
    </div>
  )
}
