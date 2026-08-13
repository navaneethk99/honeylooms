'use client'

import type { Header } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useAuth } from '@/providers/Auth'
import { MenuIcon } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

interface Props {
  menu: Header['navItems']
}

export function MobileMenu({ menu }: Props) {
  const { user } = useAuth()

  const [isOpen, setIsOpen] = useState(false)

  const closeMobileMenu = () => setIsOpen(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger aria-label="Open navigation menu" className="header-menu-trigger">
        <MenuIcon className="h-4" />
      </SheetTrigger>

      <SheetContent side="left" className="mobile-menu-panel px-6">
        <SheetHeader className="border-b border-[#24231f]/20 px-0 pb-6 pt-8">
          <SheetTitle className="font-dream-orphanage text-4xl font-normal tracking-[-0.04em] text-[#24231f]">
            Menu
          </SheetTitle>

          <SheetDescription />
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="overflow-y-auto py-5">
            {menu?.length ? (
              <ul className="flex w-full flex-col gap-2" onClick={closeMobileMenu}>
                {menu.map((item) => (
                  <li key={item.id}>
                    <CMSLink
                      {...item.link}
                      appearance="inline"
                      className="block w-full rounded-sm border border-[#24231f]/10 bg-[#24231f]/[0.025] px-4 py-3.5 font-dream-orphanage text-[1.35rem] tracking-[0.01em] text-[#24231f]/90 transition-colors hover:border-[#24231f]/20 hover:bg-[#24231f]/5 hover:text-[#24231f] focus-visible:border-[#24231f]/25 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#24231f]/30 focus-visible:ring-offset-2 active:bg-[#24231f]/8"
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {user ? (
            <div className="mt-auto pb-2 pt-6">
              <h2 className="mb-4 text-[10px] uppercase tracking-[0.2em] text-[#6d685f]">
                My account
              </h2>
              <ul className="flex flex-col gap-2" onClick={closeMobileMenu}>
                <li>
                  <Link href="/orders">Orders</Link>
                </li>
                <li>
                  <Link href="/account/addresses">Addresses</Link>
                </li>
                <li>
                  <Link href="/account">Manage account</Link>
                </li>
                <li className="mt-6">
                  <Button asChild variant="outline">
                    <Link href="/logout">Log out</Link>
                  </Button>
                </li>
              </ul>
            </div>
          ) : (
            <div className="mt-auto pb-6 pt-6">
              <h2 className="mb-4 text-[10px] uppercase tracking-[0.2em] text-[#6d685f]">
                My account
              </h2>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button asChild className="w-full sm:flex-1" variant="outline">
                  <Link href="/login" onClick={closeMobileMenu}>
                    Log in
                  </Link>
                </Button>
                <span className="text-center text-sm text-muted-foreground sm:text-base">or</span>
                <Button asChild className="w-full sm:flex-1">
                  <Link href="/create-account" onClick={closeMobileMenu}>
                    Create an account
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
