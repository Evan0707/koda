'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, ArrowRight, AlertTriangle, CheckCircle2, Info, AlertCircle, Lock } from 'lucide-react'
import Link from 'next/link'
import { getCopilotInsights, type CopilotInsight } from '@/lib/actions/copilot'

const severityStyles = {
 critical: {
  bg: 'bg-red-500/10 border-red-500/20',
  icon: AlertCircle,
  iconColor: 'text-red-500',
 },
 warning: {
  bg: 'bg-amber-500/10 border-amber-500/20',
  icon: AlertTriangle,
  iconColor: 'text-amber-500',
 },
 success: {
  bg: 'bg-emerald-500/10 border-emerald-500/20',
  icon: CheckCircle2,
  iconColor: 'text-emerald-500',
 },
 info: {
  bg: 'bg-blue-500/10 border-blue-500/20',
  icon: Info,
  iconColor: 'text-blue-500',
 },
}

export function CopilotWidget() {
 const [insights, setInsights] = useState<CopilotInsight[] | null>(null)
 const [loading, setLoading] = useState(false)
 const [error, setError] = useState<string | null>(null)
 const [upgradeRequired, setUpgradeRequired] = useState(false)

 const analyze = async () => {
  setLoading(true)
  setError(null)
  setUpgradeRequired(false)

  try {
   const result = await getCopilotInsights()

   if (result.upgradeRequired) {
    setUpgradeRequired(true)
    setError(result.error || null)
    return
   }

   if (result.error) {
    setError(result.error)
    return
   }

   setInsights(result.insights || [])
  } catch {
   setError('Erreur inattendue')
  } finally {
   setLoading(false)
  }
 }

 return (
  <Card className="overflow-hidden">
   <CardHeader className="pb-3">
    <div className="flex items-center justify-between">
     <CardTitle className="text-sm font-medium flex items-center gap-2">
      <Sparkles className="w-4 h-4 text-violet-500" />
      Co-pilote IA
     </CardTitle>
     {insights && (
      <Button
       variant="ghost"
       size="sm"
       onClick={analyze}
       disabled={loading}
       className="text-xs text-muted-foreground h-7 px-2"
      >
       {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Actualiser'}
      </Button>
     )}
    </div>
   </CardHeader>
   <CardContent className="pt-0">
    {/* Initial state — no insights yet */}
    {!insights && !loading && !error && !upgradeRequired && (
     <div className="text-center py-4">
      <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto mb-3">
       <Sparkles className="w-6 h-6 text-violet-500" />
      </div>
      <p className="text-sm text-muted-foreground mb-4">
       Analysez votre activité et recevez des recommandations personnalisées
      </p>
      <Button
       onClick={analyze}
       className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
      >
       <Sparkles className="w-4 h-4 mr-2" />
       Analyser mon business
      </Button>
     </div>
    )}

    {/* Upgrade required */}
    {upgradeRequired && (
     <div className="text-center py-4">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
       <Lock className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground mb-4">
       Le co-pilote IA est disponible à partir du plan Starter
      </p>
      <Link href="/dashboard/upgrade">
       <Button variant="outline" size="sm">
        Voir les plans
        <ArrowRight className="w-3 h-3 ml-1" />
       </Button>
      </Link>
     </div>
    )}

    {/* Loading */}
    {loading && (
     <div className="space-y-3 py-2">
      {[...Array(3)].map((_, i) => (
       <div key={i} className="rounded-lg border border-border/50 p-3 animate-pulse">
        <div className="flex items-start gap-2">
         <div className="w-4 h-4 rounded bg-muted mt-0.5" />
         <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-3 bg-muted rounded w-full" />
         </div>
        </div>
       </div>
      ))}
      <p className="text-xs text-center text-muted-foreground animate-pulse">
       Analyse en cours...
      </p>
     </div>
    )}

    {/* Error */}
    {error && !upgradeRequired && (
     <div className="text-center py-4">
      <p className="text-sm text-red-500 mb-3">{error}</p>
      <Button variant="outline" size="sm" onClick={analyze}>
       Réessayer
      </Button>
     </div>
    )}

    {/* Insights */}
    {insights && !loading && (
     <div className="space-y-2">
      {insights.map((insight, i) => {
       const style = severityStyles[insight.severity] || severityStyles.info
       const Icon = style.icon

       return (
        <div
         key={i}
         className={`rounded-lg border p-3 transition-colors ${style.bg}`}
        >
         <div className="flex items-start gap-2.5">
          <span className="text-base leading-none mt-0.5">{insight.emoji}</span>
          <div className="flex-1 min-w-0">
           <p className="text-sm font-medium text-foreground leading-tight">
            {insight.title}
           </p>
           <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {insight.detail}
           </p>
           {insight.action && insight.actionHref && (
            <Link href={insight.actionHref}>
             <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs mt-1.5 -ml-2 text-primary hover:text-primary"
             >
              {insight.action}
              <ArrowRight className="w-3 h-3 ml-1" />
             </Button>
            </Link>
           )}
          </div>
          <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${style.iconColor}`} />
         </div>
        </div>
       )
      })}
     </div>
    )}
   </CardContent>
  </Card>
 )
}
