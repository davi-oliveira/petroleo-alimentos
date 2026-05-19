'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserCog, Plus, Minus, Trash2, ShoppingCart, CheckCircle,
  Loader2, LogOut, Search, ArrowLeft, QrCode, CreditCard,
  Banknote, UtensilsCrossed, ReceiptText,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import type { Product, CartItem, Order, PaymentMethod } from '@/lib/types'

const CATEGORY_META: Record<string, { label: string; emoji: string; color: string }> = {
  LANCHES:         { label: 'Lanches',         emoji: '🍔', color: '#f59e0b, #ea580c' },
  BEBIDAS:         { label: 'Bebidas',         emoji: '🥤', color: '#3b82f6, #06b6d4' },
  ACOMPANHAMENTOS: { label: 'Acompanhamentos', emoji: '🍟', color: '#eab308, #f97316' },
  SOBREMESAS:      { label: 'Sobremesas',      emoji: '🍦', color: '#ec4899, #a855f7' },
}

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { id: 'PIX',     label: 'PIX',     icon: <QrCode className="w-4 h-4" /> },
  { id: 'CARTAO',  label: 'Cartão',  icon: <CreditCard className="w-4 h-4" /> },
  { id: 'DINHEIRO',label: 'Dinheiro',icon: <Banknote className="w-4 h-4" /> },
]

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }

const STATUS_META: Record<string, { label: string; color: string }> = {
  AWAITING_PAYMENT: { label: 'Aguardando', color: '#94a3b8' },
  PAID:             { label: 'Pago',        color: '#f59e0b' },
  IN_PREPARATION:   { label: 'Preparando',  color: '#3b82f6' },
  READY:            { label: 'Pronto',      color: '#22c55e' },
  DELIVERED:        { label: 'Entregue',    color: '#64748b' },
}

