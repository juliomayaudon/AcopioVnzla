"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard, PackagePlus,
  Truck, LogOut, X, ShoppingBag,
  PanelLeftClose, PanelLeftOpen, Shield, Settings, Tags,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  puedeDashboard, puedeDonaciones, puedeConsumos, puedeEnvios, puedeMiCentro,
  puedePortalAdmin, esSuperAdmin,
} from "@/lib/permisos";

const navItems = [
  { href: "/dashboard",  label: "Dashboard",       icon: LayoutDashboard, can: puedeDashboard },
  { href: "/donaciones", label: "Donaciones",       icon: PackagePlus,     can: puedeDonaciones },
  { href: "/consumos",   label: "Consumo Interno",  icon: ShoppingBag,     can: puedeConsumos },
  { href: "/envios",     label: "Envios",           icon: Truck,           can: puedeEnvios },
];

const superAdminItems = [
  { href: "/admin", label: "Portal SuperAdmin", icon: Shield },
];

const adminCentroItems = [
  { href: "/mi-centro", label: "Mi Centro", icon: Settings },
];

function NavLink({
  href, label, icon: Icon, collapsed, onClick,
}: {
  href: string; label: string; icon: any; collapsed: boolean; onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-[#EEF1FB] text-[#1B3078]"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
      )}
    >
      <Icon size={18} className={cn("shrink-0", active ? "text-[#1B3078]" : "text-gray-400")} />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

function SidebarInner({
  collapsed, setCollapsed, mobile = false, onClose,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobile?: boolean;
  onClose?: () => void;
}) {
  const { data: session } = useSession();
  const rol = session?.user?.rol;
  const mostrarPortal = puedePortalAdmin(rol);
  const visibleNav = navItems.filter((item) => item.can(rol));
  const mostrarMiCentro = puedeMiCentro(rol);

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Close button mobile */}
      {mobile && (
        <div className="flex justify-end p-2">
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Nav principal */}
      <div className={cn("px-3 pt-4 pb-1", collapsed && "px-2")}>
        {!collapsed && (
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-2">
            Principal
          </p>
        )}
        <nav className="space-y-0.5">
          {visibleNav.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} collapsed={collapsed} onClick={onClose} />
          ))}
        </nav>
      </div>

      {/* Portal de administración (SuperAdmin y Admin de país) */}
      {mostrarPortal && (
        <div className={cn("px-3 pt-4 pb-1", collapsed && "px-2")}>
          {!collapsed && (
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-2">
              {esSuperAdmin(rol) ? "SuperAdmin" : "Administración"}
            </p>
          )}
          {collapsed && <div className="border-t border-gray-100 mb-2" />}
          <nav className="space-y-0.5">
            {superAdminItems.map((item) => (
              <NavLink key={item.href}
                href={item.href}
                label={esSuperAdmin(rol) ? item.label : "Portal de Administración"}
                icon={item.icon} collapsed={collapsed} onClick={onClose} />
            ))}
            {/* Catálogo — solo el superadmin */}
            {esSuperAdmin(rol) && (
              <NavLink href="/catalogo" label="Categorías y productos" icon={Tags} collapsed={collapsed} onClick={onClose} />
            )}
          </nav>
        </div>
      )}

      {/* Mi Centro — responsable y coordinador */}
      {mostrarMiCentro && (
        <div className={cn("px-3 pt-4 pb-1", collapsed && "px-2")}>
          {!collapsed && (
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-2">
              Mi Centro
            </p>
          )}
          {collapsed && <div className="border-t border-gray-100 mb-2" />}
          <nav className="space-y-0.5">
            {adminCentroItems.map((item) => (
              <NavLink key={item.href} {...item} collapsed={collapsed} onClick={onClose} />
            ))}
          </nav>
        </div>
      )}

      <div className="flex-1" />

      {/* Cerrar sesion */}
      <div className={cn("px-3 pb-1", collapsed && "px-2")}>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={collapsed ? "Cerrar sesion" : undefined}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && "Cerrar sesion"}
        </button>
      </div>

      {/* Colapsar — solo desktop */}
      {!mobile && (
        <div className="border-t border-gray-100">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "flex items-center gap-2 w-full px-4 py-3 text-xs font-medium text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors",
              collapsed && "justify-center px-0"
            )}
          >
            {collapsed
              ? <PanelLeftOpen size={16} />
              : <><PanelLeftClose size={16} /><span>Colapsar menu</span></>
            }
          </button>
        </div>
      )}
    </div>
  );
}

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop */}
      <aside className={cn(
        "hidden lg:flex flex-col h-full transition-all duration-200 shrink-0",
        collapsed ? "w-14" : "w-56"
      )}>
        <SidebarInner collapsed={collapsed} setCollapsed={setCollapsed} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-10 w-60 h-full shadow-xl">
            <SidebarInner
              collapsed={false}
              setCollapsed={() => {}}
              mobile
              onClose={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}
    </>
  );
}
