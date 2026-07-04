import { AuthProvider } from '@/providers/Auth'
import { EcommerceProvider } from '@payloadcms/plugin-ecommerce/client/react'
import React from 'react'

import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'
import { SonnerProvider } from '@/providers/Sonner'
import { cashfreeAdapterClient } from '@/payments/cashfree/client'
import { codAdapterClient } from '@/payments/cod/client'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HeaderThemeProvider>
          <SonnerProvider />
          <EcommerceProvider
            enableVariants={true}
            api={{
              cartsFetchQuery: {
                depth: 2,
                populate: {
                  products: {
                    slug: true,
                    title: true,
                    gallery: true,
                    inventory: true,
                    onSale: true,
                    salePrice: true,
                    discountPercentage: true,
                  },
                  variants: {
                    title: true,
                    inventory: true,
                    priceInUSD: true,
                    options: true,
                  },
                },
              },
            }}
            paymentMethods={[cashfreeAdapterClient(), codAdapterClient()]}
          >
            {children}
          </EcommerceProvider>
        </HeaderThemeProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
