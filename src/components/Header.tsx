/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Glasses,
  Receipt,
  Users,
  Package,
  Wrench,
  BarChart3,
  Database,
  PlusCircle,
  Menu,
  X,
  Truck
} from 'lucide-react';

export type NavTab = 
  | 'pos' 
  | 'inventario' 
  | 'laboratorio' 
  | 'sunat' 
  | 'clientes' 
  | 'compras' 
  | 'reportes' 
  | 'slim4';

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenNewSale: () => void;
  stockAlertCount: number;
  pedidosTallerCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenNewSale,
  stockAlertCount,
  pedidosTallerCount
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { id: 'pos', label: 'Ventas & POS', icon: Glasses },
    { id: 'inventario', label: 'Inventario', icon: Package, count: stockAlertCount },
    { id: 'laboratorio', label: 'Laboratorio', icon: Wrench, count: pedidosTallerCount },
    { id: 'sunat', label: 'SUNAT', icon: Receipt },
    { id: 'clientes', label: 'Clientes & Recetas', icon: Users },
    { id: 'compras', label: 'Compras & Proveedores', icon: Truck },
    { id: 'reportes', label: 'Reportes', icon: BarChart3 },
    { id: 'slim4', label: 'Slim 4 & MySQL', icon: Database }
  ];

  const handleTabClick = (tabId: NavTab) => {
    onSelectTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      {/* Top Bar following Top Bar Contract:
          Zone 1: Single text element wordmark
          Zone 2: 4-5 text navigation links
          Zone 3: 1 primary action button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectTab('pos')}
              className="flex items-center gap-2 text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-sky-950 flex items-center justify-center text-white shadow-sm">
                <Glasses className="w-5 h-5 text-sky-400 group-hover:scale-105 transition-transform" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
                OptiKallpa <span className="text-sky-600 font-normal">Perú</span>
              </span>
            </button>
          </div>

          {/* Zone 2: Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            {navItems.slice(0, 5).map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    isActive
                      ? 'text-sky-600 font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.count && item.count > 0 ? (
                    <span className="text-xs font-mono tabular-nums text-slate-500">
                      ({item.count})
                    </span>
                  ) : null}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-sky-600 rounded-full" />
                  )}
                </button>
              );
            })}

            {/* Secondary dropdown/links */}
            <button
              onClick={() => handleTabClick('compras')}
              className={`py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'compras' ? 'text-sky-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Compras
            </button>
            <button
              onClick={() => handleTabClick('reportes')}
              className={`py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'reportes' ? 'text-sky-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Reportes
            </button>
            <button
              onClick={() => handleTabClick('slim4')}
              className={`py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'slim4' ? 'text-sky-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              API Slim 4
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action + Mobile Hamburger */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenNewSale}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-lg transition-colors shadow-sm whitespace-nowrap shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nueva Venta</span>
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-1 shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.count && item.count > 0 ? (
                  <span className="text-xs font-mono tabular-nums text-slate-500">
                    {item.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
