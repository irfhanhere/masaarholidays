"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { signOut } from "@/app/admin/actions";

export function Sidebar({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname();
  const isActive = (href: string) => {
    const path = href.split("?")[0];
    return path === "/admin" ? pathname === "/admin" : pathname.startsWith(path);
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-admin-ink text-white">
      <div className="px-6 py-6">
        <Image src="/brand/logo-reverse.png" alt="Masaar Holidays" width={140} height={42} className="h-9 w-auto" />
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/50">
          Admin Portal
        </p>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {ADMIN_NAV.map((group) => (
          <div key={group.title || "root"}>
            {group.title && (
              <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                {group.title}
              </p>
            )}
            <ul className={group.title ? "mt-2 space-y-0.5" : "space-y-0.5"}>
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-admin-ink-active text-white"
                        : "text-white/75 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                  {item.children && isActive(item.href) && (
                    <ul className="ml-3 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className="block rounded-md px-2 py-1.5 text-xs text-white/60 hover:text-white"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-light-gold text-sm font-semibold text-masaar-black">
            {userEmail?.[0]?.toUpperCase() ?? "A"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{userEmail ?? "Admin"}</p>
            <p className="text-xs text-white/50">Administrator</p>
          </div>
        </div>
        <form action={signOut} className="mt-3">
          <button type="submit" className="text-xs font-medium text-white/60 underline hover:text-white">
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
}
