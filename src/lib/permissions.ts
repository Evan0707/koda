// ============================================
// ROLE-BASED PERMISSIONS
// ============================================

export type Role = 'owner' | 'admin' | 'member'

export type Permission =
 | 'manage_company'      // Modifier infos entreprise
 | 'manage_billing'      // Modifier préférences facturation
 | 'manage_stripe'       // Configurer clés Stripe / Connect
 | 'manage_subscription' // Souscrire, annuler, reprendre abonnement
 | 'delete_account'      // Supprimer le compte
 | 'mark_invoice_paid'   // Marquer une facture comme payée
 | 'manage_quotes'       // Créer, modifier, supprimer des devis
 | 'manage_invoices'     // Créer, modifier des factures
 | 'manage_contacts'     // Créer, modifier, supprimer des contacts/entreprises
 | 'manage_products'     // Créer, modifier, supprimer des produits
 | 'manage_contracts'    // Créer, modifier, supprimer des contrats
 | 'manage_pipeline'     // Gérer les étapes du pipeline (admin/owner)
 | 'manage_projects'     // Gérer projets, tâches, tags

/**
 * Matrice des permissions par rôle.
 * Owner > Admin > Member
 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
 owner: [
  'manage_company',
  'manage_billing',
  'manage_stripe',
  'manage_subscription',
  'delete_account',
  'mark_invoice_paid',
  'manage_quotes',
  'manage_invoices',
  'manage_contacts',
  'manage_products',
  'manage_contracts',
  'manage_pipeline',
  'manage_projects',
 ],
 admin: [
  'manage_company',
  'manage_billing',
  'mark_invoice_paid',
  'manage_quotes',
  'manage_invoices',
  'manage_contacts',
  'manage_products',
  'manage_contracts',
  'manage_pipeline',
  'manage_projects',
 ],
 member: [
  'manage_quotes',
  'manage_invoices',
  'manage_contacts',
  'manage_products',
  'manage_contracts',
  'manage_projects',
 ],
}

/**
 * Vérifie si un rôle possède une permission donnée.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
 return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

/**
 * Retourne toutes les permissions d'un rôle.
 */
export function getPermissions(role: Role): Permission[] {
 return ROLE_PERMISSIONS[role] ?? []
}
