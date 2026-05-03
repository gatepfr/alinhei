'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogoutButton } from '@/components/logout-button'
import { cn } from '@/lib/utils'
import { LayoutDashboard, FileText, PlusCircle, Settings, ShieldCheck } from 'lucide-react'

interface MainNavProps {
  isAdmin?: boolean
}

export function MainNav({ isAdmin }: MainNavProps) {
  const pathname = usePathname()

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/analise', label: 'Nova Análise', icon: PlusCircle },
  ]

  if (isAdmin) {
    links.push({ href: '/admin', label: 'Painel Admin', icon: ShieldCheck })
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="font-display text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Alinhei
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="sm:hidden flex items-center gap-2">
            {links.map((link) => {
               const Icon = link.icon
               const isActive = pathname === link.href
               return (
                 <Link
                   key={link.href}
                   href={link.href}
                   title={link.label}
                   className={cn(
                     "p-2 rounded-lg transition-all duration-200",
                     isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"
                   )}
                 >
                   <Icon className="w-5 h-5" />
                 </Link>
               )
            })}
          </div>
          <div className="w-px h-4 bg-border hidden sm:block" />
          <LogoutButton className="text-sm font-medium text-muted-foreground hover:text-red-500 transition-colors" />
        </div>
      </div>
    </nav>
  )
}
