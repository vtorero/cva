/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ReporteFinancieroResumen } from '../../types';
import { api } from '../../services/api';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Calendar,
  CreditCard,
  PieChart,
  ArrowUpRight,
  Printer
} from 'lucide-react';

export const ReportesView: React.FC = () => {
  const [reporte, setReporte] = useState<ReporteFinancieroResumen | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [periodo, setPeriodo] = useState<string>('mes');

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const data = await api.reportes.getResumenFinanciero();
        setReporte(data);
      } catch (err) {
        console.error('Error cargando reporte:', err);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [periodo]);

  const handleExportarCsv = () => {
    if (!reporte) return;
    const rows = [
      ['Concepto', 'Monto (S/.)'],
      ['Ingresos Totales Ventas', reporte.ingresosTotales.toFixed(2)],
      ['Egresos Compras Mercaderia', reporte.egresosTotales.toFixed(2)],
      ['Utilidad Bruta Operativa', reporte.utilidadBruta.toFixed(2)],
      ['Margen Porcentual', `${reporte.margenPorcentaje}%`],
      ['Cuentas por Cobrar Pacientes', reporte.cuentasPorCobrarClientes.toFixed(2)],
      ['Cuentas por Pagar Proveedores', reporte.cuentasPorPagarProveedores.toFixed(2)],
      ['Ticket Promedio', reporte.ticketPromedio.toFixed(2)],
      [],
      ['Categoria', 'Monto Ventas (S/.)', 'Participacion (%)'],
      ...reporte.ventasPorCategoria.map(c => [c.categoria, c.monto.toFixed(2), `${c.porcentaje}%`])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Reporte_Financiero_OptiKallpa_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (cargando || !reporte) {
    return (
      <div className="py-20 text-center text-sm text-slate-400">
        Calculando balance y analíticas financieras...
      </div>
    );
  }

  const maxMontoFlujo = Math.max(...reporte.flujoMensual.map(f => Math.max(f.ingresos, f.egresos)), 14000);

  return (
    <div className="space-y-6">
      {/* Header del Reporte */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Reporte Financiero & Flujo de Caja
          </h2>
          <p className="text-xs text-slate-500 font-mono">
            Periodo fiscal: {reporte.periodo} · Moneda oficial: Soles Peruanos (PEN)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="mes">Este Mes (Octubre)</option>
            <option value="trimestre">Tercer Trimestre</option>
            <option value="año">Año Fiscal 2026</option>
          </select>

          <button
            onClick={handleExportarCsv}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar CSV</span>
          </button>
        </div>
      </div>

      {/* Grid de 4 KPIs Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Ingresos Totales (Ventas)</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            S/ {reporte.ingresosTotales.toFixed(2)}
          </div>
          <div className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{reporte.totalVentasContador} ventas registradas</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Utilidad Bruta & Margen</div>
          <div className="text-2xl font-bold text-sky-950 font-mono tabular-nums mt-1">
            S/ {reporte.utilidadBruta.toFixed(2)}
          </div>
          <div className="text-xs text-sky-700 font-medium mt-1">
            Margen comercial: {reporte.margenPorcentaje}%
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Cuentas por Cobrar (Saldos)</div>
          <div className="text-2xl font-bold text-amber-600 font-mono tabular-nums mt-1">
            S/ {reporte.cuentasPorCobrarClientes.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Pacientes con lentes en taller
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Ticket Promedio por Venta</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            S/ {reporte.ticketPromedio.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Montura + lunas biseladas
          </div>
        </div>
      </div>

      {/* Gráfico Comparativo de Flujo Mensual (Ingresos vs Egresos) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Flujo de Caja Histórico (Ingresos vs Egresos de Compras)
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Comparativa mensual en Soles (S/.)
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-sky-900">
              <span className="w-3 h-3 rounded bg-sky-600" />
              <span>Ingresos</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-3 rounded bg-slate-300" />
              <span>Egresos</span>
            </span>
          </div>
        </div>

        {/* Bar chart representation with SVG and Tailwind */}
        <div className="pt-6 pb-2">
          <div className="grid grid-cols-5 gap-3 sm:gap-6 h-52 items-end">
            {reporte.flujoMensual.map((item, idx) => {
              const alturaIngreso = Math.round((item.ingresos / maxMontoFlujo) * 100);
              const alturaEgreso = Math.round((item.egresos / maxMontoFlujo) * 100);

              return (
                <div key={idx} className="flex flex-col items-center h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-full pb-2">
                    {/* Barra Ingresos */}
                    <div
                      style={{ height: `${alturaIngreso}%` }}
                      className="w-1/2 max-w-[32px] bg-sky-600 rounded-t transition-all group-hover:bg-sky-700 relative"
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-mono py-0.5 px-1 rounded pointer-events-none whitespace-nowrap transition-opacity">
                        S/ {item.ingresos}
                      </div>
                    </div>

                    {/* Barra Egresos */}
                    <div
                      style={{ height: `${alturaEgreso}%` }}
                      className="w-1/2 max-w-[32px] bg-slate-300 rounded-t transition-all group-hover:bg-slate-400 relative"
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-mono py-0.5 px-1 rounded pointer-events-none whitespace-nowrap transition-opacity">
                        S/ {item.egresos}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-semibold text-slate-700 pt-1 border-t border-slate-200 w-full text-center">
                    {item.mes}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid: Desglose por Categoría y Métodos de Pago */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Desglose por Categoría de Producto */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Ingresos por Línea de Producto Oftálmico
          </h3>

          <div className="space-y-3 font-mono text-xs">
            {reporte.ventasPorCategoria.map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between font-sans text-xs">
                  <span className="font-medium text-slate-800">{cat.categoria}</span>
                  <span className="font-mono text-slate-900 font-bold tabular-nums">
                    S/ {cat.monto.toFixed(2)} ({cat.porcentaje}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-sky-600 h-2 rounded-full"
                    style={{ width: `${cat.porcentaje}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desglose por Medios de Pago Peruanos */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Distribución por Método de Pago en Tienda
          </h3>

          <div className="space-y-3">
            {reporte.ventasPorMetodoPago.map((mp, idx) => {
              const pct = Math.round((mp.monto / reporte.ingresosTotales) * 100) || 0;
              const nombreMedio = 
                mp.metodo === 'yape' ? 'Billetera Digital Yape' :
                mp.metodo === 'plin' ? 'Billetera Digital Plin' :
                mp.metodo === 'tarjeta' ? 'Tarjeta POS (Niubiz/Izipay)' :
                mp.metodo === 'efectivo' ? 'Efectivo en Soles' :
                'Transferencia Bancaria';

              return (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-900 capitalize">
                      {nombreMedio}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {mp.conteo} transacciones
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="font-bold text-slate-900 tabular-nums">
                      S/ {mp.monto.toFixed(2)}
                    </div>
                    <div className="text-[11px] text-slate-500">{pct}% del total</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
