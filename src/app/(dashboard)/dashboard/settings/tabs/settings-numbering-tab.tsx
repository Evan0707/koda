'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Hash, Loader2, Save, Eye } from 'lucide-react'
import {
  getDocumentSequences,
  upsertDocumentSequence,
  type DocumentSequence,
  type SequenceFormData,
} from '@/lib/actions/document-sequences'

const DOC_TYPES = [
  { value: 'invoice' as const, label: 'Factures', defaultPrefix: 'FAC' },
  { value: 'quote' as const, label: 'Devis', defaultPrefix: 'DEV' },
  { value: 'contract' as const, label: 'Contrats', defaultPrefix: 'CTR' },
]

function previewDocumentNumber(
  prefix: string,
  suffix: string,
  currentNumber: number,
  paddingLength: number,
  includeYear: boolean,
): string {
  const year = new Date().getFullYear()
  const num = String(currentNumber).padStart(paddingLength, '0')
  const parts = [prefix]
  if (includeYear) parts.push(String(year))
  parts.push(num)
  let result = parts.filter(Boolean).join('-')
  if (suffix) result += suffix
  return result
}

export default function SettingsNumberingTab() {
  const [isPending, startTransition] = useTransition()
  const [sequences, setSequences] = useState<DocumentSequence[]>([])

  const loadSequences = useCallback(async () => {
    const result = await getDocumentSequences()
    if (result.sequences) setSequences(result.sequences)
  }, [])

  useEffect(() => {
    loadSequences()
  }, [loadSequences])

  const getSequenceForType = (type: string): Partial<DocumentSequence> => {
    return sequences.find((s) => s.type === type) || {}
  }

  const handleSave = async (type: 'quote' | 'invoice' | 'contract', formData: SequenceFormData) => {
    startTransition(async () => {
      const result = await upsertDocumentSequence(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Numérotation mise à jour')
        loadSequences()
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hash className="w-5 h-5" />
          Numérotation des documents
        </CardTitle>
        <CardDescription>
          Configurez les préfixes, suffixes et la numérotation automatique de vos documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {DOC_TYPES.map((docType) => {
            const seq = getSequenceForType(docType.value)
            const prefix = seq.prefix ?? docType.defaultPrefix
            const suffix = seq.suffix ?? ''
            const currentNumber = seq.currentNumber ?? 1
            const paddingLength = seq.paddingLength ?? 4
            const includeYear = seq.includeYear ?? true

            return (
              <div key={docType.value} className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{docType.label}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="w-4 h-4" />
                    <span className="font-mono bg-muted px-2 py-1 rounded">
                      {previewDocumentNumber(prefix, suffix, currentNumber, paddingLength, includeYear)}
                    </span>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const fd = new FormData(e.currentTarget)
                    handleSave(docType.value, {
                      type: docType.value,
                      prefix: fd.get('prefix') as string,
                      suffix: fd.get('suffix') as string,
                      currentNumber: Number(fd.get('currentNumber')),
                      paddingLength: Number(fd.get('paddingLength')),
                      includeYear: fd.get('includeYear') === 'on',
                    })
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`prefix-${docType.value}`}>Préfixe</Label>
                      <Input
                        id={`prefix-${docType.value}`}
                        name="prefix"
                        defaultValue={prefix}
                        placeholder={docType.defaultPrefix}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`suffix-${docType.value}`}>Suffixe</Label>
                      <Input
                        id={`suffix-${docType.value}`}
                        name="suffix"
                        defaultValue={suffix}
                        placeholder=""
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`currentNumber-${docType.value}`}>Prochain numéro</Label>
                      <Input
                        id={`currentNumber-${docType.value}`}
                        name="currentNumber"
                        type="number"
                        min="1"
                        defaultValue={currentNumber}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`paddingLength-${docType.value}`}>Longueur du numéro (zéros)</Label>
                      <Input
                        id={`paddingLength-${docType.value}`}
                        name="paddingLength"
                        type="number"
                        min="1"
                        max="8"
                        defaultValue={paddingLength}
                      />
                      <p className="text-xs text-muted-foreground">Ex: 4 → 0001, 6 → 000001</p>
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <input
                        id={`includeYear-${docType.value}`}
                        name="includeYear"
                        type="checkbox"
                        defaultChecked={includeYear}
                        className="w-4 h-4 rounded border-input"
                      />
                      <Label htmlFor={`includeYear-${docType.value}`}>Inclure l&apos;année dans le numéro</Label>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isPending} size="sm">
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                      Enregistrer
                    </Button>
                  </div>
                </form>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
