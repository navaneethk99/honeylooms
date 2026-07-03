import React, { Suspense } from 'react'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <div className="container my-16 pb-4 ">
        <div className="min-h-screen w-full">{children}</div>
      </div>
    </Suspense>
  )
}
