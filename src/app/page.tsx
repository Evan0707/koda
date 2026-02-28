'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  Users,
  FileText,
  FolderKanban,
  Sparkles,
  Receipt,
  Shield,
  Check,
  ChevronDown,
  Play,
  Star,
  Zap,
  TrendingUp,
  Menu,
  X,
  MousePointer2,
  Send,
  CreditCard,
  Mail,
  Calendar,
  BarChart3
} from 'lucide-react'
import { ThemeLogo } from '@/components/theme-logo'

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }
}

// Section component with scroll animation
function AnimatedSection({ children, className = '', delay = 0, ...props }: { children: React.ReactNode, className?: string, delay?: number } & React.ComponentProps<typeof motion.section>) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay } }
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.section>
  )
}

// Stats counter animation
function AnimatedCounter({ value, suffix = '', prefix = '' }: { value: number, suffix?: string, prefix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView) {
      let start = 0
      const end = value
      const duration = 2000
      const increment = end / (duration / 16)

      const timer = setInterval(() => {
        start += increment
        if (start >= end) {
          setCount(end)
          clearInterval(timer)
        } else {
          setCount(Math.floor(start))
        }
      }, 16)

      return () => clearInterval(timer)
    }
  }, [isInView, value])

  return <span ref={ref}>{prefix}{count.toLocaleString('fr-FR')}{suffix}</span>
}

// Typing animation for hero
function TypeWriter({ words, className }: { words: string[], className?: string }) {
  const [isMounted, setIsMounted] = useState(false)
  const [currentWord, setCurrentWord] = useState(0)
  const [currentText, setCurrentText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    const word = words[currentWord]
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setCurrentText(word.substring(0, currentText.length + 1))
        if (currentText === word) {
          setTimeout(() => setIsDeleting(true), 2000)
        }
      } else {
        setCurrentText(word.substring(0, currentText.length - 1))
        if (currentText === '') {
          setIsDeleting(false)
          setCurrentWord((prev) => (prev + 1) % words.length)
        }
      }
    }, isDeleting ? 50 : 100)

    return () => clearTimeout(timeout)
  }, [currentText, isDeleting, currentWord, words, isMounted])

  // Render static text on server, animated text on client
  if (!isMounted) {
    return <span className={className}>{words[0]}</span>
  }

  return (
    <span className={className}>
      {currentText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="inline-block w-[3px] h-[1em] bg-foreground ml-1 align-middle"
      />
    </span>
  )
}

// Feature card
function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative bg-card border border-border rounded-xl p-6 hover:border-foreground/20 hover:shadow-lg transition-all duration-300"
    >
      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4 group-hover:bg-foreground/10 transition-colors">
        <Icon className="w-6 h-6 text-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </motion.div>
  )
}

