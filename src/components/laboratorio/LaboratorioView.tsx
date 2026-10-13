/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PedidoLaboratorio, EstadoOrdenLaboratorio, MetodoPago } from '../../types';
import { api } from '../../services/api';
import {
  Wrench,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Calendar,
  Check,
  X,
  CreditCard,
  User,
  Phone
} from 'lucide-react';

export const LaboratorioView: React.FC = () => {
  const [pedidos, setPedidos] = useState<PedidoLaboratorio[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(false);

  // Cobro de Saldo Modal
  const [pedidoCobro, setPedidoCobro] = useState<PedidoLaboratorio | null>(null);
  const [montoCobrar, setMontoCobrar] = useState<number>(0);
  const [metodoCobro, setMetodoCobro] = useState<MetodoPago>('yape');
  const [procesandoCobro, setProcesandoCobro] = useState<boolean>(false);

  // Ficha Detallada Modal
  const [pedidoDetalle, setPedidoDetalle] = useState<PedidoLaboratorio | null>(null);

  const cargarPedidos = async () => {
    setCargando(true);
    try {
      const data = await api.pedidos.getAll(
        filtroEstado === 'todos' ? undefined : (filtroEstado as EstadoOrdenLaboratorio)
      );
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        setPedidos(data.filter(p =>
          p.codigoOrden.toLowerCase().includes(q) ||
          p.clienteNombre.toLowerCase().includes(q) ||
          p.clienteTelefono.includes(q) ||
          p.monturaDetalle.toLowerCase().includes(q)
        ));
      } else {
        setPedidos(data);
      }
    } catch (err) {
      console.error('Error cargando órdenes de taller:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPedidos();
  }, [filtroEstado, busqueda]);

  const handleCambiarEstado = async (id: string, nuevoEstado: EstadoOrdenLaboratorio) => {
    try {
      const actualizado = await api.pedidos.actualizarEstado(id, nuevoEstado);
      setPedidos(prev => prev.map(p => p.id === id ? actualizado : p));
    } catch (err) {
      console.error('Error actualizando estado:', err);
    }
  };

  const handleAbrirCobro = (p: PedidoLaboratorio) => {
    setPedidoCobro(p);
    setMontoCobrar(p.saldoPorCobrar);
  };

  const handleProcesarCobro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pedidoCobro) return;

    setProcesandoCobro(true);
    try {
      await api.ventas.cobrarSaldo(pedidoCobro.ventaId, montoCobrar, metodoCobro);
      // Auto-update to 'entregado'
      await api.pedidos.actualizarEstado(pedidoCobro.id, 'entregado');
      setPedidoCobro(null);
      cargarPedidos();
    } catch (err) {
      console.error('Error procesando cobro de saldo:', err);
    } finally {
      setProcesandoCobro(false);
    }
  };

  const totalActivos = pedidos.filter(p => p.estado !== 'entregado').length;
  const listosEntrega = pedidos.filter(p => p.estado === 'listo_entrega').length;
  const totalSaldosPendientes = pedidos.reduce((acc, p) => acc + p.saldoPorCobrar, 0);

  const estadosInfo: Record<EstadoOrdenLaboratorio, { label: string; colorClass: string }> = {
    en_taller: { label: 'En Taller / Biselado', colorClass: 'text-amber-700 font-semibold' },
    en_control_calidad: { label: 'En Control de Calidad', colorClass: 'text-sky-700 font-semibold' },
    listo_entrega: { label: 'Listo para Entrega', colorClass: 'text-indigo-700 font-semibold' },
    entregado: { label: 'Entregado al Paciente', colorClass: 'text-emerald-700 font-semibold' }
  };

  return (
    <div className="space-y-6">
      {/* KPIs de Taller */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Lentes en Proceso de Taller</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {totalActivos} órdenes
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Biselado y montaje en laboratorio
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Listos para Entrega en Tienda</div>
          <div className="text-2xl font-bold text-sky-600 font-mono tabular-nums mt-1">
            {listosEntrega} pacientes
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Notificar vía WhatsApp / Llamada
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Saldos por Cobrar a Contraentrega</div>
          <div className="text-2xl font-bold text-amber-600 font-mono tabular-nums mt-1">
            S/ {totalSaldosPendientes.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Cobro pendiente al entregar los lentes
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código OT, paciente o montura..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="todos">Todos los Estados</option>
            <option value="en_taller">En Taller</option>
            <option value="en_control_calidad">En Control de Calidad</option>
            <option value="listo_entrega">Listo para Entrega</option>
            <option value="entregado">Entregados</option>
          </select>
        </div>
      </div>

      {/* Lista de Órdenes de Trabajo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pedidos.length === 0 ? (
          <div className="col-span-full py-12 text-center text-sm text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
            No hay órdenes de taller en esta etapa.
          </div>
        ) : (
          pedidos.map((p) => {
            const estadoMeta = estadosInfo[p.estado];
            const tieneSaldo = p.saldoPorCobrar > 0;

            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  {/* Encabezado sin pills */}
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                    <span className="font-mono font-bold text-sky-950">{p.codigoOrden}</span>
                    <span className={estadoMeta.colorClass}>{estadoMeta.label}</span>
                  </div>

                  {/* Datos del Paciente */}
                  <div className="mt-3">
                    <h4 className="font-bold text-slate-900 text-sm leading-tight">
                      {p.clienteNombre}
                    </h4>
                    <div className="text-xs text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{p.clienteTelefono}</span>
                    </div>
                  </div>

                  {/* Especificaciones de Taller */}
                  <div className="mt-3 space-y-1.5 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-semibold">Montura</span>
                      <span className="font-medium text-slate-800">{p.monturaDetalle}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-semibold">Lunas & Filtros</span>
                      <span className="font-medium text-slate-800">{p.lunasDetalle}</span>
                    </div>

                    {/* Graduación rápida */}
                    {p.receta && (
                      <div className="pt-1.5 border-t border-slate-200 font-mono text-[10px]">
                        <div className="flex justify-between text-slate-500">
                          <span>OD: {p.receta.od.esfera || '0.00'} / {p.receta.od.cilindro || '0.00'} · {p.receta.od.eje}°</span>
                          <span>DNP: {p.receta.od.dnp}mm</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>OI: {p.receta.oi.esfera || '0.00'} / {p.receta.oi.cilindro || '0.00'} · {p.receta.oi.eje}°</span>
                          <span>DNP: {p.receta.oi.dnp}mm</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fechas */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Ingreso: {p.fechaIngreso}</span>
                    <span className="text-sky-900 font-semibold">Prometido: {p.fechaPrometida}</span>
                  </div>
                </div>

                {/* Footer de Financiamiento y Acciones */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Total: S/ {p.montoVentaTotal.toFixed(2)}</span>
                    {tieneSaldo ? (
                      <span className="text-amber-700 font-bold tabular-nums">
                        Saldo: S/ {p.saldoPorCobrar.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-semibold">Cancelado</span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    {/* Botón de cambio de fase */}
                    {p.estado === 'en_taller' && (
                      <button
                        onClick={() => handleCambiarEstado(p.id, 'en_control_calidad')}
                        className="flex-1 py-1.5 px-2 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-medium rounded-lg transition-colors text-center"
                      >
                        Pasar a Calidad →
                      </button>
                    )}
                    {p.estado === 'en_control_calidad' && (
                      <button
                        onClick={() => handleCambiarEstado(p.id, 'listo_entrega')}
                        className="flex-1 py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-medium rounded-lg transition-colors text-center"
                      >
                        Marcar Listo para Entrega →
                      </button>
                    )}
                    {p.estado === 'listo_entrega' && (
                      <button
                        onClick={() => handleAbrirCobro(p)}
                        className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors text-center shadow-xs"
                      >
                        {tieneSaldo ? `Cobrar S/ ${p.saldoPorCobrar.toFixed(2)} y Entregar` : 'Entregar al Paciente'}
                      </button>
                    )}
                    {p.estado === 'entregado' && (
                      <div className="flex-1 py-1 text-center text-xs text-emerald-700 font-semibold flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Entregado</span>
                      </div>
                    )}

                    <button
                      onClick={() => setPedidoDetalle(p)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Ver Ficha Técnica"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Cobro de Saldo a Contraentrega */}
      {pedidoCobro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                Cobro de Saldo al Recoger Lentes
              </h3>
              <button onClick={() => setPedidoCobro(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <div>Paciente: <strong className="text-slate-900">{pedidoCobro.clienteNombre}</strong></div>
              <div>Orden: <span className="font-mono">{pedidoCobro.codigoOrden}</span></div>
              <div className="text-amber-800 font-semibold font-mono">
                Saldo pendiente: S/ {pedidoCobro.saldoPorCobrar.toFixed(2)}
              </div>
            </div>

            <form onSubmit={handleProcesarCobro} className="space-y-3 pt-2">
              <div>
                <label className="text-xs text-slate-600 block mb-1">Monto a Cobrar (S/.)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={montoCobrar}
                  onChange={(e) => setMontoCobrar(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 text-sm border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">Medio de Pago</label>
                <select
                  value={metodoCobro}
                  onChange={(e) => setMetodoCobro(e.target.value as MetodoPago)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-slate-50"
                >
                  <option value="yape">Yape</option>
                  <option value="plin">Plin</option>
                  <option value="tarjeta">Tarjeta (Niubiz/Izipay)</option>
                  <option value="efectivo">Efectivo en Soles</option>
                  <option value="transferencia">Transferencia BCP/BBVA</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPedidoCobro(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesandoCobro}
                  className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                >
                  {procesandoCobro ? 'Registrando...' : 'Confirmar Cobro y Entregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ficha Técnica de Taller */}
      {pedidoDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                Ficha Técnica de Taller Óptico
              </h3>
              <button onClick={() => setPedidoDetalle(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between font-mono">
                  <span className="font-bold text-slate-900">{pedidoDetalle.codigoOrden}</span>
                  <span className="text-slate-500">{pedidoDetalle.fechaIngreso}</span>
                </div>
                <div className="font-semibold text-slate-900">{pedidoDetalle.clienteNombre}</div>
                <div className="text-slate-500">Laboratorio: {pedidoDetalle.laboratorioNombre}</div>
              </div>

              {pedidoDetalle.receta && (
                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                  <div className="font-bold text-slate-800 text-[11px] uppercase">
                    Parámetros de Refracción
                  </div>
                  <div className="font-mono text-[10px] space-y-1">
                    <div className="flex justify-between border-b pb-0.5 text-slate-500">
                      <span>OJO</span>
                      <span>ESF</span>
                      <span>CIL</span>
                      <span>EJE</span>
                      <span>ADD</span>
                      <span>DNP</span>
                      <span>ALT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">OD</span>
                      <span>{pedidoDetalle.receta.od.esfera || '0.00'}</span>
                      <span>{pedidoDetalle.receta.od.cilindro || '0.00'}</span>
                      <span>{pedidoDetalle.receta.od.eje}°</span>
                      <span>{pedidoDetalle.receta.od.adicion || '-'}</span>
                      <span>{pedidoDetalle.receta.od.dnp}mm</span>
                      <span>{pedidoDetalle.receta.od.altura}mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">OI</span>
                      <span>{pedidoDetalle.receta.oi.esfera || '0.00'}</span>
                      <span>{pedidoDetalle.receta.oi.cilindro || '0.00'}</span>
                      <span>{pedidoDetalle.receta.oi.eje}°</span>
                      <span>{pedidoDetalle.receta.oi.adicion || '-'}</span>
                      <span>{pedidoDetalle.receta.oi.dnp}mm</span>
                      <span>{pedidoDetalle.receta.oi.altura}mm</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1 text-slate-700">
                <div><strong>Montura:</strong> {pedidoDetalle.monturaDetalle}</div>
                <div><strong>Lunas:</strong> {pedidoDetalle.lunasDetalle}</div>
                <div><strong>Indicaciones de Taller:</strong> {pedidoDetalle.notas || 'Ninguna'}</div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                onClick={() => setPedidoDetalle(null)}
                className="px-4 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
