'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Target,
  FileText,
  Receipt,
  FolderKanban,
  Clock,
  Settings,
  HelpCircle,
  FileSignature,
  Package,
  Search,
  ArrowRight,
  Command,
} from 'lucide-react'
import { Input } from '@/components/ui/input'

type SearchItem = {
  id: string
  label: string
  path?: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  keywords?: string[]
}

const searchItems: SearchItem[] = [
  // Main pages
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, keywords: ['accueil', 'home'] },

  // CRM
  { id: 'contacts', label: 'Contacts', href: '/dashboard/contacts', icon: Users, keywords: ['clients', 'personnes'] },
  { id: 'contacts-import', label: 'Importer Contacts', path: 'Contacts → Importer', href: '/dashboard/contacts/import', icon: Users, keywords: ['csv', 'import'] },
  { id: 'pipeline', label: 'Pipeline', href: '/dashboard/pipeline', icon: Target, keywords: ['ventes', 'opportunités', 'deals'] },

  // Commercial
  { id: 'quotes', label: 'Devis', href: '/dashboard/quotes', icon: FileText, keywords: ['propositions'] },
  { id: 'quotes-new', label: 'Nouveau Devis', path: 'Devis → Créer', href: '/dashboard/quotes/create', icon: FileText, keywords: ['créer devis'] },
  { id: 'invoices', label: 'Factures', href: '/dashboard/invoices', icon: Receipt, keywords: ['paiements', 'facturation'] },
  { id: 'contracts', label: 'Contrats', href: '/dashboard/contracts', icon: FileSignature, keywords: ['accords', 'documents'] },

  // Gestion
  { id: 'projects', label: 'Projets', href: '/dashboard/projects', icon: FolderKanban, keywords: ['tâches', 'kanban'] },
  { id: 'products', label: 'Produits', href: '/dashboard/products', icon: Package, keywords: ['services', 'catalogue', 'tarifs'] },
  { id: 'time', label: 'Suivi du Temps', href: '/dashboard/time', icon: Clock, keywords: ['heures', 'timesheet'] },

  // Settings
  { id: 'settings', label: 'Paramètres', href: '/dashboard/settings', icon: Settings, keywords: ['configuration', 'compte'] },
  { id: 'settings-profile', label: 'Profil', path: 'Paramètres → Profil', href: '/dashboard/settings?tab=profile', icon: Settings, keywords: ['compte', 'utilisateur', 'avatar'] },
  { id: 'settings-company', label: 'Entreprise', path: 'Paramètres → Entreprise', href: '/dashboard/settings?tab=company', icon: Settings, keywords: ['société', 'organisation', 'siret', 'adresse'] },
  { id: 'settings-billing', label: 'Abonnement', path: 'Paramètres → Abonnement', href: '/dashboard/settings?tab=billing', icon: Settings, keywords: ['facturation', 'plan'] },
  { id: 'settings-security', label: 'Sécurité', path: 'Paramètres → Sécurité', href: '/dashboard/settings?tab=security', icon: Settings, keywords: ['mot de passe', 'password'] },
  { id: 'settings-payments', label: 'Paiements', path: 'Paramètres → Paiements', href: '/dashboard/settings?tab=payments', icon: Settings, keywords: ['stripe', 'paiement en ligne'] },
  { id: 'settings-integrations', label: 'Intégrations', path: 'Paramètres → Intégrations', href: '/dashboard/settings?tab=integrations', icon: Settings, keywords: ['gmail', 'email', 'api'] },

  // Help
  { id: 'help', label: 'Aide', href: '/dashboard/help', icon: HelpCircle, keywords: ['support', 'documentation', 'faq'] },
]

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Filter items based on query
  const filteredItems = query.trim() === ''
    ? searchItems.slice(0, 6) // Show first 6 by default
    : searchItems.filter(item => {
      const searchStr = query.toLowerCase()
      return (
        item.label.toLowerCase().includes(searchStr) ||
        item.path?.toLowerCase().includes(searchStr) ||
        item.keywords?.some(k => k.toLowerCase().includes(searchStr))
      )
    })

  // Keyboard shortcut to open (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
        setTimeout(() => inputRef.current?.focus(), 0)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Handle arrow keys and enter
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, filteredItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault()
      navigateTo(filteredItems[selectedIndex].href)
    }
  }, [filteredItems, selectedIndex])

  const navigateTo = (href: string) => {
    router.push(href)
    setIsOpen(false)
    setQuery('')
  }

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  return (
    <div className="relative w-96">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Rechercher..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (!isOpen) setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-20 bg-muted border-border focus:bg-background"
        />
        {/* Keyboard shortcut badge */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
          <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-medium">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false)
              setQuery('')
            }}
          />

          {/* Results dropdown */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="p-2 border-b border-border">
              <p className="text-xs text-muted-foreground px-2">Navigation rapide</p>
            </div>
            <div className="max-h-80 overflow-y-auto py-2">
              {filteredItems.length === 0 ? (
                <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                  Aucun résultat pour "{query}"
                </div>
              ) : (
                filteredItems.map((item, index) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigateTo(item.href)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${index === selectedIndex
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted text-foreground'
                        }`}
                    >
                      <Icon className={`w-4 h-4 ${index === selectedIndex ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="flex-1 min-w-0">
                        {item.path ? (
                          <div className="flex items-center gap-1.5 text-sm">
                            <span className="text-muted-foreground">{item.path.split(' → ')[0]}</span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
                            <span className="font-medium">{item.path.split(' → ')[1]}</span>
                          </div>
                        ) : (
                          <span className="text-sm font-medium">{item.label}</span>
                        )}
                      </div>
                      {index === selectedIndex && (
                        <kbd className="px-1.5 py-0.5 bg-primary/20 text-primary rounded text-[10px]">
                          ↵
                        </kbd>
                      )}
                    </button>
                  )
                })
              )}
            </div>
            <div className="px-4 py-2 border-t border-border bg-muted/50 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-background border border-border rounded">↑</kbd>
                  <kbd className="px-1 py-0.5 bg-background border border-border rounded">↓</kbd>
                  <span>naviguer</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-background border border-border rounded">↵</kbd>
                  <span>ouvrir</span>
                </span>
              </div>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-background border border-border rounded">esc</kbd>
                <span>fermer</span>
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
