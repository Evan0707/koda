import { db, schema } from '@/db'
import { eq } from 'drizzle-orm'

// Script pour vérifier l'état de l'organisation
async function checkOrgStatus() {
 // Remplacez par votre email ou ID d'organisation
 const orgs = await db.query.organizations.findMany({
  limit: 5,
 })

 console.log('=== ORGANISATIONS ===')
 orgs.forEach(org => {
  console.log({
   name: org.name,
   plan: org.plan,
   planStatus: org.planStatus,
   commissionRate: org.commissionRate,
   stripeSubscriptionId: org.stripeSubscriptionId,
   stripeCustomerId: org.stripeCustomerId,
  })
 })

 // Vérifier les abonnements
 const subscriptions = await db.query.subscriptions.findMany({
  limit: 10,
 })

 console.log('\n=== ABONNEMENTS ===')
 subscriptions.forEach(sub => {
  console.log({
   plan: sub.plan,
   status: sub.status,
   stripeSubscriptionId: sub.stripeSubscriptionId,
   createdAt: sub.createdAt,
  })
 })
}

checkOrgStatus()
 .then(() => {
  console.log('\n✅ Vérification terminée')
  process.exit(0)
 })
 .catch((error) => {
  console.error('❌ Erreur:', error)
  process.exit(1)
 })
