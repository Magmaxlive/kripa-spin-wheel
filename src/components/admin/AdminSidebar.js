'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Gift,
    Users,
    Trophy,
    Menu,
    X,
} from 'lucide-react'
import AdminLogoutButton from './AdminLogoutButton'

const NAV_ITEMS = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
    { href: '/admin/gifts', label: 'Gifts', icon: Gift },
    { href: '/admin/participants', label: 'Participants', icon: Users },
    { href: '/admin/spins', label: 'Spin Results', icon: Trophy },
]

function isActive(pathname, item) {
    if (item.exact) return pathname === item.href
    return pathname === item.href || pathname?.startsWith(item.href + '/')
}

function SidebarContent({ pathname, onNavigate, adminEmail }) {
    return (
        <div className="flex h-full flex-col gap-6 bg-white">
            <div className="flex items-center gap-3 border-b border-primary/10 px-6 py-5">
                <div className="relative h-10 w-10 shrink-0">
                    <Image
                        src="/images/kripalogo.svg"
                        alt="Kripa logo"
                        fill
                        className="object-contain"
                    />
                </div>
                <div className="flex flex-col leading-tight">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Admin Panel
                    </span>
                    <span className="text-sm font-semibold text-primary">
                        Spin &amp; Win
                    </span>
                </div>
            </div>

            <nav className="flex flex-1 flex-col gap-1 px-3">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon
                    const active = isActive(pathname, item)
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                active
                                    ? 'bg-primary text-white'
                                    : 'text-primary/80 hover:bg-button hover:text-primary'
                            }`}
                        >
                            <Icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            <div className="border-t border-primary/10 px-4 py-4">
                {adminEmail && (
                    <p className="mb-3 truncate px-2 text-xs text-gray-500">
                        {adminEmail}
                    </p>
                )}
                <AdminLogoutButton />
            </div>
        </div>
    )
}

function AdminSidebar({ adminEmail }) {
    const pathname = usePathname()
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <>
            <aside className="hidden h-screen w-64 shrink-0 border-r border-primary/10 bg-white tablet:sticky tablet:top-0 tablet:flex">
                <SidebarContent pathname={pathname} adminEmail={adminEmail} />
            </aside>

            <div className="flex items-center justify-between border-b border-primary/10 bg-white px-4 py-3 tablet:hidden">
                <div className="flex items-center gap-2">
                    <div className="relative h-8 w-8 shrink-0">
                        <Image
                            src="/images/kripalogo.svg"
                            alt="Kripa logo"
                            fill
                            className="object-contain"
                        />
                    </div>
                    <span className="text-sm font-semibold text-primary">
                        Admin Panel
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => setMobileOpen(true)}
                    className="rounded-md p-2 text-primary hover:bg-button"
                    aria-label="Open navigation"
                >
                    <Menu className="h-5 w-5" />
                </button>
            </div>

            {mobileOpen && (
                <div className="fixed inset-0 z-50 flex tablet:hidden">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setMobileOpen(false)}
                    />
                    <div className="relative z-10 flex h-full w-72 flex-col bg-white shadow-xl">
                        <button
                            type="button"
                            onClick={() => setMobileOpen(false)}
                            className="absolute right-3 top-3 rounded-md p-2 text-primary hover:bg-button"
                            aria-label="Close navigation"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <SidebarContent
                            pathname={pathname}
                            adminEmail={adminEmail}
                            onNavigate={() => setMobileOpen(false)}
                        />
                    </div>
                </div>
            )}
        </>
    )
}

export default AdminSidebar
