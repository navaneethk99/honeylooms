'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, X, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Price } from '@/components/Price'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getSearchableProducts, type SearchableProduct } from './actions'

export function SearchModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState<SearchableProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const pathname = usePathname()

  // Close the search sidebar when path changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Clear query when closed
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
    }
  }, [isOpen])

  // Fetch products when sidebar is opened
  useEffect(() => {
    if (isOpen && products.length === 0) {
      setIsLoading(true)
      getSearchableProducts()
        .then((data) => {
          setProducts(data)
        })
        .catch((err) => {
          console.error('Failed to fetch searchable products:', err)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [isOpen, products.length])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Word-based fuzzy match helper
  const wordFuzzyMatch = (text: string, query: string): boolean => {
    if (!query) return true
    const textWords = text
      .toLowerCase()
      .split(/[\s,.-]+/)
      .filter(Boolean)
    const queryWords = query.toLowerCase().split(/\s+/).filter(Boolean)

    if (queryWords.length === 0) return true

    // Every query word must match at least one word in the text (either as a substring or loose fuzzy)
    return queryWords.every((qWord) => {
      return textWords.some((tWord) => {
        // 1. Direct substring match
        if (tWord.includes(qWord)) return true

        // 2. Tightened fuzzy match on individual word level:
        // Must start with the same character, and length difference cannot exceed 3 characters.
        if (tWord[0] !== qWord[0]) return false
        if (tWord.length - qWord.length > 3) return false

        let queryIdx = 0
        for (let i = 0; i < tWord.length; i++) {
          if (tWord[i] === qWord[queryIdx]) {
            queryIdx++
            if (queryIdx === qWord.length) return true
          }
        }
        return false
      })
    })
  }

  // Filter products based on word fuzzy match
  const filteredProducts = products.filter((product) => {
    if (!searchQuery) return true
    return (
      wordFuzzyMatch(product.title, searchQuery) ||
      (product.slug && wordFuzzyMatch(product.slug, searchQuery)) ||
      (product.description && wordFuzzyMatch(product.description, searchQuery))
    )
  })

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger asChild>
        <Button
          variant="nav"
          size="clear"
          className="navLink relative items-end hover:cursor-pointer flex mb-[2px]"
          aria-label="Search Catalog"
        >
          <Search className="h-[18px] w-[18px] text-neutral-700 dark:text-neutral-300" />
        </Button>
      </SheetTrigger>

      <SheetContent className="flex flex-col p-6">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle className="text-2xl font-bold tracking-tight text-foreground">
            Search Catalog
          </SheetTitle>
          <SheetDescription className="text-muted-foreground text-sm">
            Search our collection of our high quality designed clothing.
          </SheetDescription>
        </SheetHeader>

        {/* Premium Search Input */}
        <div className="relative my-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="What are you looking for?"
            className="w-full pl-11 pr-11 py-3 text-base border rounded-none focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground border-border transition-all duration-200 shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-none hover:bg-[#D9A322]/15 transition-colors"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Dynamic Area */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1 -mr-3 scrollbar-thin">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
              <p className="text-sm font-medium animate-pulse">Loading catalog...</p>
            </div>
          ) : !searchQuery ? (
            /* Initial Empty State */
            <div className="flex flex-col items-center justify-center py-20 text-center px-4 text-muted-foreground">
              <div className="h-12 w-12 flex items-center justify-center text-muted-foreground mb-4">
                <Search className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-foreground">Start typing to search...</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                Search for products by title, description, or tags.
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="h-12 w-12 rounded-none bg-[#D9A322]/10 flex items-center justify-center text-muted-foreground mb-4">
                <Search className="h-6 w-6" />
              </div>
              <p className="text-base font-semibold text-foreground">No results found</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                We couldn't find any products matching &ldquo;{searchQuery}&rdquo;. Try another
                term.
              </p>
            </div>
          ) : (
            /* Results List */
            <div className="space-y-4">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Showing {filteredProducts.length}{' '}
                {filteredProducts.length === 1 ? 'product' : 'products'}
              </div>
              <ul className="flex flex-col gap-2">
                {filteredProducts.map((product) => {
                  const { price, originalPrice, hasDiscount } = product

                  return (
                    <li key={product.id}>
                      <Link
                        href={`/products/${product.slug}`}
                        className="flex gap-4 p-2.5 rounded-none border border-border bg-transparent hover:bg-[#D9A322]/10 transition-all duration-200 group"
                      >
                        {/* Image Container: 2:3 aspect ratio */}
                        <div className="relative aspect-[2/3] w-16 overflow-hidden rounded-none border border-border bg-[#D9A322]/5 shrink-0">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.imageAlt}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                              sizes="64px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                              No Image
                            </div>
                          )}
                        </div>

                        {/* Product details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                          <div className="space-y-0.5">
                            <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {product.title}
                            </h4>
                            {product.description ? (
                              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {product.description}
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground/60 italic">
                                No description available
                              </p>
                            )}
                          </div>
                          {typeof price === 'number' && (
                            <div className="flex items-baseline gap-1.5 mt-1">
                              <Price amount={price} className="text-sm font-bold text-foreground" />
                              {hasDiscount && typeof originalPrice === 'number' && (
                                <Price
                                  amount={originalPrice}
                                  className="text-xs text-muted-foreground line-through font-normal"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Quick Access links at the bottom of the sidebar */}
        <div className="pt-4 border-t border-border mt-auto shrink-0">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Quick Access</span>
          </div>
          <div className="space-y-2">
            <Link
              href="/shop"
              className="flex items-center justify-between p-3 rounded-none border border-border hover:bg-[#D9A322]/10 transition-all group"
            >
              <span className="text-sm font-medium text-foreground">Explore Entire Shop</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1" />
            </Link>
            <Link
              href="/collections"
              className="flex items-center justify-between p-3 rounded-none border border-border hover:bg-[#D9A322]/10 transition-all group"
            >
              <span className="text-sm font-medium text-foreground">View Collections</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
