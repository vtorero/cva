/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Producto,
  Cliente,
  ItemCarrito,
  CategoriaProducto,
  TipoComprobante,
  MetodoPago,
  RecetaOftalmica
} from '../../types';
import { api } from '../../services/api';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  UserCheck,
  Check,
  Eye,
  Calendar,
  Sparkles,
  Phone,
  CreditCard,
  Banknote,
  QrCode,
  Building2,
  FileCheck2,
  AlertCircle
} from 'lucide-react';

interface PosViewProps {
  onSaleCompleted: (ventaId: string) => void;
}

export const PosView: React.FC<PosViewProps> = ({ onSaleCompleted }) => {
  // Products & Filtering
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('todos');
  const [busquedaProducto, setBusquedaProducto] = useState<string>('');
  const [loadingProds, setLoadingProds] = useState<boolean>(false);

  // Cart
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);

  // Customers
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [busquedaDoc, setBusquedaDoc] = useState<string>('');
  const [buscandoDoc, setBuscandoDoc] = useState<boolean>(false);
  const [modalNuevoCliente, setModalNuevoCliente] = useState<boolean>(false);

  // Prescriptions
  const [recetaSeleccionada, setRecetaSeleccionada] = useState<RecetaOftalmica | null>(null);

  // Checkout configuration
  const [tipoComprobante, setTipoComprobante] = useState<TipoComprobante>('boleta');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('yape');
  const [referenciaPago, setReferenciaPago] = useState<string>('');
  const [esAdelanto, setEsAdelanto] = useState<boolean>(false);
  const [montoAdelanto, setMontoAdelanto] = useState<string>('');
  const [crearOrdenTaller, setCrearOrdenTaller] = useState<boolean>(true);
  const [procesandoVenta, setProcesandoVenta] = useState<boolean>(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Quick new client form fields
  const [nuevoDocTipo, setNuevoDocTipo] = useState<'DNI' | 'RUC'>('DNI');
  const [nuevoDocNum, setNuevoDocNum] = useState<string>('');
  const [nuevoNombres, setNuevoNombres] = useState<string>('');
  const [nuevoApellidos, setNuevoApellidos] = useState<string>('');
  const [nuevoTelefono, setNuevoTelefono] = useState<string>('');
  const [nuevoEmail, setNuevoEmail] = useState<string>('');
  const [nuevoDireccion, setNuevoDireccion] = useState<string>('');

  // Load products and clients
  const cargarDatos = async () => {
    setLoadingProds(true);
    try {
      const [prods, clis] = await Promise.all([
        api.productos.getAll({
          busqueda: busquedaProducto,
          categoria: categoriaSeleccionada
        }),
        api.clientes.getAll()
      ]);
      setProductos(prods);
      setClientes(clis);
      if (!clienteSeleccionado && clis.length > 0) {
        setClienteSeleccionado(clis[0]);
        if (clis[0].recetas.length > 0) {
          setRecetaSeleccionada(clis[0].recetas[0]);
        }
      }
    } catch (err) {
      console.error('Error cargando catálogo:', err);
    } finally {
      setLoadingProds(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [categoriaSeleccionada, busquedaProducto]);

  // Fast document lookup (DNI / RUC)
  const handleBuscarDocumento = async () => {
    if (!busquedaDoc.trim()) return;
    setBuscandoDoc(true);
    try {
      const tipo = busquedaDoc.length === 11 ? 'RUC' : 'DNI';
      const res = await api.clientes.consultarDocumento(tipo, busquedaDoc.trim());
      if (res.encontrado && res.data) {
        // If already in client list
        const existing = clientes.find(c => c.numeroDocumento === busquedaDoc.trim());
        if (existing) {
          setClienteSeleccionado(existing);
          if (existing.recetas?.length > 0) {
            setRecetaSeleccionada(existing.recetas[0]);
          }
        } else {
          // Pre-fill creation modal
          setNuevoDocTipo(tipo);
          setNuevoDocNum(busquedaDoc.trim());
          setNuevoNombres(res.data.nombres || '');
          setNuevoApellidos(res.data.apellidos || '');
          setNuevoDireccion(res.data.direccion || '');
          setModalNuevoCliente(true);
        }
      } else {
        // Open modal for fast registration
        setNuevoDocTipo(tipo);
        setNuevoDocNum(busquedaDoc.trim());
        setModalNuevoCliente(true);
      }
    } catch (err) {
      console.error('Error en consulta de documento:', err);
    } finally {
      setBuscandoDoc(false);
    }
  };

  // Add to cart
  const handleAgregarAlCarrito = (prod: Producto) => {
    setCarrito(prev => {
      const existe = prev.find(item => item.producto.id === prod.id);
      if (existe) {
        return prev.map(item =>
          item.producto.id === prod.id
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                subtotal: (item.cantidad + 1) * item.precioUnitario
              }
            : item
        );
      }
      return [
        ...prev,
        {
          producto: prod,
          cantidad: 1,
          precioUnitario: prod.precioVenta,
          subtotal: prod.precioVenta,
          recetaOftalmica: prod.categoria === 'luna' ? recetaSeleccionada || undefined : undefined
        }
      ];
    });
  };

  // Adjust cart item quantity
  const handleModificarCantidad = (prodId: string, delta: number) => {
    setCarrito(prev =>
      prev
        .map(item => {
          if (item.producto.id === prodId) {
            const nuevaCant = item.cantidad + delta;
            if (nuevaCant <= 0) return null;
            return {
              ...item,
              cantidad: nuevaCant,
              subtotal: nuevaCant * item.precioUnitario
            };
          }
          return item;
        })
        .filter(Boolean) as ItemCarrito[]
    );
  };

  // Remove from cart
  const handleEliminarItem = (prodId: string) => {
    setCarrito(prev => prev.filter(item => item.producto.id !== prodId));
  };

  // Cart financial totals
  const totalBruto = carrito.reduce((acc, it) => acc + it.subtotal, 0);
  const subtotalGravado = Math.round((totalBruto / 1.18) * 100) / 100;
  const igv18 = Math.round((totalBruto - subtotalGravado) * 100) / 100;
  const adelantoNum = esAdelanto ? parseFloat(montoAdelanto) || Math.round(totalBruto * 0.5) : totalBruto;
  const saldoPendiente = Math.max(0, Math.round((totalBruto - adelantoNum) * 100) / 100);

  // Quick Client creation handler
  const handleCrearClienteRapido = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const nuevo = await api.clientes.create({
        tipoDocumento: nuevoDocTipo,
        numeroDocumento: nuevoDocNum,
        nombres: nuevoNombres,
        apellidos: nuevoApellidos,
        telefono: nuevoTelefono,
        email: nuevoEmail,
        direccion: nuevoDireccion
      });
      setClientes(prev => [nuevo, ...prev]);
      setClienteSeleccionado(nuevo);
      setModalNuevoCliente(false);
      // Reset form
      setNuevoDocNum('');
      setNuevoNombres('');
      setNuevoApellidos('');
      setNuevoTelefono('');
      setNuevoEmail('');
      setNuevoDireccion('');
    } catch (err) {
      console.error('Error creando cliente:', err);
    }
  };

  // Process optical checkout with SUNAT electronic invoice
  const handleProcesarVenta = async () => {
    if (!clienteSeleccionado) {
      alert('Por favor selecciona o registra un cliente.');
      return;
    }
    if (carrito.length === 0) {
      alert('El carrito está vacío.');
      return;
    }

    setProcesandoVenta(true);
    try {
      const resultado = await api.ventas.crearVenta({
        cliente: clienteSeleccionado,
        items: carrito,
        tipoComprobante,
        metodoPago,
        referenciaPago,
        adelantoMonto: esAdelanto ? adelantoNum : totalBruto,
        crearOrdenLaboratorio: crearOrdenTaller,
        recetaAsociada: recetaSeleccionada || undefined
      });

      setMensajeExito(`¡Venta realizada con éxito! Comprobante SUNAT: ${resultado.venta.serieNumero}`);
      setCarrito([]);
      setEsAdelanto(false);
      setMontoAdelanto('');

      // Reload products so stocks update
      cargarDatos();

      // Trigger callback with sale ID to optionally view/print ticket
      setTimeout(() => {
        onSaleCompleted(resultado.venta.id);
        setMensajeExito(null);
      }, 1200);
    } catch (err: any) {
      alert(`Error al procesar la venta: ${err.message}`);
    } finally {
      setProcesandoVenta(false);
    }
  };

  const categorias: { id: string; label: string }[] = [
    { id: 'todos', label: 'Todo' },
    { id: 'montura', label: 'Monturas' },
    { id: 'luna', label: 'Lunas Oftálmicas' },
    { id: 'lente_contacto', label: 'Lentes Contacto' },
    { id: 'accesorio', label: 'Accesorios & Gotas' },
    { id: 'servicio', label: 'Examen de Vista' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Columna Izquierda: Catálogo de Productos y Filtros (7 Cols) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Barra de Búsqueda y Filtros de Categoría */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por marca (Ray-Ban, Oakley), código SKU o tipo de luna..."
              value={busquedaProducto}
              onChange={(e) => setBusquedaProducto(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Categorías como Segmented Controls funcionales */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categorias.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoriaSeleccionada(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  categoriaSeleccionada === cat.id
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de Productos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[620px] overflow-y-auto pr-1">
          {loadingProds ? (
            <div className="col-span-2 py-12 text-center text-sm text-slate-400">
              Cargando catálogo oftálmico...
            </div>
          ) : productos.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-sm text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
              No se encontraron productos con el filtro aplicado.
            </div>
          ) : (
            productos.map(prod => {
              const estaEnCarrito = carrito.some(it => it.producto.id === prod.id);
              const sinStock = prod.stock <= 0 && prod.categoria !== 'servicio';
              const stockBajo = prod.stock <= prod.stockMinimo && prod.categoria !== 'servicio';

              return (
                <div
                  key={prod.id}
                  className={`bg-white p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    estaEnCarrito
                      ? 'border-sky-500 ring-1 ring-sky-500 bg-sky-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    {/* Metadatos sin pills, con separadores tipográficos limpios */}
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="font-semibold text-slate-700">{prod.marca}</span>
                      <span className="font-mono text-[11px]">{prod.codigo}</span>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                      {prod.nombre}
                    </h4>

                    {prod.material && (
                      <p className="text-xs text-slate-500 mt-1">
                        {prod.material} {prod.calibre ? `· Calibre ${prod.calibre}` : ''}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-base font-bold text-slate-900 font-mono tabular-nums">
                        S/ {prod.precioVenta.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                        {prod.categoria === 'servicio' ? (
                          <span>Servicio Clínico</span>
                        ) : (
                          <span className={stockBajo ? 'text-amber-600 font-medium' : ''}>
                            Stock: {prod.stock} unds
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAgregarAlCarrito(prod)}
                      disabled={sinStock}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1 shrink-0 ${
                        sinStock
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : estaEnCarrito
                          ? 'bg-sky-100 text-sky-700 hover:bg-sky-200'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{estaEnCarrito ? 'Añadir +' : 'Agregar'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Columna Derecha: Facturación, Cliente, Receta y Carrito (5 Cols) */}
      <div className="lg:col-span-5 space-y-4">
        
        {/* Panel de Selección Rápida de Cliente & Receta Oftálmica */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Cliente & Ficha Clínica
            </span>
            <button
              onClick={() => setModalNuevoCliente(true)}
              className="text-xs text-sky-600 hover:text-sky-700 font-medium"
            >
              + Nuevo Cliente
            </button>
          </div>

          {/* Búsqueda rápida por DNI / RUC */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Ingresa DNI (8 dígitos) o RUC (11)..."
                value={busquedaDoc}
                onChange={(e) => setBusquedaDoc(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBuscarDocumento()}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
              />
            </div>
            <button
              onClick={handleBuscarDocumento}
              disabled={buscandoDoc}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors shrink-0"
            >
              {buscandoDoc ? 'Buscando...' : 'Consultar'}
            </button>
          </div>

          {/* Cliente actualmente seleccionado */}
          {clienteSeleccionado ? (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {clienteSeleccionado.nombres} {clienteSeleccionado.apellidos}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {clienteSeleccionado.tipoDocumento}: {clienteSeleccionado.numeroDocumento} · Telf: {clienteSeleccionado.telefono || 'Sin celular'}
                  </div>
                </div>
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>

              {/* Selector de Recetas oftálmicas del paciente */}
              {clienteSeleccionado.recetas && clienteSeleccionado.recetas.length > 0 ? (
                <div className="pt-2 border-t border-slate-200/60 mt-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                    <span className="font-semibold flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-sky-600" />
                      <span>Receta Activa:</span>
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {clienteSeleccionado.recetas[0].fecha}
                    </span>
                  </div>

                  <div className="p-2 bg-white rounded border border-slate-200 text-[10px] font-mono leading-tight">
                    <div className="grid grid-cols-6 text-slate-500 font-semibold mb-0.5">
                      <span>OJO</span>
                      <span>ESF</span>
                      <span>CIL</span>
                      <span>EJE</span>
                      <span>ADD</span>
                      <span>DNP</span>
                    </div>
                    <div className="grid grid-cols-6 text-slate-900 font-medium">
                      <span className="text-sky-700 font-bold">OD</span>
                      <span>{clienteSeleccionado.recetas[0].od.esfera || '0.00'}</span>
                      <span>{clienteSeleccionado.recetas[0].od.cilindro || '0.00'}</span>
                      <span>{clienteSeleccionado.recetas[0].od.eje}°</span>
                      <span>{clienteSeleccionado.recetas[0].od.adicion || '-'}</span>
                      <span>{clienteSeleccionado.recetas[0].od.dnp}mm</span>
                    </div>
                    <div className="grid grid-cols-6 text-slate-900 font-medium">
                      <span className="text-sky-700 font-bold">OI</span>
                      <span>{clienteSeleccionado.recetas[0].oi.esfera || '0.00'}</span>
                      <span>{clienteSeleccionado.recetas[0].oi.cilindro || '0.00'}</span>
                      <span>{clienteSeleccionado.recetas[0].oi.eje}°</span>
                      <span>{clienteSeleccionado.recetas[0].oi.adicion || '-'}</span>
                      <span>{clienteSeleccionado.recetas[0].oi.dnp}mm</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 italic pt-1">
                  Sin recetas registradas para este paciente.
                </div>
              )}
            </div>
          ) : (
            <div className="p-2.5 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
              Seleccione un cliente para emitir el comprobante.
            </div>
          )}
        </div>

        {/* Panel del Carrito de Compras */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Detalle del Pedido ({carrito.length} ítems)
              </h3>
            </div>
            {carrito.length > 0 && (
              <button
                onClick={() => setCarrito([])}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium"
              >
                Vaciar
              </button>
            )}
          </div>

          {/* Lista de Ítems */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {carrito.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Agrega monturas, lunas o lentes de contacto del catálogo.
              </div>
            ) : (
              carrito.map((item) => (
                <div
                  key={item.producto.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs"
                >
                  <div className="flex-1 pr-2">
                    <div className="font-semibold text-slate-900 leading-tight">
                      {item.producto.nombre}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      S/ {item.precioUnitario.toFixed(2)} c/u
                    </div>
                  </div>

                  {/* Controles de Cantidad */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-slate-200 bg-white rounded-md">
                      <button
                        onClick={() => handleModificarCantidad(item.producto.id, -1)}
                        className="p-1 hover:bg-slate-100 text-slate-600 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-mono font-bold text-slate-800">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() => handleModificarCantidad(item.producto.id, 1)}
                        className="p-1 hover:bg-slate-100 text-slate-600 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="w-16 text-right font-mono font-bold text-slate-900 tabular-nums">
                      S/ {item.subtotal.toFixed(2)}
                    </div>

                    <button
                      onClick={() => handleEliminarItem(item.producto.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Opciones de Facturación SUNAT & Pago */}
          {carrito.length > 0 && (
            <div className="pt-3 border-t border-slate-200 space-y-3">
              {/* Tipo de Comprobante */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide block mb-1">
                  Comprobante Electrónico SUNAT
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setTipoComprobante('boleta')}
                    className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                      tipoComprobante === 'boleta'
                        ? 'border-sky-600 bg-sky-50 text-sky-900 font-semibold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Boleta (B001)
                  </button>
                  <button
                    onClick={() => setTipoComprobante('factura')}
                    className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                      tipoComprobante === 'factura'
                        ? 'border-sky-600 bg-sky-50 text-sky-900 font-semibold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Factura (F001)
                  </button>
                  <button
                    onClick={() => setTipoComprobante('nota_venta')}
                    className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                      tipoComprobante === 'nota_venta'
                        ? 'border-sky-600 bg-sky-50 text-sky-900 font-semibold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Nota de Venta
                  </button>
                </div>
              </div>

              {/* Método de Pago Peruano */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide block mb-1">
                  Medio de Pago
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    onClick={() => setMetodoPago('yape')}
                    className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                      metodoPago === 'yape'
                        ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    Yape
                  </button>
                  <button
                    onClick={() => setMetodoPago('plin')}
                    className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                      metodoPago === 'plin'
                        ? 'border-sky-600 bg-sky-50 text-sky-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    Plin
                  </button>
                  <button
                    onClick={() => setMetodoPago('tarjeta')}
                    className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                      metodoPago === 'tarjeta'
                        ? 'border-sky-600 bg-sky-50 text-sky-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    Tarjeta
                  </button>
                  <button
                    onClick={() => setMetodoPago('efectivo')}
                    className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                      metodoPago === 'efectivo'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    Efectivo
                  </button>
                </div>
              </div>

              {/* Adelanto o Saldo a Contraentrega (Taller de Lentes) */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-800 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={esAdelanto}
                      onChange={(e) => setEsAdelanto(e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>Cobrar Adelanto (Saldo pendiente al recoger)</span>
                  </label>
                  {esAdelanto && (
                    <span className="text-[11px] font-mono text-amber-600 font-semibold">
                      Saldo: S/ {saldoPendiente.toFixed(2)}
                    </span>
                  )}
                </div>

                {esAdelanto && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-slate-500">Monto Adelanto: S/</span>
                    <input
                      type="number"
                      step="1"
                      value={montoAdelanto}
                      onChange={(e) => setMontoAdelanto(e.target.value)}
                      placeholder={(totalBruto * 0.5).toFixed(0)}
                      className="w-28 px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono font-bold text-slate-900"
                    />
                  </div>
                )}

                {/* Generar Orden de Taller automáticamente */}
                <div className="pt-1 border-t border-slate-200">
                  <label className="text-xs text-slate-700 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={crearOrdenTaller}
                      onChange={(e) => setCrearOrdenTaller(e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>Generar Orden de Taller / Montaje de Lunas (OT)</span>
                  </label>
                </div>
              </div>

              {/* Resumen Financiero con IGV 18% */}
              <div className="space-y-1.5 pt-2 text-xs">
                <div className="flex justify-between text-slate-500 font-mono">
                  <span>Op. Gravada:</span>
                  <span className="tabular-nums">S/ {subtotalGravado.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-mono">
                  <span>IGV (18%):</span>
                  <span className="tabular-nums">S/ {igv18.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 font-mono pt-1 border-t border-slate-200">
                  <span>Total a Pagar:</span>
                  <span className="tabular-nums text-sky-950">S/ {totalBruto.toFixed(2)}</span>
                </div>
              </div>

              {/* Botón de Emisión SUNAT */}
              <button
                onClick={handleProcesarVenta}
                disabled={procesandoVenta}
                className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-semibold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {procesandoVenta ? (
                  <span>Emitiendo a SUNAT...</span>
                ) : (
                  <>
                    <FileCheck2 className="w-4 h-4" />
                    <span>
                      {esAdelanto
                        ? `Emitir y Cobrar Adelanto S/ ${adelantoNum.toFixed(2)}`
                        : `Emitir Comprobante SUNAT (S/ ${totalBruto.toFixed(2)})`}
                    </span>
                  </>
                )}
              </button>

              {mensajeExito && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{mensajeExito}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Registro Rápido de Cliente */}
      {modalNuevoCliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Registrar Cliente en Óptica
            </h3>
            <form onSubmit={handleCrearClienteRapido} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Doc.</label>
                  <select
                    value={nuevoDocTipo}
                    onChange={(e) => setNuevoDocTipo(e.target.value as 'DNI' | 'RUC')}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-slate-50"
                  >
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-600 block mb-1">Número</label>
                  <input
                    type="text"
                    required
                    value={nuevoDocNum}
                    onChange={(e) => setNuevoDocNum(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg font-mono"
                    placeholder="45892104"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">
                  Nombres o Razón Social
                </label>
                <input
                  type="text"
                  required
                  value={nuevoNombres}
                  onChange={(e) => setNuevoNombres(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                  placeholder="Valeria Patricia"
                />
              </div>

              {nuevoDocTipo === 'DNI' && (
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Apellidos</label>
                  <input
                    type="text"
                    value={nuevoApellidos}
                    onChange={(e) => setNuevoApellidos(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                    placeholder="Torres Quispe"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Celular</label>
                  <input
                    type="text"
                    value={nuevoTelefono}
                    onChange={(e) => setNuevoTelefono(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg font-mono"
                    placeholder="984 123 456"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Email</label>
                  <input
                    type="email"
                    value={nuevoEmail}
                    onChange={(e) => setNuevoEmail(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                    placeholder="valeria@gmail.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">Dirección Fiscal / Domicilio</label>
                <input
                  type="text"
                  value={nuevoDireccion}
                  onChange={(e) => setNuevoDireccion(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                  placeholder="Av. Larco 450, Miraflores, Lima"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalNuevoCliente(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors"
                >
                  Guardar y Seleccionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
