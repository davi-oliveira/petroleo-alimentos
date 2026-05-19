'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Monitor, ChefHat, Tv2, UserCog, UtensilsCrossed } from 'lucide-react'

const roles = [
  {
    href: '/totem',
    icon: Monitor,
    title: 'Totem',
    subtitle: 'Auto-atendimento',
    desc: 'Faça seu pedido e pague sem precisar de atendente',
    gradient: 'from-amber-500 to-orange-600',
    glow: 'rgba(245,158,11,0.25)',
    delay: 0,
  },
  {
    href: '/atendente',
    icon: UserCog,
    title: 'Atendente',
    subtitle: 'Balcão',
    desc: 'Interface para o atendente registrar pedidos presencialmente',
    gradient: 'from-violet-500 to-purple-700',
    glow: 'rgba(139,92,246,0.25)',
    delay: 0.05,
  },
  {
    href: '/cozinha',
    icon: ChefHat,
    title: 'Cozinha',
    subtitle: 'Gestão de pedidos',
    desc: 'Acompanhe a fila de preparo e marque pedidos como prontos',
    gradient: 'from-blue-500 to-cyan-600',
    glow: 'rgba(59,130,246,0.25)',
    delay: 0.1,
  },
  {
    href: '/telao',
    icon: Tv2,
    title: 'Telão',
    subtitle: 'Painel de chamada',
    desc: 'Display público com pedidos em preparo e prontos para retirada',
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'rgba(16,185,129,0.25)',
    delay: 0.15,
  },
]

const floatingEmojis = ['🍔', '🍕', '🥤', '🍟', '🌭', '🍦', '🥗', '🍗']

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center px-4 py-12">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#060608]" />
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]"
          style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15 blur-[120px]"
          style={{ background: 'radial-gradient(circle, #ea580c, transparent 70%)' }} />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full opacity-10 blur-[80px]"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }} />
      </div>

      {/* Floating emojis */}
      {floatingEmojis.map((emoji, i) => (
        <motion.div
          key={i}
          className="fixed text-4xl select-none pointer-events-none opacity-10"
          style={{
            left: `${10 + (i % 4) * 25}%`,
            top: `${5 + Math.floor(i / 4) * 45}%`,
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, i % 2 === 0 ? 8 : -8, 0],
          }}
          transition={{
            duration: 3 + i * 0.4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.3,
          }}
        >
          {emoji}
        </motion.div>
      ))}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center mb-14"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
            <UtensilsCrossed className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gradient">
            Petroleo Alimentos
          </h1>
        </div>
        <p className="text-slate-400 text-lg">
          Selecione o perfil de acesso para continuar
        </p>
      </motion.div>

      {/* Role cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full max-w-5xl">
        {roles.map((role) => {
          const Icon = role.icon
          return (
            <motion.div
              key={role.href}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: role.delay }}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link href={role.href} className="block h-full">
                <div
                  className="h-full rounded-2xl p-6 flex flex-col gap-4 cursor-pointer transition-all duration-300"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: `0 0 0 transparent`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `0 8px 40px ${role.glow}`
                    e.currentTarget.style.borderColor = `${role.glow.replace('0.25', '0.4')}`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 0 transparent'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${role.gradient.replace('from-', '').replace(' to-', ', ').split(',').map(c => `var(--tw-${c.trim().replace(/-/g, '-')})`).join(', ')})` }}
                  >
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${role.gradient.includes('amber') ? '#f59e0b, #ea580c' : role.gradient.includes('violet') ? '#8b5cf6, #7c3aed' : role.gradient.includes('blue') ? '#3b82f6, #06b6d4' : '#10b981, #0d9488'})` }}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">
                      {role.subtitle}
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">{role.title}</h2>
                    <p className="text-sm text-slate-400 leading-relaxed">{role.desc}</p>
                  </div>
                  <div className="mt-auto">
                    <div
                      className="text-sm font-semibold px-4 py-2 rounded-lg text-center"
                      style={{
                        background: `linear-gradient(135deg, ${role.gradient.includes('amber') ? '#f59e0b, #ea580c' : role.gradient.includes('violet') ? '#8b5cf6, #7c3aed' : role.gradient.includes('blue') ? '#3b82f6, #06b6d4' : '#10b981, #0d9488'})`,
                        color: '#fff',
                      }}
                    >
                      Acessar →
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 text-slate-600 text-sm"
      >
        Petroleo Alimentos © {new Date().getFullYear()} — Sistema de Gestão de Praça de Alimentação
      </motion.p>
    </div>
  )
}
