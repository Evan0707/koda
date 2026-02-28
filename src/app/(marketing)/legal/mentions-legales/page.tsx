import { Metadata } from 'next'

export const metadata: Metadata = {
 title: 'Mentions Légales | KodaFlow',
 description: 'Mentions légales de l\'application KodaFlow',
}

export default function LegalNoticesPage() {
 return (
  <div className="container py-12 md:py-24 max-w-4xl mx-auto px-4">
   <div className="space-y-8">
    <div>
     <h1 className="text-3xl font-bold tracking-tight mb-4">Mentions Légales</h1>
     <p className="text-muted-foreground text-lg">
      Dernière mise à jour : 28/02/2026
     </p>
    </div>

    <div className="prose prose-slate dark:prose-invert max-w-none">
     <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3">1. Éditeur du site</h2>
      <p>
       Le site KodaFlow est édité par :
       <br />
       <strong>KodaFlow</strong>
       <br />
       Email : contact@kodaflo.com
       <br />
       Directeur de la publication : Evan G
      </p>
     </section>

     <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3">2. Hébergement</h2>
      <p>
       Le site et les données de KodaFlow sont hébergés par :
       <br />
       <strong>Vercel</strong>
       <br />
       10 rue des Abbesses, 75018 Paris
       <br />
       https://vercel.com
      </p>
     </section>

     <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3">3. Propriété intellectuelle</h2>
      <p>
       L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
      </p>
      <p>
       La reproduction de tout ou partie de ce site sur un support électronique quel qu'il soit est formellement interdite sauf autorisation expresse du directeur de la publication.
      </p>
     </section>

     <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3">4. Données personnelles</h2>
      <p>
       Pour plus d'informations sur la collecte et le traitement de vos données personnelles, veuillez consulter notre <a href="/legal/confidentialite" className="text-primary hover:underline">Politique de confidentialité</a>.
      </p>
     </section>
    </div>
   </div>
  </div>
 )
}
