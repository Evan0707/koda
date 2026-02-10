'use client'

import { useState } from 'react'
import {
 HelpCircle,
 Book,
 MessageCircle,
 Mail,
 ChevronDown,
 ChevronRight,
 Zap,
 Users,
 FileText,
 Receipt,
 FolderKanban,
 Settings,
 ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const faqs = [
 {
  question: 'Comment créer mon premier devis ?',
  answer: 'Allez dans Devis → Nouveau devis. Sélectionnez un client, ajoutez vos produits/services, puis enregistrez. Vous pouvez ensuite l\'envoyer par email ou partager le lien de signature.',
  category: 'devis',
 },
 {
  question: 'Comment convertir un devis en facture ?',
  answer: 'Ouvrez le devis accepté, puis cliquez sur "Convertir en facture". Toutes les informations seront automatiquement transférées.',
  category: 'facturation',
 },
 {
  question: 'Comment connecter mon Gmail pour envoyer des emails ?',
  answer: 'Allez dans Paramètres → Intégrations → Gmail. Cliquez sur "Connecter Gmail" et autorisez l\'accès. Vos emails seront ensuite envoyés depuis votre adresse.',
  category: 'intégrations',
 },
 {
  question: 'Comment configurer Stripe pour les paiements ?',
  answer: 'Dans Paramètres → Paiements, connectez votre compte Stripe. Une fois configuré, vos clients pourront payer directement en ligne.',
  category: 'paiements',
 },
 {
  question: 'Comment importer mes contacts existants ?',
  answer: 'Allez dans Contacts → Importer. Téléchargez le modèle CSV, remplissez-le avec vos données, puis importez le fichier.',
  category: 'contacts',
 },
 {
  question: 'Comment suivre le temps passé sur un projet ?',
  answer: 'Dans Temps, créez une entrée en sélectionnant le projet concerné. Vous pouvez saisir manuellement ou utiliser le chronomètre intégré.',
  category: 'temps',
 },
 {
  question: 'Comment exporter mes factures pour la comptabilité ?',
  answer: 'Dans Factures, utilisez les boutons "Export CSV" ou "Export FEC" pour télécharger vos données au format souhaité.',
  category: 'exports',
 },
 {
  question: 'Comment faire signer un devis électroniquement ?',
  answer: 'Ouvrez le devis et cliquez sur "Lien Signature". Partagez ce lien avec votre client qui pourra signer directement en ligne.',
  category: 'signature',
 },
]

const quickLinks = [
 { icon: Users, label: 'Gérer les contacts', href: '/dashboard/contacts', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
 { icon: FileText, label: 'Créer un devis', href: '/dashboard/quotes/create', color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
 { icon: Receipt, label: 'Voir les factures', href: '/dashboard/invoices', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
 { icon: FolderKanban, label: 'Gérer les projets', href: '/dashboard/projects', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
 { icon: Settings, label: 'Paramètres', href: '/dashboard/settings', color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' },
]

export default function HelpClient() {
 const [searchQuery, setSearchQuery] = useState('')
 const [openFaq, setOpenFaq] = useState<number | null>(null)

 const filteredFaqs = faqs.filter(faq =>
  faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
  faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
 )

 return (
  <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
   {/* Header */}
   <div className="text-center space-y-4">
    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
     <HelpCircle className="w-8 h-8 text-primary" />
    </div>
    <h1 className="text-3xl font-bold text-foreground">Centre d'aide</h1>
    <p className="text-muted-foreground max-w-lg mx-auto">
     Trouvez rapidement des réponses à vos questions ou contactez notre support.
    </p>
   </div>

   {/* Search */}
   <div className="relative max-w-xl mx-auto">
    <Input
     placeholder="Rechercher dans l'aide..."
     value={searchQuery}
     onChange={(e) => setSearchQuery(e.target.value)}
     className="pl-4 pr-4 py-6 text-lg bg-card shadow-sm"
    />
   </div>

   {/* Quick Links */}
   <Card>
    <CardHeader>
     <CardTitle className="flex items-center gap-2">
      <Zap className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
      Accès rapide
     </CardTitle>
    </CardHeader>
    <CardContent>
     <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {quickLinks.map((link) => {
       const Icon = link.icon
       return (
        <a
         key={link.href}
         href={link.href}
         className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group"
        >
         <div className={`p-2 rounded-lg ${link.color}`}>
          <Icon className="w-5 h-5" />
         </div>
         <span className="text-sm text-muted-foreground group-hover:text-primary text-center">
          {link.label}
         </span>
        </a>
       )
      })}
     </div>
    </CardContent>
   </Card>

   {/* FAQ */}
   <Card>
    <CardHeader>
     <CardTitle className="flex items-center gap-2">
      <Book className="w-5 h-5 text-primary" />
      Questions fréquentes
     </CardTitle>
     <CardDescription>
      Réponses aux questions les plus posées
     </CardDescription>
    </CardHeader>
    <CardContent className="space-y-2">
     {filteredFaqs.length === 0 ? (
      <p className="text-center text-muted-foreground py-8">
       Aucun résultat pour "{searchQuery}"
      </p>
     ) : (
      filteredFaqs.map((faq, index) => (
       <div key={index} className="border border-border rounded-lg overflow-hidden">
        <button
         onClick={() => setOpenFaq(openFaq === index ? null : index)}
         className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
        >
         <span className="font-medium text-foreground">{faq.question}</span>
         {openFaq === index ? (
          <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
         ) : (
          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
         )}
        </button>
        {openFaq === index && (
         <div className="px-4 pb-4 text-muted-foreground animate-fade-in">
          {faq.answer}
         </div>
        )}
       </div>
      ))
     )}
    </CardContent>
   </Card>

   {/* Contact Support */}
   <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
    <CardContent className="py-8">
     <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="p-4 bg-card rounded-2xl shadow-sm">
       <MessageCircle className="w-8 h-8 text-primary" />
      </div>
      <div className="flex-1 text-center sm:text-left">
       <h3 className="text-lg font-semibold text-foreground mb-1">
        Besoin d'aide supplémentaire ?
       </h3>
       <p className="text-muted-foreground">
        Notre équipe support est disponible pour répondre à vos questions.
       </p>
      </div>
      <Button className="gap-2">
       <Mail className="w-4 h-4" />
       Contacter le support
      </Button>
     </div>
    </CardContent>
   </Card>

   {/* External Resources */}
   <div className="flex justify-center gap-4 text-sm text-muted-foreground">
    <a href="#" className="flex items-center gap-1 hover:text-primary transition-colors">
     Documentation <ExternalLink className="w-3 h-3" />
    </a>
    <span>•</span>
    <a href="#" className="flex items-center gap-1 hover:text-primary transition-colors">
     Tutoriels vidéo <ExternalLink className="w-3 h-3" />
    </a>
    <span>•</span>
    <a href="#" className="flex items-center gap-1 hover:text-primary transition-colors">
     Changelog <ExternalLink className="w-3 h-3" />
    </a>
   </div>
  </div>
 )
}
