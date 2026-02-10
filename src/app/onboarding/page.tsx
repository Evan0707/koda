'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  Building2,
  User,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Code,
  Palette,
  Camera,
  PenTool,
  Megaphone,
  Wrench,
  GraduationCap,
  MoreHorizontal
} from 'lucide-react'
import { completeOnboarding } from '@/lib/actions/onboarding'
import { AuthBackground } from '@/components/auth/auth-background'

const activities = [
  { id: 'dev', label: 'Développement', icon: Code },
  { id: 'design', label: 'Design', icon: Palette },
  { id: 'photo', label: 'Photo / Vidéo', icon: Camera },
  { id: 'writing', label: 'Rédaction', icon: PenTool },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
  { id: 'consulting', label: 'Conseil', icon: Briefcase },
  { id: 'craft', label: 'Artisanat', icon: Wrench },
  { id: 'teaching', label: 'Formation', icon: GraduationCap },
  { id: 'other', label: 'Autre', icon: MoreHorizontal },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    organizationName: '',
    activity: '',
  })

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setLoading(true)

    const data = new FormData()
    data.set('firstName', formData.firstName)
    data.set('lastName', formData.lastName)
    data.set('organizationName', formData.organizationName)
    data.set('activity', formData.activity)

    const result = await completeOnboarding(data)

    if (result?.error) {
      toast.error(result.error)
      setLoading(false)
    }
    // Redirect happens in server action
  }

  const canProceed = () => {
    if (step === 1) return formData.firstName.length > 0
    if (step === 2) return formData.organizationName.length > 0
    if (step === 3) return formData.activity.length > 0
    return false
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <AuthBackground />

      <div className="w-full max-w-lg relative z-10">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 w-12 rounded-full transition-all duration-300 ${s <= step ? 'bg-primary' : 'bg-primary/20'
                }`}
            />
          ))}
        </div>

        <Card className="bg-background/60 backdrop-blur-xl border-border/50 shadow-2xl">
          <div className="overflow-hidden">
            <AnimatePresence mode="wait" custom={step}>
              <motion.div
                key={step}
                custom={step}
                initial="enter"
                animate="center"
                exit="exit"
                variants={slideVariants}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                {/* Step 1: Personal Info */}
                {step === 1 && (
                  <>
                    <CardHeader className="text-center pb-2">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-2xl">Bienvenue sur KodaFlow</CardTitle>
                      <CardDescription>
                        Commençons par faire connaissance
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Prénom <span className="text-destructive">*</span></Label>
                        <Input
                          id="firstName"
                          placeholder="Votre prénom"
                          value={formData.firstName}
                          onChange={(e) => updateField('firstName', e.target.value)}
                          className="bg-background/50 border-input focus-visible:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Nom</Label>
                        <Input
                          id="lastName"
                          placeholder="Votre nom"
                          value={formData.lastName}
                          onChange={(e) => updateField('lastName', e.target.value)}
                          className="bg-background/50 border-input focus-visible:ring-primary"
                        />
                      </div>
                    </CardContent>
                  </>
                )}

                {/* Step 2: Organization */}
                {step === 2 && (
                  <>
                    <CardHeader className="text-center pb-2">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-2xl">Votre activité</CardTitle>
                      <CardDescription>
                        Comment s&apos;appelle votre entreprise ou activité ?
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="orgName">Nom de l&apos;entreprise <span className="text-destructive">*</span></Label>
                        <Input
                          id="orgName"
                          placeholder="Mon Entreprise"
                          value={formData.organizationName}
                          onChange={(e) => updateField('organizationName', e.target.value)}
                          className="bg-background/50 border-input focus-visible:ring-primary"
                        />
                      </div>
                      <p className="text-[0.8rem] text-muted-foreground">
                        Ce sera le nom affiché sur vos devis et factures
                      </p>
                    </CardContent>
                  </>
                )}

                {/* Step 3: Activity Type */}
                {step === 3 && (
                  <>
                    <CardHeader className="text-center pb-2">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                        <Briefcase className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-2xl">Votre secteur</CardTitle>
                      <CardDescription>
                        Dans quel domaine travaillez-vous ?
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-3 gap-3">
                        {activities.map((activity) => {
                          const Icon = activity.icon
                          const isSelected = formData.activity === activity.id
                          return (
                            <button
                              key={activity.id}
                              onClick={() => updateField('activity', activity.id)}
                              className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary ${isSelected
                                  ? 'bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]'
                                  : 'bg-background/50 border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                            >
                              <Icon className="w-5 h-5" />
                              <span className="text-xs text-center font-medium">{activity.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </CardContent>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="p-6 pt-2 flex gap-3">
            {step > 1 && (
              <Button
                variant="ghost"
                onClick={() => setStep(step - 1)}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            )}

            <Button
              onClick={() => {
                if (step < 3) {
                  setStep(step + 1)
                } else {
                  handleSubmit()
                }
              }}
              disabled={!canProceed() || loading}
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : step < 3 ? (
                <>
                  Continuer
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Terminer
                  <Check className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
