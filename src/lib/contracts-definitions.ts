export type ContractFormData = {
 title: string
 content: string
 templateId?: string
 companyId?: string
 contactId?: string
 effectiveDate?: string
 expirationDate?: string
}

export const TEMPLATE_VARIABLES = [
 { key: '{{client_name}}', label: 'Nom du client' },
 { key: '{{client_company}}', label: 'Entreprise du client' },
 { key: '{{client_email}}', label: 'Email du client' },
 { key: '{{client_address}}', label: 'Adresse du client' },
 { key: '{{my_company}}', label: 'Votre entreprise' },
 { key: '{{my_name}}', label: 'Votre nom' },
 { key: '{{my_email}}', label: 'Votre email' },
 { key: '{{today}}', label: 'Date du jour' },
 { key: '{{effective_date}}', label: 'Date d\'effet' },
 { key: '{{expiration_date}}', label: 'Date d\'expiration' },
]

export function getTemplateVariables() {
 return TEMPLATE_VARIABLES
}
