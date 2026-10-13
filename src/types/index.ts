/**
 * Definiciones de Tipos para OptiKallpa - Gestión Óptica & Facturación SUNAT
 */

export type CategoriaProducto = 'montura' | 'luna' | 'lente_contacto' | 'accesorio' | 'servicio';

export type TipoDocumentoIdentidad = 'DNI' | 'RUC' | 'CE' | 'PAS';

export type TipoComprobante = 'boleta' | 'factura' | 'nota_venta';

export type MetodoPago = 'yape' | 'plin' | 'tarjeta' | 'efectivo' | 'transferencia' | 'mixto';

export type EstadoOrdenLaboratorio = 'en_taller' | 'en_control_calidad' | 'listo_entrega' | 'entregado';

export type EstadoSunat = 'ACEPTADO' | 'PENDIENTE' | 'RECHAZADO' | 'DE_BAJA';

export type EstadoPago = 'pagado' | 'adelanto';

export interface GraduacionOjo {
  esfera: string;      // ej: "-2.50", "+1.75"
  cilindro: string;    // ej: "-0.75"
  eje: string;         // ej: "180", "90"
  adicion: string;     // ej: "+2.00"
  av: string;          // Agudeza visual: "20/20", "20/40"
  dnp: string;         // Distancia Naso-Pupilar en mm (ej: "31.5")
  altura: string;      // Altura focal en mm para progresivos (ej: "18")
}

export interface RecetaOftalmica {
  id: string;
  clienteId: string;
  fecha: string;
  optometrista: string;
  numeroColegiatura?: string;
  od: GraduacionOjo;
  oi: GraduacionOjo;
  tipoLente: 'Monofocal Lejos' | 'Monofocal Cerca' | 'Bifocal Flat-Top' | 'Progresivo Digital' | 'Lente de Contacto';
  tratamiento: 'Antirreflejo HMC' | 'Filtro Azul UV420' | 'Fotocromático Transitions' | 'Policarbonato' | 'Resina Alto Índice 1.67';
  observaciones?: string;
  vigenciaMeses: number;
}

export interface Cliente {
  id: string;
  tipoDocumento: TipoDocumentoIdentidad;
  numeroDocumento: string; // DNI 8 dígitos, RUC 11 dígitos
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  direccion: string;
  departamento?: string;
  ciudad?: string;
  fechaNacimiento?: string;
  ocupacion?: string;
  recetas: RecetaOftalmica[];
  totalCompras: number;
  saldoPendiente: number;
  creadoEn: string;
}

export interface Producto {
  id: string;
  codigo: string;          // SKU o Código de barras (ej: "MON-RB-5154")
  nombre: string;
  categoria: CategoriaProducto;
  marca: string;
  modelo?: string;
  color?: string;
  material?: string;       // "Acetato", "Titanio", "Metal", "TR90", "Policarbonato"
  calibre?: string;        // ej: "51-21-145"
  stock: number;
  stockMinimo: number;
  precioCosto: number;     // En Soles S/.
  precioVenta: number;     // En Soles S/. con IGV
  codigoSunat?: string;    // Código estándar SUNAT productos (ej: "42142902")
  imagenUrl?: string;
}

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  recetaOftalmica?: RecetaOftalmica;
  notasLunas?: string;
}

export interface PedidoLaboratorio {
  id: string;
  codigoOrden: string;      // ej: "OT-2026-0089"
  ventaId: string;
  clienteId: string;
  clienteNombre: string;
  clienteTelefono: string;
  receta: RecetaOftalmica;
  monturaDetalle: string;   // ej: "Ray-Ban Clubmaster Negro 51mm"
  lunasDetalle: string;     // ej: "Policarbonato Blue Defense antirreflejo"
  laboratorioNombre: string;// ej: "Laboratorio Óptico Rodenstock Perú"
  fechaIngreso: string;
  fechaPrometida: string;
  fechaEntregaReal?: string;
  estado: EstadoOrdenLaboratorio;
  costoLaboratorio: number;
  montoVentaTotal: number;
  adelantoPagado: number;
  saldoPorCobrar: number;
  notas: string;
}

export interface ComprobanteSunat {
  id: string;
  ventaId: string;
  tipoComprobante: TipoComprobante;
  serie: string;             // "B001", "F001"
  correlativo: string;       // "00004521"
  numeroCompleto: string;    // "B001-00004521"
  fechaEmision: string;
  horaEmision: string;
  emisorRuc: string;
  emisorRazonSocial: string;
  emisorDireccion: string;
  clienteTipoDoc: TipoDocumentoIdentidad;
  clienteNumeroDoc: string;
  clienteNombre: string;
  clienteDireccion: string;
  moneda: 'PEN';
  subtotalGravado: number;   // Base imponible
  igv: number;               // 18%
  total: number;             // Total a pagar
  estadoSunat: EstadoSunat;
  hashCdr: string;
  codigoRespuesta: string;   // "0" = Aceptado
  mensajeRespuesta: string;  // "La Boleta número B001-00004521 ha sido aceptada"
  xmlFirmadoUbl: string;
  codigoQr: string;
}

export interface Venta {
  id: string;
  serieNumero: string;
  tipoComprobante: TipoComprobante;
  fecha: string;
  clienteId: string;
  clienteNombre: string;
  clienteDocumento: string;
  items: {
    productoId: string;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }[];
  subtotal: number;
  igv: number;
  total: number;
  metodoPago: MetodoPago;
  referenciaPago?: string;   // Nro operación Yape/Plin o voucher POS
  estadoPago: EstadoPago;
  adelantoMonto: number;
  saldoMonto: number;
  comprobanteSunat?: ComprobanteSunat;
  pedidoLaboratorioId?: string;
}

export interface Proveedor {
  id: string;
  ruc: string;
  razonSocial: string;
  nombreContacto: string;
  telefono: string;
  email: string;
  direccion: string;
  especialidad: 'monturas' | 'laboratorio_lunas' | 'lentes_contacto' | 'insumos';
  totalCompras: number;
}

export interface CompraProveedor {
  id: string;
  proveedorId: string;
  proveedorRazonSocial: string;
  proveedorRuc: string;
  numeroComprobante: string; // ej: "F002-0004512"
  fecha: string;
  subtotal: number;
  igv: number;
  total: number;
  estadoPago: 'pagado' | 'pendiente';
  items: {
    productoId: string;
    nombre: string;
    cantidad: number;
    costoUnitario: number;
    subtotal: number;
  }[];
}

export interface ReporteFinancieroResumen {
  periodo: string;
  ingresosTotales: number;
  egresosTotales: number;
  utilidadBruta: number;
  margenPorcentaje: number;
  cuentasPorCobrarClientes: number;
  cuentasPorPagarProveedores: number;
  ticketPromedio: number;
  totalVentasContador: number;
  ventasPorCategoria: {
    categoria: string;
    monto: number;
    porcentaje: number;
  }[];
  ventasPorMetodoPago: {
    metodo: MetodoPago;
    monto: number;
    conteo: number;
  }[];
  flujoMensual: {
    mes: string;
    ingresos: number;
    egresos: number;
  }[];
}
