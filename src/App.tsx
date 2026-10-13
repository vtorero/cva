/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header, NavTab } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PosView } from './components/pos/PosView';
import { InventarioView } from './components/inventario/InventarioView';
import { LaboratorioView } from './components/laboratorio/LaboratorioView';
import { SunatView } from './components/sunat/SunatView';
import { ClientesView } from './components/clientes/ClientesView';
import { ComprasView } from './components/compras/ComprasView';
import { ReportesView } from './components/reportes/ReportesView';
import { Slim4View } from './components/slim4/Slim4View';
import { TicketPrintModal } from './components/ticket/TicketPrintModal';
import { api } from './services/api';
import { ComprobanteSunat, Venta, RecetaOftalmica } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('pos');
  const [stockAlertCount, setStockAlertCount] = useState<number>(0);
  const [pedidosTallerCount, setPedidosTallerCount] = useState<number>(0);

  // Printable Ticket Modal State
  const [ticketModalOpen, setTicketModalOpen] = useState<boolean>(false);
  const [comprobanteParaTicket, setComprobanteParaTicket] = useState<ComprobanteSunat | undefined>();
  const [ventaParaTicket, setVentaParaTicket] = useState<Venta | undefined>();
  const [recetaParaTicket, setRecetaParaTicket] = useState<RecetaOftalmica | undefined>();

  // Fetch badges counts
  const actualizarContadores = async () => {
    try {
      const [prods, pedidos] = await Promise.all([
        api.productos.getAll(),
        api.pedidos.getAll('en_taller')
      ]);
      const alertas = prods.filter(p => p.stock <= p.stockMinimo && p.categoria !== 'servicio').length;
      setStockAlertCount(alertas);
      setPedidosTallerCount(pedidos.length);
    } catch (err) {
      console.warn('Error actualizando contadores:', err);
    }
  };

  useEffect(() => {
    actualizarContadores();
  }, [activeTab]);

  // Handle completion of a sale from POS
  const handleSaleCompleted = async (ventaId: string) => {
    try {
      const venta = await api.ventas.getById(ventaId);
      if (venta) {
        setVentaParaTicket(venta);
        setComprobanteParaTicket(venta.comprobanteSunat);
        // If lab order exists, find prescription
        if (venta.pedidoLaboratorioId) {
          const pedido = await api.pedidos.getAll();
          const p = pedido.find(it => it.id === venta.pedidoLaboratorioId);
          if (p) {
            setRecetaParaTicket(p.receta);
          }
        }
        setTicketModalOpen(true);
      }
      actualizarContadores();
    } catch (err) {
      console.error('Error al abrir ticket de venta:', err);
    }
  };

  // Open ticket from SUNAT list
  const handleVerTicketSunat = async (comp: ComprobanteSunat) => {
    try {
      const venta = await api.ventas.getById(comp.ventaId);
      setComprobanteParaTicket(comp);
      setVentaParaTicket(venta || undefined);
      if (venta?.pedidoLaboratorioId) {
        const pedidos = await api.pedidos.getAll();
        const p = pedidos.find(it => it.id === venta.pedidoLaboratorioId);
        if (p) setRecetaParaTicket(p.receta);
      } else {
        setRecetaParaTicket(undefined);
      }
      setTicketModalOpen(true);
    } catch (err) {
      console.error('Error al abrir ticket SUNAT:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-20 lg:pb-8 selection:bg-sky-100 selection:text-sky-900">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenNewSale={() => setActiveTab('pos')}
        stockAlertCount={stockAlertCount}
        pedidosTallerCount={pedidosTallerCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'pos' && (
          <PosView onSaleCompleted={handleSaleCompleted} />
        )}

        {activeTab === 'inventario' && (
          <InventarioView />
        )}

        {activeTab === 'laboratorio' && (
          <LaboratorioView />
        )}

        {activeTab === 'sunat' && (
          <SunatView onVerTicket={handleVerTicketSunat} />
        )}

        {activeTab === 'clientes' && (
          <ClientesView />
        )}

        {activeTab === 'compras' && (
          <ComprasView />
        )}

        {activeTab === 'reportes' && (
          <ReportesView />
        )}

        {activeTab === 'slim4' && (
          <Slim4View />
        )}
      </main>

      {/* Mobile Bottom Thumb Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pedidosTallerCount={pedidosTallerCount}
      />

      {/* Printable Ticket & Optical Receipt Modal */}
      <TicketPrintModal
        isOpen={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        comprobante={comprobanteParaTicket}
        venta={ventaParaTicket}
        receta={recetaParaTicket}
      />
    </div>
  );
}