// Pricing card
function PricingCard({
  name,
  price,
  description,
  features,
  popular = false,
  cta = "Commencer"
}: {
  name: string
  price: string
  description: string
  features: string[]
  popular?: boolean
  cta?: string
}) {
  return (
    <motion.div
      variants={scaleIn}
      whileHover={{ y: -8 }}
      className={`relative rounded-xl p-8 ${popular
        ? 'bg-foreground text-background border-2 border-foreground shadow-xl'
        : 'bg-card border border-border'
        }`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1 bg-background text-foreground text-xs font-medium rounded-full border border-border">
            Le plus populaire
          </span>
        </div>
      )}

      <div className="text-center mb-8">
        <h3 className={`text-xl font-semibold mb-2 ${popular ? 'text-background' : 'text-foreground'}`}>{name}</h3>
        <p className={`text-sm mb-6 ${popular ? 'text-background/70' : 'text-muted-foreground'}`}>{description}</p>
        <div className="flex items-baseline justify-center gap-1">
          <span className={`text-4xl font-bold ${popular ? 'text-background' : 'text-foreground'}`}>{price}</span>
          <span className={`${popular ? 'text-background/70' : 'text-muted-foreground'}`}>€/mois</span>
        </div>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3">
            <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${popular ? 'text-background/70' : 'text-muted-foreground'}`} />
            <span className={`text-sm ${popular ? 'text-background/90' : 'text-foreground'}`}>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        className={`w-full py-5 ${popular
          ? 'bg-background text-foreground hover:bg-background/90'
          : 'bg-foreground text-background hover:bg-foreground/90'
          }`}
      >
        {cta}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </motion.div>
  )
}

// Testimonial card
function TestimonialCard({
  quote,
  author,
  role,
  avatar,
  rating
}: {
  quote: string
  author: string
  role: string
  avatar: string
  rating: number
}) {
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ scale: 1.02 }}
      className="bg-card border border-border rounded-xl p-6"
    >
      <div className="flex gap-0.5 mb-4">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="w-4 h-4 text-foreground fill-foreground" />
        ))}
      </div>
      <p className="text-foreground mb-6 leading-relaxed">"{quote}"</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground text-sm font-medium">
          {avatar}
        </div>
        <div>
          <p className="font-medium text-foreground text-sm">{author}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
      </div>
    </motion.div>
  )
}

// FAQ Item
function FAQItem({ question, answer, isOpen, onClick }: { question: string, answer: string, isOpen: boolean, onClick: () => void }) {
  return (
    <motion.div
      variants={fadeInUp}
      className="border-b border-border"
    >
      <button
        onClick={onClick}
        className="w-full py-5 flex items-center justify-between text-left"
      >
        <span className="font-medium text-foreground">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-muted-foreground leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Integration logo
function IntegrationLogo({ name, icon: Icon }: { name: string, icon: React.ComponentType<{ className?: string }> }) {
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ scale: 1.05, y: -2 }}
      className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg"
    >
      <Icon className="w-5 h-5 text-muted-foreground" />
      <span className="text-sm font-medium text-foreground">{name}</span>
    </motion.div>
  )
}

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFAQ, setOpenFAQ] = useState<number | null>(0)
  const { scrollYProgress } = useScroll()
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])

  const faqs = [
    { question: "Y a-t-il un essai gratuit ?", answer: "Oui ! Chaque plan payant (Starter et Pro) bénéficie de 14 jours d'essai gratuit, sans carte bancaire requise. Vous pouvez aussi utiliser le plan Gratuit sans limite de durée." },
    { question: "Comment fonctionne la signature électronique ?", answer: "Envoyez un lien de signature à vos clients par email. Ils peuvent signer depuis n'importe quel appareil. Les signatures sont légalement valides et conformes eIDAS." },
    { question: "Puis-je importer mes données existantes ?", answer: "Absolument ! Nous supportons l'import CSV/Excel pour vos contacts, produits et historique. Notre équipe peut vous accompagner." },
    { question: "L'IA est-elle vraiment incluse ?", answer: "Oui, l'IA est intégrée dans le plan Pro. Elle vous aide à rédiger des devis, emails et analyse vos données pour des insights pertinents." },
    { question: "Comment fonctionne la facturation ?", answer: "Les factures sont générées automatiquement à partir de vos devis signés. Vous pouvez aussi créer des factures manuellement. Export FEC inclus pour votre comptable." },
    { question: "Puis-je changer de plan à tout moment ?", answer: "Oui, vous pouvez upgrader, downgrader ou annuler votre abonnement à tout moment. Aucun engagement, aucuns frais cachés." },
  ]

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Grid pattern background */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div style={{ y: backgroundY }} className="absolute inset-0">
          <div
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
            style={{
              backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }}
          />
        </motion.div>
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-foreground/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-foreground/3 rounded-full blur-[100px]" />
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border"
      >
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <ThemeLogo className="w-8 h-8" />
              <span className="text-lg font-semibold text-foreground">KodaFlow</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Fonctionnalités</a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Comment ça marche</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Tarifs</a>
              <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors text-sm">FAQ</a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Connexion
                </Button>
              </Link>
              <Link href="/signup">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90">
                    Démarrer
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </motion.div>
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-foreground"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border bg-background"
            >
              <div className="px-6 py-4 flex flex-col gap-4">
                <a href="#features" className="text-muted-foreground hover:text-foreground text-sm">Fonctionnalités</a>
                <a href="#how-it-works" className="text-muted-foreground hover:text-foreground text-sm">Comment ça marche</a>
                <a href="#pricing" className="text-muted-foreground hover:text-foreground text-sm">Tarifs</a>
                <a href="#faq" className="text-muted-foreground hover:text-foreground text-sm">FAQ</a>
                <hr className="border-border" />
                <Link href="/login">
                  <Button variant="ghost" className="w-full justify-center">Connexion</Button>
                </Link>
                <Link href="/signup">
                  <Button className="w-full bg-foreground text-background">Démarrer</Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border mb-8"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-3.5 h-3.5 text-foreground" />
              </motion.div>
              <span className="text-xs text-muted-foreground">CRM, devis, factures — tout-en-un avec IA intégrée</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl md:text-6xl font-bold text-foreground leading-[1.1] mb-6 tracking-tight"
            >
              Le tout-en-un pour{' '}
              <br className="hidden sm:block" />
              <TypeWriter
                words={['les freelances', 'les agences', 'les consultants', 'votre business']}
                className="text-muted-foreground"
              />
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed"
            >
              CRM, devis, factures, projets et comptabilité.
              Un seul outil, un seul abonnement, zéro friction.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <Link href="/signup">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button size="lg" className="w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90 px-6">
                    Démarrer gratuitement
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="mt-12 flex flex-col items-center"
            >
              <div className="flex -space-x-2 mb-3">
                {['MS', 'AL', 'JP', 'LM', 'SG'].map((initials, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + i * 0.1 }}
                    className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-foreground text-[10px] font-medium"
                  >
                    {initials}
                  </motion.div>
                ))}
              </div>
              <div className="flex items-center gap-0.5 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-foreground fill-foreground" />
                ))}
              </div>
              <p className="text-muted-foreground text-sm">
                <span className="text-foreground font-medium">+90</span> professionnels nous font confiance
              </p>
            </motion.div>
          </div>

          {/* Hero mockup with gradient overlay */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16 relative"
          >
            <div className="relative rounded-xl overflow-hidden border border-border shadow-2xl shadow-foreground/5">
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
              <img
                src="/screen.jpg"
                alt="KodaFlow Dashboard - Gestion des factures"
                className="w-full h-auto"
              />
            </div>

            {/* Floating elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -left-4 bg-card border border-border rounded-lg p-3 shadow-lg hidden md:block"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Revenus</p>
                  <p className="text-sm font-semibold text-foreground">+24.5%</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-4 -right-4 bg-card border border-border rounded-lg p-3 shadow-lg hidden md:block"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Devis signé</p>
                  <p className="text-sm font-semibold text-foreground">12 500 €</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Integrations logos */}
      <AnimatedSection className="py-12 px-6 border-y border-border bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-sm text-muted-foreground mb-6">Intégrations avec vos outils préférés</p>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-3"
          >
            <IntegrationLogo name="Stripe" icon={CreditCard} />
            <IntegrationLogo name="Gmail" icon={Mail} />
            <IntegrationLogo name="Calendrier" icon={Calendar} />
            <IntegrationLogo name="Analytics" icon={BarChart3} />
            <IntegrationLogo name="Signature" icon={MousePointer2} />
            <IntegrationLogo name="Notifications" icon={Send} />
          </motion.div>
        </div>
      </AnimatedSection>

      {/* Stats Section */}
      <AnimatedSection className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { value: 500, suffix: '+', label: 'Utilisateurs actifs' },
              { value: 12, suffix: 'M€', label: 'De revenus gérés' },
              { value: 98, suffix: '%', label: 'Satisfaction client' },
              { value: 24, suffix: '/7', label: 'Support client' },
            ].map((stat, i) => (
              <motion.div key={i} variants={fadeInUp} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* How it works Section */}
      <AnimatedSection id="how-it-works" className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <span className="inline-block px-3 py-1 bg-card border border-border rounded-full text-muted-foreground text-xs mb-4">
                Comment ça marche
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                3 étapes pour décoller
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Simplifiez votre quotidien en quelques minutes
              </p>
            </motion.div>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              { step: '01', title: 'Créez votre compte', description: 'Inscription en 30 secondes. Importez vos contacts existants ou partez de zéro.', icon: Users },
              { step: '02', title: 'Envoyez vos devis', description: 'Créez des devis professionnels, ajoutez votre signature électronique et envoyez-les en un clic.', icon: FileText },
              { step: '03', title: 'Encaissez automatiquement', description: 'Les factures sont générées à la signature. Paiement en ligne via Stripe intégré.', icon: Receipt },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeInUp} className="relative">
                <div className="bg-card border border-border rounded-xl p-8 h-full">
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-5xl font-bold text-muted-foreground/20">{item.step}</span>
                    <div className="w-12 h-12 bg-foreground rounded-lg flex items-center justify-center">
                      <item.icon className="w-6 h-6 text-background" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-[2px] bg-border" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* Features Section */}
      <AnimatedSection id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <span className="inline-block px-3 py-1 bg-muted border border-border rounded-full text-muted-foreground text-xs mb-4">
                Fonctionnalités
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Tout ce dont vous avez besoin
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Un seul outil pour gérer l'intégralité de votre activité freelance
              </p>
            </motion.div>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {[
              { icon: Users, title: 'CRM intelligent', description: 'Gérez vos contacts, suivez votre pipeline et ne perdez plus jamais une opportunité.' },
              { icon: FileText, title: 'Devis & Signatures', description: 'Créez des devis professionnels et faites-les signer électroniquement.' },
              { icon: FolderKanban, title: 'Gestion de projets', description: 'Organisez vos tâches, suivez votre temps et analysez la rentabilité.' },
              { icon: Receipt, title: 'Facturation auto', description: 'Générez automatiquement vos factures à partir de vos devis signés.' },
              { icon: Sparkles, title: 'IA intégrée', description: 'Laissez l\'IA vous aider à rédiger vos documents et optimiser votre activité.' },
              { icon: Shield, title: 'Contrats légaux', description: 'Créez et signez vos contrats directement depuis l\'application.' },
            ].map((feature, i) => (
              <FeatureCard key={i} {...feature} />
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* Pricing Section */}
      <AnimatedSection id="pricing" className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <span className="inline-block px-3 py-1 bg-card border border-border rounded-full text-muted-foreground text-xs mb-4">
                Tarifs
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Un plan pour chaque ambition
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Commencez gratuitement, puis évoluez selon vos besoins. 14 jours d'essai gratuit sur tous les plans payants.
              </p>
            </motion.div>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            <PricingCard
              name="Gratuit"
              price="0"
              description="Pour démarrer votre activité"
              features={[
                '10 factures / mois',
                '10 devis / mois',
                '50 contacts',
                '5 projets',
                'Paiement Stripe',
                'Envoi par email',
              ]}
              cta="Commencer gratuitement"
            />
            <PricingCard
              name="Starter"
              price="19"
              description="Pour les freelances actifs"
              popular
              features={[
                '100 factures / mois',
                '100 devis / mois',
                '500 contacts',
                '50 projets',
                'Tous les moyens de paiement',
                'IA email + modèles',
              ]}
              cta="Essayer 14 jours gratuit"
            />
            <PricingCard
              name="Pro"
              price="49"
              description="Pour les agences et équipes"
              features={[
                'Factures illimitées',
                'Devis illimités',
                'Contacts illimités',
                'Projets illimités',
                'Toutes les fonctionnalités',
                'IA complète + Co-pilote',
              ]}
              cta="Essayer 14 jours gratuit"
            />
          </motion.div>

          <p className="text-center text-muted-foreground text-sm mt-8">
            ✓ Sans engagement · ✓ Annulation à tout moment · ✓ Paiement sécurisé via Stripe
          </p>
        </div>
      </AnimatedSection>

      {/* Testimonials Section */}
      <AnimatedSection id="testimonials" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <span className="inline-block px-3 py-1 bg-muted border border-border rounded-full text-muted-foreground text-xs mb-4">
                Témoignages
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Ils adorent KodaFlow
              </h2>
            </motion.div>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-4"
          >
            <TestimonialCard
              quote="KodaFlow a transformé ma façon de gérer mon activité. Je gagne au moins 5h par semaine !"
              author="Marie S."
              role="Designer freelance"
              avatar="MS"
              rating={5}
            />
            <TestimonialCard
              quote="Enfin un outil qui comprend les besoins des freelances. La signature électronique est un game-changer."
              author="Alexandre L."
              role="Développeur web"
              avatar="AL"
              rating={5}
            />
            <TestimonialCard
              quote="L'IA m'aide à rédiger mes devis en quelques minutes. Je ne pourrais plus m'en passer."
              author="Julie P."
              role="Consultante marketing"
              avatar="JP"
              rating={5}
            />
          </motion.div>
        </div>
      </AnimatedSection>

      {/* FAQ Section */}
      <AnimatedSection id="faq" className="py-20 px-6 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <span className="inline-block px-3 py-1 bg-card border border-border rounded-full text-muted-foreground text-xs mb-4">
                FAQ
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Questions fréquentes
              </h2>
            </motion.div>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {faqs.map((faq, i) => (
              <FAQItem
                key={i}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFAQ === i}
                onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
              />
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative bg-foreground text-background rounded-2xl p-10 md:p-14 text-center overflow-hidden"
          >
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 border border-background/10 rounded-full" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 border border-background/10 rounded-full" />

            <h2 className="text-2xl md:text-4xl font-bold mb-4 relative z-10">
              Prêt à transformer votre activité ?
            </h2>
            <p className="text-background/70 mb-8 max-w-lg mx-auto relative z-10">
              Rejoignez plus de 500 professionnels qui ont déjà simplifié leur quotidien avec KodaFlow.
            </p>
            <Link href="/signup">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="relative z-10">
                <Button size="lg" className="bg-background text-foreground hover:bg-background/90 px-8">
                  Commencer gratuitement
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            </Link>
            <p className="text-background/50 text-sm mt-6 relative z-10">
              ✓ Plan gratuit disponible · ✓ 14 jours d'essai sur les plans payants · ✓ Sans engagement
            </p>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div>
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <ThemeLogo className="w-8 h-8" />
                <span className="text-lg font-semibold text-foreground">KodaFlow</span>
              </Link>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Le CRM tout-en-un conçu pour les freelances.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-3 text-sm">Produit</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li><a href="#features" className="hover:text-foreground transition-colors">Fonctionnalités</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Tarifs</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Intégrations</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-3 text-sm">Ressources</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li><Link href="/docs" className="hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="/aide" className="hover:text-foreground transition-colors">Centre d'aide</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-3 text-sm">Légal</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li><Link href="/legal/confidentialite" className="hover:text-foreground transition-colors">Confidentialité</Link></li>
                <li><Link href="/legal/cgv" className="hover:text-foreground transition-colors">CGV / CGU</Link></li>
                <li><Link href="/legal/mentions-legales" className="hover:text-foreground transition-colors">Mentions légales</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-xs">
              © {new Date().getFullYear()} KodaFlow. Tous droits réservés.
            </p>
            <div className="flex items-center gap-4 text-muted-foreground text-xs">
              <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
              <a href="#" className="hover:text-foreground transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
