import { NavLink } from "react-router-dom";
import { LogIn, UserCircle } from "lucide-react";

import { CATEGORY_ACCENT } from "@/lib/categories";
import { navByGroup } from "@/lib/nav";
import { useAuth } from "@/lib/auth/AuthProvider";
import { cn } from "@/lib/utils";

/**
 * Grouped primary navigation. Each item shows its lucide icon; category items carry their accent as
 * a small leading swatch so the six areas stay visually distinct. The active route is marked with
 * `aria-current` and a filled style.
 */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const groups = navByGroup();
  const { user, configured } = useAuth();
  return (
    <nav aria-label="Primary" className="flex h-full flex-col">
      <div className="bg-dossier-grid border-b px-4 py-4">
        <NavLink to="/" onClick={onNavigate} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
          <p className="eyebrow">German Master&apos;s copilot</p>
          <p className="mt-0.5 text-lg font-bold tracking-tight">
            Deutsch<span className="text-primary">Prep</span>
          </p>
        </NavLink>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        {groups.map((group) => (
          <div key={group.key} className="mb-4">
            <p className="eyebrow px-2 pb-1.5">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const accent = item.category ? CATEGORY_ACCENT[item.category] : null;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === "/"}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          "group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isActive
                            ? "bg-primary/10 font-medium text-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {accent && <span aria-hidden className={cn("h-2 w-2 shrink-0 rounded-[2px]", accent.bar)} />}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t px-2 py-3">
        {configured ? (
          user ? (
            <NavLink
              to="/settings"
              onClick={onNavigate}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <UserCircle className="h-4 w-4 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1 truncate" title={user.email ?? undefined}>
                {user.email ?? "Account"}
              </span>
            </NavLink>
          ) : (
            <NavLink
              to="/login"
              onClick={onNavigate}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LogIn className="h-4 w-4 shrink-0" aria-hidden />
              Sign in to sync
            </NavLink>
          )
        ) : (
          <div className="px-2">
            <p className="eyebrow">German Master&apos;s copilot</p>
            <p className="text-xs text-muted-foreground">Guest — saved on this device</p>
          </div>
        )}
      </div>
    </nav>
  );
}
