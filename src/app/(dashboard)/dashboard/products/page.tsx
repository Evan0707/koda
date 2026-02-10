import { getProducts } from '@/lib/actions/products'
import ProductsClient from './products-client'
import { Product } from './product-dialog'

export default async function ProductsPage() {
 const { products, error } = await getProducts()

 if (error) {
  return <div>Erreur: {error}</div>
 }

 return <ProductsClient initialProducts={products as Product[]} />
}
