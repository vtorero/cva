/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Producto, CategoriaProducto } from '../../types';
import { api } from '../../services/api';
import {
  Package,
  Search,
  Plus,
  AlertCircle,
  Edit2,
  Trash2,
  ArrowUpDown,
  Filter,
  Check,
  X
} from 'lucide-react';

export const InventarioView: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categoria, setCategoria] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');
  const [soloStockBajo, setSoloStockBajo] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(false);

  // Modal Nuevo Producto
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [codigo, setCodigo] = useState<string>('');
  const [nombre, setNombre] = useState<string>('');
  const [catSeleccionada, setCatSeleccionada] = useState<CategoriaProducto>('montura');
  const [marca, setMarca] = useState<string>('');
  const [modelo, setModelo] = useState<string>('');
  const [color, setColor] = useState<string>('');
  const [material, setMaterial] = useState<string>('');
  const [calibre, setCalibre] = useState<string>('');
  const [stock, setStock] = useState<number>(10);
  const [stockMinimo, setStockMinimo] = useState<number>(3);
  const [precioCosto, setPrecioCosto] = useState<number>(120);
  const [precioVenta, setPrecioVenta] = useState<number>(250);
  const [codigoSunat, setCodigoSunat] = useState<string>('42142902');

  const cargarProductos = async () => {
    setCargando(true);
    try {
      const data = await api.productos.getAll({
        categoria,
        busqueda,
        soloStockBajo
      });
      setProductos(data);
    } catch (err) {
      console.error('Error cargando inventario:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, [categoria, busqueda, soloStockBajo]);

  const handleCrearProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.productos.create({
        codigo,
        nombre,
        categoria: catSeleccionada,
        marca,
        modelo,
        color,
        material,
        calibre,
        stock,
        stockMinimo,
        precioCosto,
        precioVenta,
        codigoSunat
      });
      setModalAbierto(false);
      // Reset form
      setCodigo('');
      setNombre('');
      setMarca('');
      setModelo('');
      setColor('');
      setMaterial('');
      setCalibre('');
      cargarProductos();
    } catch (err) {
      console.error('Error creando producto:', err);
    }
  };

  const handleAjustarStock = async (id: string, delta: number) => {
    try {
      await api.productos.ajustarStock(id, delta);
      setProductos(prev =>
        prev.map(p => p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p)
      );
    } catch (err) {
      console.error('Error ajustando stock:', err);
    }
  };

  const handleEliminar = async (id: string) => {
    if (confirm('¿Seguro que deseas eliminar este producto del inventario?')) {
      await api.productos.delete(id);
      cargarProductos();
    }
  };

  // Metrics
  const totalArticulos = productos.reduce((acc, p) => p.categoria !== 'servicio' ? acc + p.stock : acc, 0);
  const alertasStockBajo = productos.filter(p => p.stock <= p.stockMinimo && p.categoria !== 'servicio').length;
  const valorInventario = productos.reduce((acc, p) => p.categoria !== 'servicio' ? acc + (p.stock * p.precioCosto) : acc, 0);

  return (
    <div className="space-y-6">
      {/* KPIs de Inventario */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Total Unidades en Stock</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {totalArticulos} unds
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Monturas, lunas y lentes de contacto
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Alertas de Stock Mínimo</div>
          <div className={`text-2xl font-bold font-mono tabular-nums mt-1 ${alertasStockBajo > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {alertasStockBajo} ítems
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Requieren reposición con proveedores
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Valoración de Stock (Costo)</div>
          <div className="text-2xl font-bold text-sky-950 font-mono tabular-nums mt-1">
            S/ {valorInventario.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Capital activo en tienda
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Acciones */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por marca, modelo, material o SKU..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="todos">Todas las Categorías</option>
            <option value="montura">Monturas</option>
            <option value="luna">Lunas Oftálmicas</option>
            <option value="lente_contacto">Lentes de Contacto</option>
            <option value="accesorio">Accesorios</option>
            <option value="servicio">Servicios Clínicos</option>
          </select>

          <button
            onClick={() => setSoloStockBajo(!soloStockBajo)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
              soloStockBajo
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Solo Stock Bajo</span>
          </button>

          <button
            onClick={() => setModalAbierto(true)}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Tabla de Inventario */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Código / SKU</th>
                <th className="py-3 px-4">Descripción & Marca</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Especificaciones</th>
                <th className="py-3 px-4 text-center">Stock</th>
                <th className="py-3 px-4 text-right">Costo S/.</th>
                <th className="py-3 px-4 text-right">Venta S/.</th>
                <th className="py-3 px-4 text-right">Margen</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {productos.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No se encontraron productos en el inventario.
                  </td>
                </tr>
              ) : (
                productos.map((prod) => {
                  const esServicio = prod.categoria === 'servicio';
                  const alerta = prod.stock <= prod.stockMinimo && !esServicio;
                  const margen = prod.precioVenta > 0
                    ? Math.round(((prod.precioVenta - prod.precioCosto) / prod.precioVenta) * 100)
                    : 0;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                        {prod.codigo}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900">{prod.nombre}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {prod.marca} {prod.modelo ? `· Mod: ${prod.modelo}` : ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 capitalize">
                        {prod.categoria.replace('_', ' ')}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {prod.material || 'Estándar'} {prod.calibre ? `· ${prod.calibre}` : ''} {prod.color ? `· ${prod.color}` : ''}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {esServicio ? (
                          <span className="text-slate-400 font-mono">-</span>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 font-mono">
                            <button
                              onClick={() => handleAjustarStock(prod.id, -1)}
                              className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
                            >
                              -
                            </button>
                            <span className={`w-8 text-center font-bold tabular-nums ${alerta ? 'text-amber-600' : 'text-slate-900'}`}>
                              {prod.stock}
                            </span>
                            <button
                              onClick={() => handleAjustarStock(prod.id, 1)}
                              className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600">
                        {esServicio ? '-' : `S/ ${prod.precioCosto.toFixed(2)}`}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums text-slate-900">
                        S/ {prod.precioVenta.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-emerald-700 font-medium">
                        {esServicio ? '100%' : `${margen}%`}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleEliminar(prod.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Nuevo Producto */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Nuevo Producto Óptico
              </h3>
              <button onClick={() => setModalAbierto(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearProducto} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Categoría</label>
                  <select
                    value={catSeleccionada}
                    onChange={(e) => setCatSeleccionada(e.target.value as CategoriaProducto)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-slate-50"
                  >
                    <option value="montura">Montura</option>
                    <option value="luna">Lunas Oftálmicas</option>
                    <option value="lente_contacto">Lentes de Contacto</option>
                    <option value="accesorio">Accesorio / Gotas</option>
                    <option value="servicio">Servicio Clínico</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Código / SKU</label>
                  <input
                    type="text"
                    required
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder="MON-RB-001"
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">Nombre Comercial del Producto</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Montura Ray-Ban Aviator Dorada"
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Marca</label>
                  <input
                    type="text"
                    required
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    placeholder="Ray-Ban / Crizal / Alcon"
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Modelo</label>
                  <input
                    type="text"
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    placeholder="RX6489"
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Material</label>
                  <input
                    type="text"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    placeholder="Titanio / Acetato"
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Calibre</label>
                  <input
                    type="text"
                    value={calibre}
                    onChange={(e) => setCalibre(e.target.value)}
                    placeholder="51-21-145"
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Color</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Dorado / Negro"
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Stock Mínimo de Alerta</label>
                  <input
                    type="number"
                    value={stockMinimo}
                    onChange={(e) => setStockMinimo(parseInt(e.target.value) || 0)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Precio Costo (S/.)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={precioCosto}
                    onChange={(e) => setPrecioCosto(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Precio Venta (S/. con IGV)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={precioVenta}
                    onChange={(e) => setPrecioVenta(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg font-mono font-bold text-sky-950"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors"
                >
                  Guardar en Inventario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
