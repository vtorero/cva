/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Proveedor, CompraProveedor, Producto } from '../../types';
import { api } from '../../services/api';
import {
  Truck,
  Plus,
  Search,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Building,
  X
} from 'lucide-react';

export const ComprasView: React.FC = () => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [compras, setCompras] = useState<CompraProveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);

  // Modales
  const [modalCompra, setModalCompra] = useState<boolean>(false);
  const [modalProveedor, setModalProveedor] = useState<boolean>(false);

  // Form Nueva Compra
  const [provSeleccionadoId, setProvSeleccionadoId] = useState<string>('');
  const [numeroFactura, setNumeroFactura] = useState<string>('F002-005120');
  const [estadoPago, setEstadoPago] = useState<'pagado' | 'pendiente'>('pagado');
  const [prodSeleccionadoId, setProdSeleccionadoId] = useState<string>('');
  const [cantidad, setCantidad] = useState<number>(5);
  const [costoUnitario, setCostoUnitario] = useState<number>(140);

  // Form Nuevo Proveedor
  const [rucProv, setRucProv] = useState<string>('');
  const [razonSocial, setRazonSocial] = useState<string>('');
  const [contacto, setContacto] = useState<string>('');
  const [telefono, setTelefono] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [direccion, setDireccion] = useState<string>('');
  const [especialidad, setEspecialidad] = useState<'monturas' | 'laboratorio_lunas' | 'lentes_contacto' | 'insumos'>('monturas');

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [provs, cmps, prods] = await Promise.all([
        api.proveedores.getAll(),
        api.compras.getAll(),
        api.productos.getAll()
      ]);
      setProveedores(provs);
      setCompras(cmps);
      setProductos(prods);
      if (provs.length > 0 && !provSeleccionadoId) {
        setProvSeleccionadoId(provs[0].id);
      }
      if (prods.length > 0 && !prodSeleccionadoId) {
        setProdSeleccionadoId(prods[0].id);
      }
    } catch (err) {
      console.error('Error cargando compras:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleCrearCompra = async (e: React.FormEvent) => {
    e.preventDefault();
    const prov = proveedores.find(p => p.id === provSeleccionadoId);
    const prod = productos.find(p => p.id === prodSeleccionadoId);
    if (!prov || !prod) return;

    const total = cantidad * costoUnitario;
    const subtotal = Math.round((total / 1.18) * 100) / 100;
    const igv = Math.round((total - subtotal) * 100) / 100;

    try {
      await api.compras.create({
        proveedorId: prov.id,
        proveedorRazonSocial: prov.razonSocial,
        proveedorRuc: prov.ruc,
        numeroComprobante: numeroFactura,
        fecha: new Date().toISOString().split('T')[0],
        subtotal,
        igv,
        total,
        estadoPago,
        items: [
          {
            productoId: prod.id,
            nombre: prod.nombre,
            cantidad,
            costoUnitario,
            subtotal: total
          }
        ]
      });

      setModalCompra(false);
      cargarDatos();
    } catch (err) {
      console.error('Error registrando compra:', err);
    }
  };

  const handleCrearProveedor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.proveedores.create({
        ruc: rucProv,
        razonSocial,
        nombreContacto: contacto,
        telefono,
        email,
        direccion,
        especialidad
      });
      setModalProveedor(false);
      setRucProv('');
      setRazonSocial('');
      setContacto('');
      setTelefono('');
      setEmail('');
      setDireccion('');
      cargarDatos();
    } catch (err) {
      console.error('Error creando proveedor:', err);
    }
  };

  const totalComprasMonto = compras.reduce((acc, c) => acc + c.total, 0);
  const cuentasPorPagar = compras.filter(c => c.estadoPago === 'pendiente').reduce((acc, c) => acc + c.total, 0);

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Proveedores Registrados</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {proveedores.length} empresas
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Laboratorios y distribuidores autorizados
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Total Compras Realizadas</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            S/ {totalComprasMonto.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Reabastecimiento de monturas y lunas
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Cuentas por Pagar (Facturas a Crédito)</div>
          <div className="text-2xl font-bold text-amber-600 font-mono tabular-nums mt-1">
            S/ {cuentasPorPagar.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Pendiente de amortización comercial
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">
          Registro de Compras & Proveedores
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalProveedor(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
          >
            + Nuevo Proveedor
          </button>
          <button
            onClick={() => setModalCompra(true)}
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
          >
            + Registrar Factura Compra
          </button>
        </div>
      </div>

      {/* Historial de Compras */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-700">
          Facturas de Compra Ingresadas al Almacén
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-2.5 px-4 font-sans font-semibold">Comprobante</th>
                <th className="py-2.5 px-4 font-sans font-semibold">Proveedor</th>
                <th className="py-2.5 px-4 font-sans font-semibold">Fecha</th>
                <th className="py-2.5 px-4 font-sans font-semibold text-right">Subtotal S/.</th>
                <th className="py-2.5 px-4 font-sans font-semibold text-right">IGV (18%)</th>
                <th className="py-2.5 px-4 font-sans font-semibold text-right">Total S/.</th>
                <th className="py-2.5 px-4 font-sans font-semibold text-center">Estado de Pago</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {compras.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{c.numeroComprobante}</td>
                  <td className="py-3 px-4 font-sans">
                    <div className="font-semibold text-slate-900">{c.proveedorRazonSocial}</div>
                    <div className="text-[11px] font-mono text-slate-500">RUC: {c.proveedorRuc}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{c.fecha}</td>
                  <td className="py-3 px-4 text-right tabular-nums text-slate-600">S/ {c.subtotal.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right tabular-nums text-slate-600">S/ {c.igv.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-bold tabular-nums text-slate-900">S/ {c.total.toFixed(2)}</td>
                  <td className="py-3 px-4 text-center font-sans">
                    <span className={`text-xs font-semibold ${c.estadoPago === 'pagado' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {c.estadoPago === 'pagado' ? 'Cancelado' : 'Por Pagar'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Directorio de Proveedores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {proveedores.map((p) => (
          <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm leading-tight">{p.razonSocial}</h4>
                <div className="text-xs text-slate-500 font-mono mt-0.5">RUC: {p.ruc}</div>
              </div>
              <Building className="w-4 h-4 text-slate-400 shrink-0" />
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Contacto:</span>
                <span>{p.nombreContacto}</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-slate-400">Telf:</span>
                <span>{p.telefono}</span>
              </div>
              <div className="text-[11px] text-slate-500 truncate">{p.direccion}</div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs font-mono">
              <span className="text-slate-500">Compras acumuladas:</span>
              <span className="font-bold text-slate-900 tabular-nums">S/ {p.totalCompras.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Registrar Compra */}
      {modalCompra && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">Registrar Factura de Compra</h3>
              <button onClick={() => setModalCompra(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCrearCompra} className="space-y-3">
              <div>
                <label className="text-xs text-slate-600 block mb-1">Proveedor</label>
                <select
                  value={provSeleccionadoId}
                  onChange={(e) => setProvSeleccionadoId(e.target.value)}
                  className="w-full p-2 text-xs border rounded-lg bg-slate-50"
                >
                  {proveedores.map(p => (
                    <option key={p.id} value={p.id}>{p.razonSocial} ({p.ruc})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">N° Factura del Proveedor</label>
                <input
                  type="text"
                  required
                  value={numeroFactura}
                  onChange={(e) => setNumeroFactura(e.target.value)}
                  className="w-full p-2 text-xs border rounded-lg font-mono"
                  placeholder="F001-0012480"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">Producto a Reabastecer</label>
                <select
                  value={prodSeleccionadoId}
                  onChange={(e) => setProdSeleccionadoId(e.target.value)}
                  className="w-full p-2 text-xs border rounded-lg bg-slate-50"
                >
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} (Stock actual: {p.stock})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Cantidad Comprada</label>
                  <input
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                    className="w-full p-2 text-xs border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Costo Unitario (S/.)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={costoUnitario}
                    onChange={(e) => setCostoUnitario(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 text-xs border rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">Condición de Pago</label>
                <select
                  value={estadoPago}
                  onChange={(e: any) => setEstadoPago(e.target.value)}
                  className="w-full p-2 text-xs border rounded-lg bg-slate-50"
                >
                  <option value="pagado">Pagado al Contado</option>
                  <option value="pendiente">A Crédito (Cuenta por Pagar)</option>
                </select>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg text-xs font-mono flex justify-between">
                <span>Total Compra:</span>
                <span className="font-bold">S/ {(cantidad * costoUnitario).toFixed(2)}</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setModalCompra(false)} className="px-3 py-1.5 text-xs text-slate-600">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 text-xs font-semibold bg-sky-600 text-white rounded-lg">
                  Ingresar a Almacén
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Proveedor */}
      {modalProveedor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">Nuevo Proveedor Óptico</h3>
              <button onClick={() => setModalProveedor(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCrearProveedor} className="space-y-3">
              <div>
                <label className="text-xs text-slate-600 block mb-1">RUC (11 dígitos)</label>
                <input
                  type="text"
                  required
                  value={rucProv}
                  onChange={(e) => setRucProv(e.target.value)}
                  placeholder="20100142981"
                  className="w-full p-2 text-xs border rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">Razón Social</label>
                <input
                  type="text"
                  required
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  placeholder="ESSILOR LUXOTTICA PERÚ S.A.C."
                  className="w-full p-2 text-xs border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Contacto</label>
                  <input
                    type="text"
                    value={contacto}
                    onChange={(e) => setContacto(e.target.value)}
                    placeholder="Carlos Mendoza"
                    className="w-full p-2 text-xs border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="987 654 321"
                    className="w-full p-2 text-xs border rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ventas@proveedor.pe"
                  className="w-full p-2 text-xs border rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">Dirección</label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Av. Javier Prado Este 4200, Surco"
                  className="w-full p-2 text-xs border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setModalProveedor(false)} className="px-3 py-1.5 text-xs text-slate-600">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 text-xs font-semibold bg-sky-600 text-white rounded-lg">
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
