import { getProducts } from '@/lib/actions/products'
import ProductsClient from './products-client'
import { Product } from './product-dialog'
import { ErrorState } from '@/components/error-state'

export default async function ProductsPage() {
 const { products, error } = await getProducts()

 if (error) {
  return <ErrorState message={error} />
 }

 return <ProductsClient initialProducts={products as Product[]} />
}