export default function AtendentePage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [category, setCategory] = useState('LANCHES')
  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmedOrders, setConfirmedOrders] = useState<Order[]>([])
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  useEffect(() => {
    const tok = localStorage.getItem('auth_token')
    const role = localStorage.getItem('auth_role')
    const uname = localStorage.getItem('auth_username') ?? ''
    if (!tok || !['CUSTOMER', 'ADMIN', 'KITCHEN'].includes(role ?? '')) {
      router.replace('/login?redirect=/atendente')
      return
    }
    setToken(tok)
    setUsername(uname)
    api.getProducts(tok).then(setProducts).catch(() => {})
  }, [router])

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  function addToCart(product: Product) {
    setCart((prev) => {
      const ex = prev.find((i) => i.product.id === product.id)
      if (ex) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { product, quantity: 1 }]
    })
  }

  function removeFromCart(productId: number) {
    setCart((prev) => {
      const ex = prev.find((i) => i.product.id === productId)
      if (!ex) return prev
      if (ex.quantity === 1) return prev.filter((i) => i.product.id !== productId)
      return prev.map((i) => i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i)
    })
  }

  function deleteFromCart(productId: number) {
    setCart((prev) => prev.filter((i) => i.product.id !== productId))
  }

  function clearCart() {
    setCart([])
    setCustomerName('')
    setError('')
  }

  const total = cart.reduce((s, i) => s + i.product.price * i.quantity, 0)
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

  const filteredProducts = products.filter((p) => {
    const matchCat = p.category === category
    const matchSearch = search.trim() === '' || p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  async function handleConfirm() {
    if (!token || cart.length === 0) return
    setLoading(true)
    setError('')
    try {
      const items = cart.map((i) => ({
        name: i.product.name,
        quantity: i.quantity,
        unit_price: i.product.price,
      }))
      const created = await api.createOrder({ customer_name: customerName || undefined, items }, token)
      const paid = await api.payOrder(created.id, paymentMethod, token)
      setConfirmedOrders((prev) => [paid, ...prev])
      clearCart()
      showToast(`Pedido ${paid.code} registrado com sucesso!`, 'ok')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao registrar pedido'
      setError(msg)
      showToast(msg, 'err')
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_role')
    localStorage.removeItem('auth_username')
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[#060608] flex flex-col">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-3 flex items-center gap-4 bg-black/40 backdrop-blur-md sticky top-0 z-20">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
          <UserCog className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base leading-tight">Atendente</h1>
          <p className="text-slate-500 text-xs">Olá, {username}</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produto..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-white/5 border border-white/8 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-all"
            />
          </div>
        </div>
        <button onClick={logout}
          className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Products */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-white/5">
          {/* Categories */}
          <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-white/5 bg-black/20">
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => { setCategory(key); setSearch('') }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-xs transition-all border ${
                  category === key
                    ? 'text-white border-transparent'
                    : 'text-slate-400 border-white/8 bg-white/3 hover:bg-white/8'
                }`}
                style={category === key ? { background: `linear-gradient(135deg, ${meta.color})` } : {}}
              >
                <span>{meta.emoji}</span> {meta.label}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
            {filteredProducts.map((product) => {
              const qty = cart.find((c) => c.product.id === product.id)?.quantity ?? 0
              const color = CATEGORY_META[product.category]?.color ?? '#f59e0b, #ea580c'
              return (
                <motion.div
                  key={product.id}
                  whileTap={{ scale: 0.96 }}
                  className="glass rounded-xl overflow-hidden flex flex-col cursor-pointer hover:border-white/15 transition-all"
                  onClick={() => addToCart(product)}
                >
                  <div
                    className="h-20 flex items-center justify-center text-4xl"
                    style={{ background: `linear-gradient(135deg, ${color.replace(', ', '22, ')}22, ${color.split(', ')[1] ?? '#ea580c'}18)` }}
                  >
                    {product.emoji ?? '🍽️'}
                  </div>
                  <div className="p-2.5 flex flex-col flex-1">
                    <p className="text-white font-semibold text-xs leading-tight mb-1 line-clamp-2">{product.name}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-amber-400 font-bold text-xs">{fmt(product.price)}</span>
                      {qty > 0 && (
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded-lg text-white"
                          style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                          {qty}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-16 text-slate-700">
                <p className="text-4xl mb-2">🔍</p>
                <p>Nenhum produto encontrado</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart + Confirm */}
        <div className="w-80 xl:w-96 flex flex-col bg-black/20 overflow-hidden">
          {/* Cart header */}
          <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-white text-sm">Pedido</span>
            {cartCount > 0 && (
              <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                {cartCount}
              </span>
            )}
            {cartCount > 0 && (
              <button onClick={clearCart} className="text-slate-600 hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            <AnimatePresence>
              {cart.length === 0 ? (
                <div className="text-center py-16 text-slate-700">
                  <UtensilsCrossed className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Clique nos produtos para adicionar</p>
                </div>
              ) : cart.map((item) => (
                <motion.div
                  key={item.product.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 py-2 border-b border-white/5 last:border-0"
                >
                  <span className="text-lg flex-shrink-0">{item.product.emoji ?? '🍽️'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold truncate">{item.product.name}</p>
                    <p className="text-slate-600 text-xs">{fmt(item.product.price)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => removeFromCart(item.product.id)}
                      className="w-5 h-5 rounded bg-white/8 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="text-white text-xs font-bold w-4 text-center">{item.quantity}</span>
                    <button onClick={() => addToCart(item.product)}
                      className="w-5 h-5 rounded flex items-center justify-center text-white"
                      style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <span className="text-amber-400 text-xs font-bold w-14 text-right flex-shrink-0">
                    {fmt(item.product.price * item.quantity)}
                  </span>
                  <button onClick={() => deleteFromCart(item.product.id)}
                    className="text-slate-700 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order form */}
          {cart.length > 0 && (
            <div className="px-4 py-4 border-t border-white/5 space-y-3">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nome do cliente (opcional)"
                maxLength={60}
                className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-all"
              />

              <div className="flex gap-2">
                {PAYMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setPaymentMethod(opt.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      paymentMethod === opt.id
                        ? 'text-white border-violet-500/60 bg-violet-500/15'
                        : 'text-slate-500 border-white/8 bg-white/3 hover:bg-white/8'
                    }`}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex justify-between text-sm font-black text-white py-1">
                <span>Total</span>
                <span className="text-amber-400">{fmt(total)}</span>
              </div>

              {error && (
                <p className="text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleConfirm}
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {loading ? 'Processando...' : 'Registrar Pedido'}
              </motion.button>
            </div>
          )}

          {/* Session orders */}
          {confirmedOrders.length > 0 && (
            <div className="border-t border-white/5 max-h-60 overflow-y-auto">
              <div className="px-4 py-2.5 flex items-center gap-2 border-b border-white/5">
                <ReceiptText className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-xs font-semibold text-slate-500">Pedidos desta sessão</span>
                <span className="ml-auto text-xs text-slate-700">{confirmedOrders.length}</span>
              </div>
              {confirmedOrders.map((o) => {
                const sm = STATUS_META[o.status]
                return (
                  <div key={o.id} className="px-4 py-2 flex items-center gap-3 border-b border-white/3 last:border-0">
                    <span className="font-black text-sm" style={{ color: sm.color }}>{o.code}</span>
                    {o.customer_name && <span className="text-slate-500 text-xs truncate flex-1">{o.customer_name}</span>}
                    <span className="text-xs font-semibold ml-auto flex-shrink-0" style={{ color: sm.color }}>{sm.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl text-sm font-semibold shadow-2xl border ${
              toast.type === 'ok'
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/20 border-red-500/30 text-red-300'
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-6 py-2 border-t border-white/5 text-xs text-slate-700 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1 hover:text-slate-500 transition-colors">
          <ArrowLeft className="w-3 h-3" /> Início
        </Link>
        <span>Atendente — Petroleo Alimentos</span>
      </div>
    </div>
  )
}
