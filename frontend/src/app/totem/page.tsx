'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart, Plus, Minus, Trash2, ChevronLeft,
  CheckCircle, Loader2, UtensilsCrossed, QrCode,
  CreditCard, Banknote, ArrowRight, Home,
} from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import type { Product, CartItem, Order, PaymentMethod } from '@/lib/types'

type Step = 'welcome' | 'menu' | 'cart' | 'payment' | 'confirmation'

const CATEGORY_META: Record<string, { label: string; emoji: string; color: string }> = {
  LANCHES:         { label: 'Lanches',         emoji: '🍔', color: '#f59e0b, #ea580c' },
  BEBIDAS:         { label: 'Bebidas',         emoji: '🥤', color: '#3b82f6, #06b6d4' },
  ACOMPANHAMENTOS: { label: 'Acompanhamentos', emoji: '🍟', color: '#eab308, #f97316' },
  SOBREMESAS:      { label: 'Sobremesas',      emoji: '🍦', color: '#ec4899, #a855f7' },
}

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'PIX',     label: 'PIX',       icon: <QrCode className="w-8 h-8" />,    desc: 'Escaneie o QR Code e pague instantaneamente' },
  { id: 'CARTAO',  label: 'Cartão',    icon: <CreditCard className="w-8 h-8" />, desc: 'Crédito ou débito — aproxime ou insira o cartão' },
  { id: 'DINHEIRO',label: 'Dinheiro',  icon: <Banknote className="w-8 h-8" />,   desc: 'Pague no caixa após a confirmação do pedido' },
]

const slide = {
  initial: (d: number) => ({ opacity: 0, x: d > 0 ? 60 : -60 }),
  animate: { opacity: 1, x: 0 },
  exit:    (d: number) => ({ opacity: 0, x: d > 0 ? -60 : 60 }),
}

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function elapsed(created: string) {
  const diff = Math.floor((Date.now() - new Date(created + 'Z').getTime()) / 1000)
  if (diff < 60) return `${diff}s`
  return `${Math.floor(diff / 60)}m`
}

