const ProductCardSkeleton = () => (
  <div className="space-y-3" aria-hidden="true">
    <div className="aspect-[2/3] animate-pulse bg-neutral-100" />
    <div className="h-3 w-2/3 animate-pulse bg-neutral-200" />
    <div className="h-3 w-1/3 animate-pulse bg-neutral-100" />
  </div>
)

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading products"
      className="grid grid-cols-2 gap-6 md:grid-cols-3"
    >
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  )
}

export function CollectionsGridSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading collections"
      className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      data-testid="collections-grid-shell"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <div className="space-y-4" key={index} aria-hidden="true">
          <div className="aspect-[2/3] animate-pulse bg-neutral-100" />
          <div className="h-4 w-2/3 animate-pulse bg-neutral-200" />
          <div className="h-3 w-1/2 animate-pulse bg-neutral-100" />
        </div>
      ))}
    </div>
  )
}

export function CollectionPageSkeleton() {
  return (
    <div aria-busy="true" data-testid="collection-page-shell">
      <div className="relative aspect-[1983/793] w-full animate-pulse bg-neutral-900">
        <div className="container absolute inset-x-0 bottom-10">
          <div className="h-3 w-28 bg-white/25" />
          <div className="mt-5 h-10 w-64 bg-white/35 md:h-14 md:w-96" />
        </div>
      </div>
      <div className="container py-16">
        <div className="mb-8 h-3 w-36 animate-pulse bg-neutral-100" />
        <ProductGridSkeleton />
      </div>
    </div>
  )
}

export function ProductPageSkeleton() {
  return (
    <div
      aria-busy="true"
      className="container max-w-7xl pt-10 pb-20"
      data-testid="product-page-shell"
    >
      <div className="mb-8 h-3 w-28 animate-pulse bg-neutral-100" />
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="aspect-[2/3] animate-pulse bg-neutral-100 lg:col-span-5" />
        <div className="space-y-7 lg:col-span-7 lg:pt-4">
          <div className="h-12 w-4/5 animate-pulse bg-neutral-100 md:h-16" />
          <div className="h-5 w-32 animate-pulse bg-neutral-100" />
          <div className="space-y-3">
            <div className="h-3 w-full animate-pulse bg-neutral-100" />
            <div className="h-3 w-5/6 animate-pulse bg-neutral-100" />
            <div className="h-3 w-2/3 animate-pulse bg-neutral-100" />
          </div>
          <div className="h-12 w-full animate-pulse bg-neutral-900" />
        </div>
      </div>
    </div>
  )
}

export function StorefrontPageSkeleton() {
  return (
    <div aria-busy="true" className="container py-16" data-testid="storefront-page-shell">
      <div className="mb-5 h-12 w-72 animate-pulse bg-neutral-100" />
      <div className="mb-14 h-4 w-full max-w-xl animate-pulse bg-neutral-100" />
      <ProductGridSkeleton />
    </div>
  )
}
