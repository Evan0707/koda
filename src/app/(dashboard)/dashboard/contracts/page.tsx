import { getContracts, getContractTemplates } from '@/lib/actions/contracts'
import { getCompanies } from '@/lib/actions/companies'
import { getContacts } from '@/lib/actions/contacts'
import ContractsClient from './contracts-client'

export default async function ContractsPage() {
 const [contractsRes, templatesRes, companiesRes, contactsRes] = await Promise.all([
  getContracts(),
  getContractTemplates(),
  getCompanies(),
  getContacts(),
 ])

 return (
  <ContractsClient
   initialContracts={'error' in contractsRes ? [] : contractsRes.contracts}
   templates={'error' in templatesRes ? [] : templatesRes.templates}
   companies={'error' in companiesRes ? [] : (companiesRes.companies || [])}
   contacts={'error' in contactsRes ? [] : (contactsRes.contacts || [])}
  />
 )
}
