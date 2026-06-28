"use client";
import { useSession } from "next-auth/react";
import { Building2, Menu } from "lucide-react";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center gap-3 px-4 shrink-0">
      {/* Hamburger — solo mobile */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
      >
        <Menu size={18} />
      </button>

      {/* Marca izquierda */}
      <span className="text-lg font-bold text-[#1B3078] tracking-tight">
        Acopio<span className="text-[#00A8E8]"> Venezuela</span>
      </span>

      <div className="flex-1" />

      {/* Usuario derecha */}
      <div className="flex items-center gap-2 sm:gap-3">
        {session?.user?.centrNombre && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1">
            <Building2 size={12} className="text-[#1B3078]" />
            <span className="truncate max-w-[120px]">{session.user.centrNombre}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#1B3078] flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">
              {session?.user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-gray-800 leading-none">{session?.user?.name}</p>
            <p className="text-xs text-[#00A8E8] leading-none mt-0.5">{session?.user?.rol}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
