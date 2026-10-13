/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Glasses,
  Package,
  Wrench,
  Receipt,
  MoreHorizontal
} from 'lucide-react';
import { NavTab } from './Header';

interface MobileBottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pedidosTallerCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  pedidosTallerCount
}) => {
  const items = [
    { id: 'pos' as NavTab, label: 'Ventas', icon: Glasses },
    { id: 'inventario' as NavTab, label: 'Stock', icon: Package },
    { id: 'laboratorio' as NavTab, label: 'Taller', icon: Wrench, count: pedidosTallerCount },
    { id: 'sunat' as NavTab, label: 'SUNAT', icon: Receipt },
    { id: 'clientes' as NavTab, label: 'Clientes', icon: MoreHorizontal }
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 safe-area-bottom no-print">
      <div className="grid grid-cols-5 h-16">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors relative ${
                isActive
                  ? 'text-sky-600 font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-sky-600' : 'text-slate-500'}`} />
                {item.count && item.count > 0 ? (
                  <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] font-mono leading-none flex items-center justify-center font-bold">
                    {item.count}
                  </span>
                ) : null}
              </div>
              <span className="text-[11px] leading-tight truncate px-1">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-sky-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
