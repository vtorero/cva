/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Cliente, RecetaOftalmica, TipoDocumentoIdentidad } from '../../types';
import { api } from '../../services/api';
import {
  Users,
  Search,
  Plus,
  Eye,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FilePlus,
  CheckCircle2,
  X
} from 'lucide-react';

export const ClientesView: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState<string>('');
  const [clienteActivo, setClienteActivo] = useState<Cliente | null>(null);
  const [cargando, setCargando] = useState<boolean>(false);

  // Modales
  const [modalCliente, setModalCliente] = useState<boolean>(false);
  const [modalReceta, setModalReceta] = useState<boolean>(false);

  // Campos Nuevo Cliente
  const [docTipo, setDocTipo] = useState<TipoDocumentoIdentidad>('DNI');
  const [docNum, setDocNum] = useState<string>('');
  const [nombres, setNombres] = useState<string>('');
  const [apellidos, setApellidos] = useState<string>('');
  const [telefono, setTelefono] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [direccion, setDireccion] = useState<string>('');

  // Campos Nueva Receta
  const [optometrista, setOptometrista] = useState<string>('Lic. Optom. Daniel Alarcón');
  const [colegiatura, setColegiatura] = useState<string>('CTO 0842-PE');
  const [tipoLente, setTipoLente] = useState<'Monofocal Lejos' | 'Monofocal Cerca' | 'Bifocal Flat-Top' | 'Progresivo Digital' | 'Lente de Contacto'>('Monofocal Lejos');
  const [tratamiento, setTratamiento] = useState<'Antirreflejo HMC' | 'Filtro Azul UV420' | 'Fotocromático Transitions' | 'Policarbonato' | 'Resina Alto Índice 1.67'>('Filtro Azul UV420');
  const [observaciones, setObservaciones] = useState<string>('');

  // OD
  const [odEsfera, setOdEsfera] = useState<string>('-1.50');
  const [odCilindro, setOdCilindro] = useState<string>('-0.50');
  const [odEje, setOdEje] = useState<string>('180');
  const [odAdd, setOdAdd] = useState<string>('');
  const [odAv, setOdAv] = useState<string>('20/20');
  const [odDnp, setOdDnp] = useState<string>('31.5');
  const [odAltura, setOdAltura] = useState<string>('18');

  // OI
  const [oiEsfera, setOiEsfera] = useState<string>('-1.75');
  const [oiCilindro, setOiCilindro] = useState<string>('-0.50');
  const [oiEje, setOiEje] = useState<string>('175');
  const [oiAdd, setOiAdd] = useState<string>('');
  const [oiAv, setOiAv] = useState<string>('20/20');
  const [oiDnp, setOiDnp] = useState<string>('31.5');
  const [oiAltura, setOiAltura] = useState<string>('18');

  const cargarClientes = async () => {
    setCargando(true);
    try {
      const data = await api.clientes.getAll(busqueda);
      setClientes(data);
      if (!clienteActivo && data.length > 0) {
        setClienteActivo(data[0]);
      } else if (clienteActivo) {
        const updated = data.find(c => c.id === clienteActivo.id);
        if (updated) setClienteActivo(updated);
      }
    } catch (err) {
      console.error('Error cargando clientes:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, [busqueda]);

  const handleCrearCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const nuevo = await api.clientes.create({
        tipoDocumento: docTipo,
        numeroDocumento: docNum,
        nombres,
        apellidos,
        telefono,
        email,
        direccion
      });
      setModalCliente(false);
      setDocNum('');
      setNombres('');
      setApellidos('');
      setTelefono('');
      setEmail('');
      setDireccion('');
      await cargarClientes();
      setClienteActivo(nuevo);
    } catch (err) {
      console.error('Error creando cliente:', err);
    }
  };

  const handleAgregarReceta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteActivo) return;

    try {
      const nuevaReceta = await api.clientes.agregarReceta(clienteActivo.id, {
        fecha: new Date().toISOString().split('T')[0],
        optometrista,
        numeroColegiatura: colegiatura,
        tipoLente,
        tratamiento,
        observaciones,
        vigenciaMeses: 12,
        od: {
          esfera: odEsfera,
          cilindro: odCilindro,
          eje: odEje,
          adicion: odAdd,
          av: odAv,
          dnp: odDnp,
          altura: odAltura
        },
        oi: {
          esfera: oiEsfera,
          cilindro: oiCilindro,
          eje: oiEje,
          adicion: oiAdd,
          av: oiAv,
          dnp: oiDnp,
          altura: oiAltura
        }
      });

      setModalReceta(false);
      await cargarClientes();
    } catch (err) {
      console.error('Error guardando receta:', err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Columna Izquierda: Directorio de Clientes (5 Cols) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Directorio de Pacientes ({clientes.length})
            </h3>
            <button
              onClick={() => setModalCliente(true)}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por DNI, RUC, nombre o celular..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
            />
          </div>
        </div>

        {/* Lista de Pacientes */}
        <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
          {clientes.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
              No se encontraron clientes registrados.
            </div>
          ) : (
            clientes.map((c) => {
              const esActivo = clienteActivo?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setClienteActivo(c)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    esActivo
                      ? 'bg-sky-50/40 border-sky-600 shadow-xs ring-1 ring-sky-600'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-sm text-slate-900">
                        {c.nombres} {c.apellidos}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {c.tipoDocumento}: {c.numeroDocumento} {c.telefono ? `· Telf: ${c.telefono}` : ''}
                      </div>
                    </div>
                    {c.saldoPendiente > 0 && (
                      <span className="text-[11px] font-mono text-amber-700 font-bold">
                        Saldo: S/ {c.saldoPendiente.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-mono">
                      {c.recetas?.length || 0} recetas archivadas
                    </span>
                    <span className="font-mono tabular-nums">
                      Total compras: S/ {c.totalCompras.toFixed(2)}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Columna Derecha: Ficha Clínica Oftalmológica del Paciente (7 Cols) */}
      <div className="lg:col-span-7 space-y-4">
        {clienteActivo ? (
          <>
            {/* Header del Paciente */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {clienteActivo.nombres} {clienteActivo.apellidos}
                  </h2>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    {clienteActivo.tipoDocumento}: {clienteActivo.numeroDocumento} · Registrado el {clienteActivo.creadoEn}
                  </div>
                </div>

                <button
                  onClick={() => setModalReceta(true)}
                  className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <FilePlus className="w-4 h-4" />
                  <span>+ Nueva Receta Oftálmica</span>
                </button>
              </div>

              {/* Datos de Contacto */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 truncate">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{clienteActivo.telefono || 'Sin teléfono'}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{clienteActivo.email || 'Sin correo'}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{clienteActivo.direccion || 'Lima, Perú'}</span>
                </div>
              </div>
            </div>

            {/* Historial de Recetas Oftálmicas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-sky-600" />
                  <span>Historial de Graduación & Refracción Visual</span>
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  {clienteActivo.recetas?.length || 0} evaluaciones
                </span>
              </div>

              {clienteActivo.recetas && clienteActivo.recetas.length > 0 ? (
                clienteActivo.recetas.map((r, idx) => (
                  <div
                    key={r.id || idx}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <span>Evaluación del {r.fecha}</span>
                        {idx === 0 && (
                          <span className="text-sky-700 font-mono text-[10px] bg-sky-50 px-2 py-0.5 rounded">
                            Receta Vigente
                          </span>
                        )}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        {r.optometrista} {r.numeroColegiatura ? `(${r.numeroColegiatura})` : ''}
                      </div>
                    </div>

                    {/* Tabla de Graduación OD / OI */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs font-mono">
                        <thead>
                          <tr className="text-slate-500 border-b border-slate-200 text-left">
                            <th className="py-1">OJO</th>
                            <th className="py-1">ESFERA</th>
                            <th className="py-1">CILINDRO</th>
                            <th className="py-1">EJE</th>
                            <th className="py-1">ADICIÓN</th>
                            <th className="py-1">AGUDEZA</th>
                            <th className="py-1">DNP (MM)</th>
                            <th className="py-1">ALTURA</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-900 font-medium">
                          <tr>
                            <td className="py-2 text-sky-700 font-bold">OD (Derecho)</td>
                            <td className="py-2">{r.od.esfera || '0.00'}</td>
                            <td className="py-2">{r.od.cilindro || '0.00'}</td>
                            <td className="py-2">{r.od.eje ? `${r.od.eje}°` : '-'}</td>
                            <td className="py-2">{r.od.adicion || '-'}</td>
                            <td className="py-2">{r.od.av || '20/20'}</td>
                            <td className="py-2">{r.od.dnp} mm</td>
                            <td className="py-2">{r.od.altura || '18'} mm</td>
                          </tr>
                          <tr>
                            <td className="py-2 text-sky-700 font-bold">OI (Izquierdo)</td>
                            <td className="py-2">{r.oi.esfera || '0.00'}</td>
                            <td className="py-2">{r.oi.cilindro || '0.00'}</td>
                            <td className="py-2">{r.oi.eje ? `${r.oi.eje}°` : '-'}</td>
                            <td className="py-2">{r.oi.adicion || '-'}</td>
                            <td className="py-2">{r.oi.av || '20/20'}</td>
                            <td className="py-2">{r.oi.dnp} mm</td>
                            <td className="py-2">{r.oi.altura || '18'} mm</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Diagnóstico y Tratamiento Sugerido */}
                    <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 flex flex-col sm:flex-row justify-between gap-2">
                      <div>
                        <strong>Diseño de Lente:</strong> {r.tipoLente} · {r.tratamiento}
                      </div>
                      {r.observaciones && (
                        <div className="text-slate-500 italic max-w-sm">
                          "{r.observaciones}"
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                  El paciente no tiene recetas oftálmicas registradas todavía.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-sm text-slate-400 bg-white rounded-xl border border-slate-200">
            Selecciona un paciente del directorio para ver su historial clínico visual.
          </div>
        )}
      </div>

      {/* Modal Nueva Receta Oftálmica */}
      {modalReceta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Registrar Receta Oftálmica para {clienteActivo?.nombres}
              </h3>
              <button onClick={() => setModalReceta(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAgregarReceta} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Optometrista / Especialista</label>
                  <input
                    type="text"
                    required
                    value={optometrista}
                    onChange={(e) => setOptometrista(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Colegiatura CTO</label>
                  <input
                    type="text"
                    value={colegiatura}
                    onChange={(e) => setColegiatura(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Ojo Derecho (OD) */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-sky-900">OJO DERECHO (OD)</div>
                <div className="grid grid-cols-7 gap-1.5 font-mono text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">ESF</label>
                    <input type="text" value={odEsfera} onChange={(e) => setOdEsfera(e.target.value)} className="w-full p-1.5 border rounded bg-white text-center" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">CIL</label>
                    <input type="text" value={odCilindro} onChange={(e) => setOdCilindro(e.target.value)} className="w-full p-1.5 border rounded bg-white text-center" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">EJE</label>
                    <input type="text" value={odEje} onChange={(e) => setOdEje(e.target.value)} className="w-full p-1.5 border rounded bg-white text-center" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">ADD</label>
                    <input type="text" value={odAdd} onChange={(e) => setOdAdd(e.target.value)} className="w-full p-1.5 border rounded bg-white text-center" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">AV</label>
                    <input type="text" value={odAv} onChange={(e) => setOdAv(e.target.value)} className="w-full p-1.5 border rounded bg-white text-center" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">DNP(mm)</label>
                    <input type="text" value={odDnp} onChange={(e) => setOdDnp(e.target.value)} className="w-full p-1.5 border rounded bg-white text-center" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">ALT</label>
                    <input type="text" value={odAltura} onChange={(e) => setOdAltura(e.target.value)} className="w-full p-1.5 border rounded bg-white text-center" />
                  </div>
                </div>
              </div>

              {/* Ojo Izquierdo (OI) */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-sky-900">OJO IZQUIERDO (OI)</div>
                <div className="grid grid-cols-7 gap-1.5 font-mono text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">ESF</label>
                    <input type="text" value={oiEsfera} onChange={(e) => setOiEsfera(e.target.value)} className="w-full p-1.5 border rounded bg-white text-center" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">CIL</label>
                    <input type="text" value={oiCilindro} onChange={(e) => setOiCilindro(e.target.value)} className="w-full p-1.5 border rounded bg-white text-center" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">EJE</label>
                    <input type="text" value={oiEje} onChange={(e) => setOiEje(e.target.value)} className="w-full p-1.5 border rounded bg-white text-center" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">ADD</label>
                    <input type="text" value={oiAdd} onChange={(e) => setOiAdd(e.target.value)} className="w-full p-1.5 border rounded bg-white text-center" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">AV</label>
                    <input type="text" value={oiAv} onChange={(e) => setOiAv(e.target.value)} className="w-full p-1.5 border rounded bg-white text-center" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">DNP(mm)</label>
                    <input type="text" value={oiDnp} onChange={(e) => setOiDnp(e.target.value)} className="w-full p-1.5 border rounded bg-white text-center" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">ALT</label>
                    <input type="text" value={oiAltura} onChange={(e) => setOiAltura(e.target.value)} className="w-full p-1.5 border rounded bg-white text-center" />
                  </div>
                </div>
              </div>

              {/* Recomendaciones Técnicas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Tipo de Lente</label>
                  <select
                    value={tipoLente}
                    onChange={(e: any) => setTipoLente(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-slate-50"
                  >
                    <option value="Monofocal Lejos">Monofocal Lejos</option>
                    <option value="Monofocal Cerca">Monofocal Cerca</option>
                    <option value="Bifocal Flat-Top">Bifocal Flat-Top</option>
                    <option value="Progresivo Digital">Progresivo Digital</option>
                    <option value="Lente de Contacto">Lente de Contacto</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Tratamiento Recomendado</label>
                  <select
                    value={tratamiento}
                    onChange={(e: any) => setTratamiento(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-slate-50"
                  >
                    <option value="Filtro Azul UV420">Filtro Azul UV420</option>
                    <option value="Antirreflejo HMC">Antirreflejo HMC</option>
                    <option value="Fotocromático Transitions">Fotocromático Transitions</option>
                    <option value="Policarbonato">Policarbonato Resistente</option>
                    <option value="Resina Alto Índice 1.67">Resina Alto Índice 1.67</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">Observaciones Clínicas / Diagnóstico</label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ej: Paciente con leve fotofobia, se aconseja fotocromático..."
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalReceta(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-sky-600 hover:bg-sky-700 text-white rounded-lg"
                >
                  Guardar Receta en Ficha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Cliente */}
      {modalCliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Registrar Nuevo Paciente
              </h3>
              <button onClick={() => setModalCliente(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearCliente} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Doc.</label>
                  <select
                    value={docTipo}
                    onChange={(e: any) => setDocTipo(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-slate-50"
                  >
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                    <option value="CE">CE</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-600 block mb-1">Número</label>
                  <input
                    type="text"
                    required
                    value={docNum}
                    onChange={(e) => setDocNum(e.target.value)}
                    placeholder="45892104"
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">Nombres</label>
                <input
                  type="text"
                  required
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  placeholder="Valeria Patricia"
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">Apellidos</label>
                <input
                  type="text"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  placeholder="Torres Quispe"
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="984 123 456"
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="valeria@gmail.com"
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">Dirección</label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Miraflores, Lima"
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalCliente(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-sky-600 hover:bg-sky-700 text-white rounded-lg"
                >
                  Guardar Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
