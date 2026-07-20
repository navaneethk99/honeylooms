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
import { usePathname, useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

interface Props {
  menu: Header['navItems']
}

export function MobileMenu({ menu }: Props) {
  const { user } = useAuth()

  const pathname = usePathname()
  const searchParams = useSearchParams()
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

  useEffect(() => {
    setIsOpen(false)
  }, [pathname, searchParams])

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger aria-label="Open navigation menu" className="header-menu-trigger">
        <MenuIcon className="h-4" />
      </SheetTrigger>

      <SheetContent side="left" className="mobile-menu-panel px-6">
        <SheetHeader className="border-b border-[#24231f]/20 px-0 pb-6 pt-8">
          <SheetTitle className="font-editorial text-4xl font-normal tracking-[-0.04em] text-[#24231f]">
            Menu
          </SheetTitle>

          <SheetDescription />
        </SheetHeader>

        <div className="py-5">
          {menu?.length ? (
            <ul className="flex w-full flex-col">
              {menu.map((item) => (
                <li className="border-b border-[#24231f]/15" key={item.id}>
                  <div className="py-4">
                    <CMSLink
                      {...item.link}
                      appearance="inline"
                      className="font-editorial text-2xl text-[#24231f]"
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {user ? (
          <div className="mt-4 border-t border-[#24231f]/20 pt-6">
            <h2 className="mb-4 text-[10px] uppercase tracking-[0.2em] text-[#6d685f]">
              My account
            </h2>
            <ul className="flex flex-col gap-2">
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
          <div className="mt-4 border-t border-[#24231f]/20 pt-6">
            <h2 className="mb-4 text-[10px] uppercase tracking-[0.2em] text-[#6d685f]">
              My account
            </h2>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button asChild className="w-full sm:flex-1" variant="outline">
                <Link href="/login">Log in</Link>
              </Button>
              <span className="text-center text-sm text-muted-foreground sm:text-base">or</span>
              <Button asChild className="w-full sm:flex-1">
                <Link href="/create-account">Create an account</Link>
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
