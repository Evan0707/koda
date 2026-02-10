'use client'

import { useEffect, useState } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { HelpCircle } from 'lucide-react'

export function ProductTour() {
 const pathname = usePathname()
 const [hasSeenTour, setHasSeenTour] = useState(true) // Default to true to avoid flash

 useEffect(() => {
  // Check local storage on mount
  const seen = localStorage.getItem('kodaflow_tour_seen')
  setHasSeenTour(!!seen)

  // Only auto-start on dashboard home
  if (!seen && pathname === '/dashboard') {
   startTour()
  }
 }, [pathname])

 const startTour = () => {
  const driverObj = driver({
   showProgress: true,
   animate: true,
   allowClose: true,
   doneBtnText: "C'est parti !",
   nextBtnText: 'Suivant',
   prevBtnText: 'Précédent',
   steps: [
    {
     element: '#sidebar-nav',
     popover: {
      title: 'Navigation Principale',
      description: 'Accédez à tous vos modules : CRM, Pipeline, Devis, Factures et Projets.',
      side: 'right',
      align: 'start',
     },
    },
    {
     element: '#command-palette-trigger',
     popover: {
      title: 'Recherche Rapide (⌘K)',
      description: 'Utilisez la Command Palette pour naviguer ou créer rapidement un élément.',
      side: 'bottom',
      align: 'start',
     },
    },
    {
     element: '#theme-toggle',
     popover: {
      title: 'Gestion du Thème',
      description: 'Passez du mode clair au mode sombre selon vos préférences.',
      side: 'bottom',
      align: 'end',
     },
    },
    {
     element: '#notifications-trigger',
     popover: {
      title: 'Notifications',
      description: 'Restez informé des signatures de devis, paiements et rappels.',
      side: 'bottom',
      align: 'end',
     },
    },
    {
     popover: {
      title: 'Bienvenue sur KodaFlow 🚀',
      description: "Vous êtes prêt à démarrer ! N'hésitez pas à explorer les différents modules.",
     },
    },
   ],
   onDestroyed: () => {
    localStorage.setItem('kodaflow_tour_seen', 'true')
    setHasSeenTour(true)
   },
  })

  driverObj.drive()
 }

 return (
  <Button
   variant="ghost"
   size="icon"
   className="fixed bottom-4 right-4 z-50 rounded-full h-10 w-10 bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 md:hidden"
   onClick={startTour}
   aria-label="Lancer la visite guidée"
  >
   <HelpCircle className="w-6 h-6" />
  </Button>
 )
}
