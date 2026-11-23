"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  BookHeart,
  Wallet,
  ChevronDown,
  Check,
  Plus,
  LogOut,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useFamily } from "@/components/dashboard/FamilyProvider";
import { BrandMark } from "@/components/ui/BrandMark";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { Avatar } from "@/components/ui/Avatar";
import { DEFAULT_BANNER_URL } from "@/lib/constants";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const {
    profile,
    families,
    activeFamily,
    setActiveFamilyId,
    members,
    signOut,
  } = useFamily();

  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        switcherRef.current &&
        !switcherRef.current.contains(event.target as Node)
      ) {
        setSwitcherOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    {
      href: "/dashboard",
      label: t.nav.overview,
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard",
    },
    {
      href: "/dashboard/family",
      label: t.nav.family,
      icon: Users,
      isActive: pathname.startsWith("/dashboard/family"),
    },
    {
      href: "/dashboard/calendar",
      label: t.nav.calendar,
      icon: CalendarDays,
      isActive: pathname.startsWith("/dashboard/calendar"),
    },
    {
      href: "/dashboard/memories",
      label: t.nav.memories,
      icon: BookHeart,
      isActive: pathname.startsWith("/dashboard/memories"),
    },
    {
      href: "/dashboard/budget",
      label: t.nav.budget,
      icon: Wallet,
      isActive: pathname.startsWith("/dashboard/budget"),
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#FAF8F5] text-[#1C1917]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:w-64 md:flex-col md:border-r md:border-[#E7E1D8] md:bg-white">
        <div className="flex h-16 items-center border-b border-[#EFEAE2] px-5">
          <Link href="/dashboard" className="focus:outline-none">
            <BrandMark label={t.appName} />
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  item.isActive
                    ? "bg-[#E9F2EE] font-semibold text-[#234738]"
                    : "text-[#57534E] hover:bg-[#F5F2EC] hover:text-[#1C1917]"
                }`}
              >
                <Icon
                  className={`h-4.5 w-4.5 shrink-0 ${
                    item.isActive ? "text-[#2D5A47]" : "text-[#78716C]"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Active Family Spotlight Mini-Card */}
        {activeFamily && (
          <div className="mx-3 mb-3 overflow-hidden rounded-2xl border border-[#E7E1D8] bg-[#FAF8F5]">
            <div className="relative h-20 w-full bg-[#EAE4DB]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeFamily.spotlight_banner_url || DEFAULT_BANNER_URL}
                alt={activeFamily.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917]/65 to-transparent" />
              <div className="absolute right-3 bottom-2 left-3 text-white">
                <p className="truncate text-xs font-bold">{activeFamily.name}</p>
                <p className="text-[11px] text-white/80">
                  {members.length}{" "}
                  {members.length === 1
                    ? t.overview.memberSingular
                    : t.overview.membersCount}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* User Footer */}
        <div className="border-t border-[#EFEAE2] p-3">
          <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
            <Avatar
              src={profile.avatar_url}
              name={profile.full_name || profile.email}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[#1C1917]">
                {profile.full_name || profile.email}
              </p>
              <p className="truncate text-[11px] text-[#78716C]">
                {profile.email}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              title={t.common.signOut}
              aria-label={t.common.signOut}
              className="rounded-lg p-1.5 text-[#78716C] transition hover:bg-[#F3EFE9] hover:text-[#1C1917] cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-h-screen flex-1 flex-col md:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-[#E7E1D8] bg-[#FAF8F5]/90 px-4 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/dashboard" className="md:hidden">
              <BrandMark showLabel={false} />
            </Link>

            {/* Family Switcher Dropdown */}
            <div ref={switcherRef} className="relative">
              <button
                type="button"
                id="family-switcher-button"
                onClick={() => setSwitcherOpen((prev) => !prev)}
                className="inline-flex max-w-[210px] items-center gap-2 rounded-xl border border-[#DFD8CE] bg-white px-3 py-1.5 text-sm font-semibold text-[#1C1917] shadow-2xs transition hover:bg-[#F5F2EC] sm:max-w-[260px] cursor-pointer"
                aria-expanded={switcherOpen}
                aria-haspopup="listbox"
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#2D5A47]" />
                <span className="truncate">
                  {activeFamily ? activeFamily.name : t.nav.noFamilySelected}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-[#78716C]" />
              </button>

              {switcherOpen && (
                <div className="animate-fade-in absolute left-0 mt-2 w-64 rounded-2xl border border-[#E7E1D8] bg-white p-1.5 shadow-xl">
                  <p className="px-2.5 py-1.5 text-[11px] font-semibold tracking-wider text-[#78716C] uppercase">
                    {t.nav.switchFamily}
                  </p>
                  {families.length > 0 ? (
                    <div className="max-h-56 space-y-0.5 overflow-y-auto">
                      {families.map((fam) => {
                        const selected = fam.id === activeFamily?.id;
                        return (
                          <button
                            key={fam.id}
                            type="button"
                            onClick={() => {
                              setActiveFamilyId(fam.id);
                              setSwitcherOpen(false);
                            }}
                            className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition cursor-pointer ${
                              selected
                                ? "bg-[#E9F2EE] font-semibold text-[#234738]"
                                : "text-[#1C1917] hover:bg-[#F5F2EC]"
                            }`}
                          >
                            <span className="truncate">{fam.name}</span>
                            {selected && (
                              <Check className="h-4 w-4 shrink-0 text-[#2D5A47]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="px-2.5 py-2 text-xs text-[#78716C]">
                      {t.nav.noFamilySelected}
                    </p>
                  )}

                  <div className="mt-1 border-t border-[#EFEAE2] pt-1">
                    <Link
                      href="/dashboard/family#create-family"
                      onClick={() => setSwitcherOpen(false)}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-medium text-[#2D5A47] transition hover:bg-[#E9F2EE]"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{t.nav.newFamily}</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <LanguageToggle compact />
            <button
              type="button"
              onClick={() => void signOut()}
              title={t.common.signOut}
              aria-label={t.common.signOut}
              className="inline-flex items-center justify-center rounded-xl border border-[#DFD8CE] bg-white p-2 text-[#57534E] transition hover:bg-[#F5F2EC] md:hidden cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Page Body */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-24 sm:px-6 md:pb-10">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E7E1D8] bg-white/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition ${
                  item.isActive ? "text-[#2D5A47] font-semibold" : "text-[#78716C]"
                }`}
              >
                <span
                  className={`flex h-7 w-11 items-center justify-center rounded-full transition ${
                    item.isActive ? "bg-[#E9F2EE]" : ""
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
