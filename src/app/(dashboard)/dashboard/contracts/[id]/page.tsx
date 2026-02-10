import { getContract, replaceTemplateVariables } from '@/lib/actions/contracts'
import { notFound } from 'next/navigation'
import ContractDetailClient from './contract-detail-client'

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
 const { id } = await params
 const { contract } = await getContract(id)

 if (!contract) {
  notFound()
 }

 const contentWithVariables = await replaceTemplateVariables(contract.content, contract.id)

 return (
  <ContractDetailClient
   contract={contract}
   initialContent={contentWithVariables}
  />
 )
}