export default function TotemPage() {
  const [step, setStep] = useState<Step>('welcome')
  const [direction, setDirection] = useState(1)
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [category, setCategory] = useState('LANCHES')
  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(30)
  const [initError, setInitError] = useState('')

  // Auto-login as totem user
  useEffect(() => {
    api.login('totem', 'totem123')
      .then((d) => {
        setToken(d.access_token)
        return api.getProducts(d.access_token)
      })
      .then(setProducts)
      .catch(() => setInitError('Não foi possível conectar ao servidor. Tente novamente.'))
  }, [])

  // Countdown after confirmation
  useEffect(() => {
    if (step !== 'confirmation') return
    setCountdown(30)
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { reset(); return 30 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [step])

  function go(next: Step, dir = 1) {
    setDirection(dir)
    setStep(next)
    setError('')
  }

  function reset() {
    setCart([])
    setCustomerName('')
    setPaymentMethod(null)
    setOrder(null)
    setError('')
    go('welcome', -1)
  }

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { product, quantity: 1 }]
    })
  }

  function removeFromCart(productId: number) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === productId)
      if (!existing) return prev
      if (existing.quantity === 1) return prev.filter((i) => i.product.id !== productId)
      return prev.map((i) => i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i)
    })
  }

  function deleteFromCart(productId: number) {
    setCart((prev) => prev.filter((i) => i.product.id !== productId))
  }

  const total = cart.reduce((s, i) => s + i.product.price * i.quantity, 0)
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

  async function handleConfirmPayment() {
    if (!token || !paymentMethod) return
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
      setOrder(paid)
      go('confirmation', 1)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao processar pedido')
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter((p) => p.category === category)

  if (initError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 bg-[#060608]">
        <div className="text-6xl">⚠️</div>
        <p className="text-red-400 text-lg text-center">{initError}</p>
        <button onClick={() => window.location.reload()}
          className="px-6 py-3 rounded-xl text-white font-bold"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-hidden relative bg-[#060608]">
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[#060608]" />
        <motion.div
          animate={{ opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-[-10%] left-[-5%] w-[700px] h-[700px] rounded-full blur-[150px]"
          style={{ background: 'radial-gradient(circle, #f59e0b, transparent 65%)' }}
        />
        <motion.div
          animate={{ opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
          className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full blur-[150px]"
          style={{ background: 'radial-gradient(circle, #ea580c, transparent 65%)' }}
        />
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        {/* WELCOME */}
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            custom={direction}
            variants={slide}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
            onClick={() => products.length > 0 && go('menu')}
          >
            {products.length === 0 ? (
              <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
            ) : (
              <>
                <motion.div
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-28 h-28 rounded-3xl flex items-center justify-center mb-8 shadow-2xl"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
                >
                  <UtensilsCrossed className="w-14 h-14 text-white" />
                </motion.div>

                <h1 className="text-5xl md:text-6xl font-black mb-3 text-gradient">
                  Petroleo Alimentos
                </h1>
                <p className="text-slate-400 text-xl mb-12">Praça de Alimentação</p>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{ boxShadow: ['0 0 0px #f59e0b00', '0 0 40px #f59e0b55', '0 0 0px #f59e0b00'] }}
                  transition={{ boxShadow: { duration: 2, repeat: Infinity } }}
                  className="flex items-center gap-3 px-10 py-5 rounded-2xl text-xl font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
                >
                  Toque para começar <ArrowRight className="w-6 h-6" />
                </motion.button>

                <div className="flex gap-8 mt-16 text-5xl">
                  {['🍔', '🥤', '🍟', '🍦'].map((e, i) => (
                    <motion.span
                      key={i}
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
                    >
                      {e}
                    </motion.span>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* MENU */}
        {step === 'menu' && (
          <motion.div
            key="menu"
            custom={direction}
            variants={slide}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="min-h-screen flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/30 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                  <UtensilsCrossed className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-white text-lg">Cardápio</span>
              </div>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => cartCount > 0 ? go('cart') : undefined}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${cartCount > 0 ? 'text-white' : 'text-slate-600 opacity-50 cursor-default'}`}
                style={cartCount > 0 ? { background: 'linear-gradient(135deg, #f59e0b, #ea580c)' } : { background: 'rgba(255,255,255,0.06)' }}
              >
                <ShoppingCart className="w-4 h-4" />
                {cartCount > 0 && <span>{cartCount} {cartCount === 1 ? 'item' : 'itens'}</span>}
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </motion.button>
            </div>

            {/* Categories */}
            <div className="flex gap-2 px-6 py-4 overflow-x-auto no-scrollbar">
              {Object.entries(CATEGORY_META).map(([key, meta]) => (
                <motion.button
                  key={key}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setCategory(key)}
                  className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all border ${
                    category === key
                      ? 'text-white border-transparent'
                      : 'text-slate-400 border-white/10 bg-white/3 hover:bg-white/8'
                  }`}
                  style={category === key ? { background: `linear-gradient(135deg, ${meta.color})` } : {}}
                >
                  <span className="text-base">{meta.emoji}</span> {meta.label}
                </motion.button>
              ))}
            </div>

            {/* Products grid */}
            <div className="flex-1 px-6 pb-32 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product, i) => {
                  const qty = cart.find((c) => c.product.id === product.id)?.quantity ?? 0
                  const color = CATEGORY_META[product.category]?.color ?? '#f59e0b, #ea580c'
                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: i * 0.04 }}
                      className="glass rounded-2xl overflow-hidden flex flex-col"
                    >
                      {/* Emoji area */}
                      <div
                        className="h-32 flex items-center justify-center text-6xl relative"
                        style={{ background: `linear-gradient(135deg, ${color.replace(', ', '33, ')}33, ${color.split(', ')[1] ?? '#ea580c'}22)` }}
                      >
                        <span className="drop-shadow-lg">{product.emoji ?? '🍽️'}</span>
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="font-bold text-white text-sm leading-tight mb-1">{product.name}</h3>
                        {product.description && (
                          <p className="text-slate-500 text-xs leading-snug line-clamp-2 mb-3 flex-1">
                            {product.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-auto">
                          <span className="font-black text-amber-400 text-base">{fmt(product.price)}</span>
                          {qty === 0 ? (
                            <motion.button
                              whileTap={{ scale: 0.88 }}
                              onClick={() => addToCart(product)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                              style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
                            >
                              <Plus className="w-4 h-4" />
                            </motion.button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <motion.button whileTap={{ scale: 0.88 }} onClick={() => removeFromCart(product.id)}
                                className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                                <Minus className="w-3 h-3" />
                              </motion.button>
                              <span className="font-bold text-white text-sm w-4 text-center">{qty}</span>
                              <motion.button whileTap={{ scale: 0.88 }} onClick={() => addToCart(product)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                                style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                                <Plus className="w-3 h-3" />
                              </motion.button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* Bottom bar */}
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.div
                  initial={{ y: 100 }}
                  animate={{ y: 0 }}
                  exit={{ y: 100 }}
                  className="fixed bottom-0 left-0 right-0 px-6 pb-6 pt-4 bg-gradient-to-t from-[#060608] via-[#060608]/95 to-transparent"
                >
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => go('cart')}
                    className="w-full py-4 rounded-2xl font-bold text-white text-lg flex items-center justify-between px-6 shadow-2xl"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', boxShadow: '0 8px 32px rgba(245,158,11,0.35)' }}
                  >
                    <span className="bg-white/20 rounded-lg px-2.5 py-0.5 text-sm">{cartCount}</span>
                    <span>Ver carrinho</span>
                    <span className="font-black">{fmt(total)}</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* CART */}
        {step === 'cart' && (
          <motion.div
            key="cart"
            custom={direction}
            variants={slide}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="min-h-screen flex flex-col"
          >
            <div className="flex items-center gap-4 px-6 py-4 border-b border-white/5 bg-black/30 backdrop-blur-md sticky top-0 z-10">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => go('menu', -1)}
                className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
              <h1 className="font-bold text-white text-lg">Seu Pedido</h1>
              <span className="text-slate-500 text-sm ml-auto">{cartCount} {cartCount === 1 ? 'item' : 'itens'}</span>
            </div>

            <div className="flex-1 px-6 py-6 pb-40 space-y-3 overflow-y-auto">
              <AnimatePresence>
                {cart.map((item) => (
                  <motion.div
                    key={item.product.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="glass rounded-xl p-4 flex items-center gap-4"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${CATEGORY_META[item.product.category]?.color ?? '#f59e0b, #ea580c'}44)` }}
                    >
                      {item.product.emoji ?? '🍽️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{item.product.name}</p>
                      <p className="text-slate-500 text-xs">{fmt(item.product.price)} cada</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button whileTap={{ scale: 0.88 }} onClick={() => removeFromCart(item.product.id)}
                        className="w-7 h-7 rounded-lg bg-white/8 flex items-center justify-center text-white hover:bg-white/16 transition-colors">
                        <Minus className="w-3 h-3" />
                      </motion.button>
                      <span className="font-bold text-white text-sm w-5 text-center">{item.quantity}</span>
                      <motion.button whileTap={{ scale: 0.88 }} onClick={() => addToCart(item.product)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                        style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                        <Plus className="w-3 h-3" />
                      </motion.button>
                    </div>
                    <div className="w-16 text-right">
                      <p className="font-bold text-amber-400 text-sm">{fmt(item.product.price * item.quantity)}</p>
                    </div>
                    <motion.button whileTap={{ scale: 0.88 }} onClick={() => deleteFromCart(item.product.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors ml-1">
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Name input */}
              <div className="glass rounded-xl p-4 mt-4">
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Seu nome (opcional — para chamar na retirada)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: Carlos, Maria..."
                  maxLength={60}
                  className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/60 transition-all"
                />
              </div>

              {/* Total */}
              <div className="glass rounded-xl p-4 space-y-2">
                {cart.map((i) => (
                  <div key={i.product.id} className="flex justify-between text-sm text-slate-400">
                    <span>{i.quantity}x {i.product.name}</span>
                    <span>{fmt(i.product.price * i.quantity)}</span>
                  </div>
                ))}
                <div className="border-t border-white/8 pt-2 flex justify-between font-black text-white text-lg">
                  <span>Total</span>
                  <span className="text-amber-400">{fmt(total)}</span>
                </div>
              </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 px-6 pb-6 pt-4 bg-gradient-to-t from-[#060608] via-[#060608]/95 to-transparent">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => go('payment')}
                className="w-full py-4 rounded-2xl font-bold text-white text-lg flex items-center justify-center gap-3"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', boxShadow: '0 8px 32px rgba(245,158,11,0.35)' }}
              >
                Escolher pagamento <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* PAYMENT */}
        {step === 'payment' && (
          <motion.div
            key="payment"
            custom={direction}
            variants={slide}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="min-h-screen flex flex-col"
          >
            <div className="flex items-center gap-4 px-6 py-4 border-b border-white/5 bg-black/30 backdrop-blur-md sticky top-0 z-10">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => go('cart', -1)}
                className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
              <h1 className="font-bold text-white text-lg">Forma de Pagamento</h1>
            </div>

            <div className="flex-1 px-6 py-8 pb-40 space-y-4">
              <p className="text-slate-400 text-sm mb-6">Selecione como prefere pagar:</p>
              {PAYMENT_OPTIONS.map((opt) => (
                <motion.button
                  key={opt.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setPaymentMethod(opt.id)}
                  className={`w-full text-left rounded-2xl p-5 flex items-center gap-5 border transition-all ${
                    paymentMethod === opt.id
                      ? 'border-amber-500/60 bg-amber-500/10'
                      : 'glass border-transparent hover:border-white/15'
                  }`}
                >
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${
                      paymentMethod === opt.id ? 'text-white' : 'text-slate-400'
                    }`}
                    style={paymentMethod === opt.id ? { background: 'linear-gradient(135deg, #f59e0b, #ea580c)' } : { background: 'rgba(255,255,255,0.06)' }}
                  >
                    {opt.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{opt.label}</h3>
                    <p className="text-slate-400 text-sm">{opt.desc}</p>
                  </div>
                  {paymentMethod === opt.id && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto">
                      <CheckCircle className="w-6 h-6 text-amber-500" />
                    </motion.div>
                  )}
                </motion.button>
              ))}

              {/* PIX QR placeholder */}
              <AnimatePresence>
                {paymentMethod === 'PIX' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="glass-amber rounded-2xl p-6 text-center overflow-hidden"
                  >
                    <div className="w-40 h-40 mx-auto bg-white rounded-xl flex items-center justify-center mb-4">
                      <QrCode className="w-32 h-32 text-black" />
                    </div>
                    <p className="text-amber-400 font-bold">{fmt(total)}</p>
                    <p className="text-slate-400 text-xs mt-1">Escaneie o código acima no seu app de pagamento</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  {error}
                </div>
              )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 px-6 pb-6 pt-4 bg-gradient-to-t from-[#060608] via-[#060608]/95 to-transparent">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleConfirmPayment}
                disabled={!paymentMethod || loading}
                className="w-full py-4 rounded-2xl font-bold text-white text-lg flex items-center justify-center gap-3 disabled:opacity-50 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', boxShadow: '0 8px 32px rgba(245,158,11,0.35)' }}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Confirmar pedido — {fmt(total)}</>}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* CONFIRMATION */}
        {step === 'confirmation' && order && (
          <motion.div
            key="confirmation"
            custom={direction}
            variants={slide}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="mb-6"
            >
              <CheckCircle className="w-24 h-24 text-emerald-400" style={{ filter: 'drop-shadow(0 0 20px rgba(52,211,153,0.5))' }} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h1 className="text-3xl font-black text-white mb-2">Pedido Confirmado!</h1>
              {order.customer_name && (
                <p className="text-slate-400 text-lg mb-6">Obrigado, <span className="text-white font-semibold">{order.customer_name}</span>!</p>
              )}

              <div className="glass-amber rounded-3xl p-8 mb-6 inline-block">
                <p className="text-slate-400 text-sm font-semibold uppercase tracking-widest mb-2">Número do pedido</p>
                <p className="text-7xl font-black text-gradient">{order.code}</p>
                <p className="text-slate-400 text-sm mt-2">Guarde este número para retirada</p>
              </div>

              <div className="glass rounded-2xl p-5 text-left max-w-sm mx-auto mb-6">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between py-1.5 text-sm">
                    <span className="text-slate-300">{item.quantity}x {item.name}</span>
                    <span className="text-slate-500">{fmt(item.unit_price * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t border-white/8 pt-2 mt-2 flex justify-between font-bold text-white">
                  <span>Total</span>
                  <span className="text-amber-400">{fmt(order.total_amount)}</span>
                </div>
              </div>

              <p className="text-slate-500 text-sm mb-6">
                Reiniciando em <span className="text-amber-400 font-bold">{countdown}s</span>...
              </p>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={reset}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white mx-auto"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
              >
                <Home className="w-5 h-5" /> Novo pedido
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back to home (small) */}
      {step === 'welcome' && (
        <Link href="/" className="fixed bottom-4 left-4 text-slate-700 hover:text-slate-400 transition-colors text-xs">
          ← Início
        </Link>
      )}
    </div>
  )
}
