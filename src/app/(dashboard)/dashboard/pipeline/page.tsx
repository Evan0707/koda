import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PipelineClient from './pipeline-client'

export default async function PipelinePage() {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()

 if (!user) redirect('/login')

 return <PipelineClient />
}
