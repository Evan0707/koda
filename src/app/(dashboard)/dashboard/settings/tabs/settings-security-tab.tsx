'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Lock, Loader2, Trash2, AlertTriangle } from 'lucide-react'
import { changePassword, deleteAccount } from '@/lib/actions/settings'
import { useRouter } from 'next/navigation'

export default function SettingsSecurityTab({ userRole }: { userRole: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  })

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (passwordData.new !== passwordData.confirm) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    if (passwordData.new.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    if (!/[A-Z]/.test(passwordData.new)) {
      toast.error('Le mot de passe doit contenir au moins une majuscule')
      return
    }
    if (!/[a-z]/.test(passwordData.new)) {
      toast.error('Le mot de passe doit contenir au moins une minuscule')
      return
    }
    if (!/[0-9]/.test(passwordData.new)) {
      toast.error('Le mot de passe doit contenir au moins un chiffre')
      return
    }

    startTransition(async () => {
      const result = await changePassword(passwordData.current, passwordData.new)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Mot de passe modifié')
        setPasswordData({ current: '', new: '', confirm: '' })
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Changer le mot de passe
          </CardTitle>
          <CardDescription>
            Mettez à jour votre mot de passe régulièrement pour plus de sécurité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mot de passe actuel</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.current}
                onChange={(e) => setPasswordData((p) => ({ ...p, current: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.new}
                onChange={(e) => setPasswordData((p) => ({ ...p, new: e.target.value }))}
                required
              />
              <p className="text-xs text-muted-foreground">8 caractères min., 1 majuscule, 1 minuscule, 1 chiffre</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirm}
                onChange={(e) => setPasswordData((p) => ({ ...p, confirm: e.target.value }))}
                required
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                Modifier le mot de passe
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone - Owner Only */}
      {userRole === 'owner' && (
        <Card className="border-red-200 dark:border-red-900/50">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Zone de danger</CardTitle>
            <CardDescription>
              Actions irréversibles sur votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20">
              <div>
                <p className="font-medium text-foreground">Supprimer mon compte</p>
                <p className="text-sm text-muted-foreground">
                  Toutes vos données seront définitivement supprimées
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer le compte
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      Supprimer votre compte ?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est <strong>irréversible</strong>. Toutes vos données seront définitivement supprimées.
                    </AlertDialogDescription>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
                      <li>Contacts et entreprises</li>
                      <li>Devis et factures</li>
                      <li>Projets et tâches</li>
                      <li>Contrats et modèles</li>
                      <li>Pipeline et opportunités</li>
                    </ul>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={isDeleting}
                      onClick={async () => {
                        setIsDeleting(true)
                        const result = await deleteAccount()
                        if (result.error) {
                          toast.error(result.error)
                          setIsDeleting(false)
                        } else {
                          toast.success('Compte supprimé avec succès')
                          router.push('/')
                        }
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                      Supprimer définitivement
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
