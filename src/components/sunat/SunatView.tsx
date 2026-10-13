/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ComprobanteSunat, EstadoSunat } from '../../types';
import { api } from '../../services/api';
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Printer,
  Code2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
  X
} from 'lucide-react';

interface SunatViewProps {
  onVerTicket: (comprobante: ComprobanteSunat) => void;
}

export const SunatView: React.FC<SunatViewProps> = ({ onVerTicket }) => {
  const [comprobantes, setComprobantes] = useState<ComprobanteSunat[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(false);
  const [verificandoId, setVerificandoId] = useState<string | null>(null);

  // XML Modal
  const [xmlModalOpen, setXmlModalOpen] = useState<boolean>(false);
  const [xmlSeleccionado, setXmlSeleccionado] = useState<{ numero: string; xml: string } | null>(null);
  const [copiado, setCopiado] = useState<boolean>(false);

  const cargarComprobantes = async () => {
    setCargando(true);
    try {
      const data = await api.sunat.getComprobantes({
        estado: filtroEstado,
        tipo: filtroTipo,
        busqueda
      });
      setComprobantes(data);
    } catch (err) {
      console.error('Error cargando comprobantes SUNAT:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarComprobantes();
  }, [filtroEstado, filtroTipo, busqueda]);

  const handleVerificarSunat = async (comp: ComprobanteSunat) => {
    setVerificandoId(comp.id);
    try {
      const actualizado = await api.sunat.consultarEstado(comp.id);
      setComprobantes(prev => prev.map(c => c.id === comp.id ? actualizado : c));
    } catch (err) {
      console.error('Error al consultar SUNAT:', err);
    } finally {
      setVerificandoId(null);
    }
  };

  const handleVerXml = (comp: ComprobanteSunat) => {
    setXmlSeleccionado({
      numero: comp.numeroCompleto,
      xml: comp.xmlFirmadoUbl || '<!-- XML no disponible -->'
    });
    setXmlModalOpen(true);
  };

  const handleCopiarXml = () => {
    if (xmlSeleccionado) {
      navigator.clipboard.writeText(xmlSeleccionado.xml);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  // Metrics
  const totalEmitidos = comprobantes.length;
  const totalAceptados = comprobantes.filter(c => c.estadoSunat === 'ACEPTADO').length;
  const totalFacturado = comprobantes.reduce((acc, c) => acc + c.total, 0);

  return (
    <div className="space-y-6">
      {/* Encabezado y Resumen Tributario SUNAT */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Comprobantes Emitidos</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {totalEmitidos}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Boletas y Facturas electrónicas UBL 2.1
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Aceptación SUNAT (CDR)</div>
          <div className="text-2xl font-bold text-emerald-600 font-mono tabular-nums mt-1 flex items-center gap-2">
            <span>{totalAceptados} / {totalEmitidos}</span>
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-xs text-slate-500 mt-1">
            100% validez legal y tributaria
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Total Facturado Electrónico</div>
          <div className="text-2xl font-bold text-sky-950 font-mono tabular-nums mt-1">
            S/ {totalFacturado.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono">
            IGV (18%): S/ {(totalFacturado - totalFacturado / 1.18).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por N° comprobante (B001...), DNI, RUC o cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtro por Tipo */}
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="todos">Todos los Tipos</option>
            <option value="boleta">Boletas (B001)</option>
            <option value="factura">Facturas (F001)</option>
          </select>

          {/* Filtro por Estado */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="todos">Todos los Estados</option>
            <option value="ACEPTADO">Aceptado por SUNAT</option>
            <option value="PENDIENTE">Pendiente de Envío</option>
            <option value="RECHAZADO">Rechazado</option>
          </select>

          <button
            onClick={cargarComprobantes}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabla de Comprobantes SUNAT */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Comprobante</th>
                <th className="py-3 px-4">Emisión</th>
                <th className="py-3 px-4">Cliente / Receptor</th>
                <th className="py-3 px-4 text-right">Op. Gravada</th>
                <th className="py-3 px-4 text-right">I.G.V. (18%)</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4">Estado SUNAT</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {comprobantes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                    No se encontraron comprobantes electrónicos registrados.
                  </td>
                </tr>
              ) : (
                comprobantes.map((comp) => {
                  const esAceptado = comp.estadoSunat === 'ACEPTADO';
                  const esPendiente = comp.estadoSunat === 'PENDIENTE';

                  return (
                    <tr key={comp.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Número y Tipo */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                          <span>{comp.numeroCompleto}</span>
                        </div>
                      </td>

                      {/* Fecha y Hora */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        <div>{comp.fechaEmision}</div>
                        <div className="text-[10px] text-slate-400">{comp.horaEmision}</div>
                      </td>

                      {/* Cliente */}
                      <td className="py-3.5 px-4 font-sans max-w-xs">
                        <div className="font-semibold text-slate-900 truncate">
                          {comp.clienteNombre}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {comp.clienteTipoDoc}: {comp.clienteNumeroDoc}
                        </div>
                      </td>

                      {/* Subtotal */}
                      <td className="py-3.5 px-4 text-right text-slate-600 tabular-nums">
                        S/ {comp.subtotalGravado.toFixed(2)}
                      </td>

                      {/* IGV */}
                      <td className="py-3.5 px-4 text-right text-slate-600 tabular-nums">
                        S/ {comp.igv.toFixed(2)}
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 tabular-nums">
                        S/ {comp.total.toFixed(2)}
                      </td>

                      {/* Estado SUNAT sin pill chicle */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-sans">
                        <div className="flex items-center gap-1.5">
                          {esAceptado ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : esPendiente ? (
                            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                          <span
                            className={`font-semibold text-xs ${
                              esAceptado
                                ? 'text-emerald-700'
                                : esPendiente
                                ? 'text-amber-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {comp.estadoSunat}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 truncate max-w-[140px]" title={comp.hashCdr}>
                          Hash: {comp.hashCdr.substring(0, 10)}...
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 font-sans whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Imprimir Ticket */}
                          <button
                            onClick={() => onVerTicket(comp)}
                            className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                            title="Ver e Imprimir Ticket 80mm"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Ver XML UBL 2.1 */}
                          <button
                            onClick={() => handleVerXml(comp)}
                            className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                            title="Ver XML UBL 2.1 Firmado"
                          >
                            <Code2 className="w-4 h-4" />
                          </button>

                          {/* Consultar SUNAT */}
                          <button
                            onClick={() => handleVerificarSunat(comp)}
                            disabled={verificandoId === comp.id}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Consultar Validez con Servidor SUNAT"
                          >
                            <RefreshCw
                              className={`w-4 h-4 ${verificandoId === comp.id ? 'animate-spin' : ''}`}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Visor XML UBL 2.1 */}
      {xmlModalOpen && xmlSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-sky-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Payload XML UBL 2.1 Oficial SUNAT
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {xmlSeleccionado.numero}.xml
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopiarXml}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                >
                  {copiado ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiado ? 'Copiado' : 'Copiar XML'}</span>
                </button>
                <button
                  onClick={() => setXmlModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed">
              <pre className="whitespace-pre-wrap">{xmlSeleccionado.xml}</pre>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
              <span>Estructura compatible con Greenter PHP / OSE / SUNAT WebServices</span>
              <button
                onClick={() => setXmlModalOpen(false)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
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
