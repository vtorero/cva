/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Centralized API Service for OptiKallpa
 * Designed for seamless integration with Slim 4 (PHP) & MySQL.
 * Provides fast indexed caching, client-side debounce search,
 * and realistic Peruvian SUNAT electronic billing UBL 2.1 generator.
 */

import {
  Cliente,
  Producto,
  Venta,
  PedidoLaboratorio,
  ComprobanteSunat,
  Proveedor,
  CompraProveedor,
  ReporteFinancieroResumen,
  RecetaOftalmica,
  MetodoPago,
  TipoComprobante,
  EstadoOrdenLaboratorio,
  ItemCarrito
} from '../types';

export interface ApiClientConfig {
  baseUrl: string;
  mode: 'local_storage' | 'remote_slim4';
  jwtToken?: string;
  timeoutMs: number;
  emisorRuc: string;
  emisorRazonSocial: string;
  emisorDireccion: string;
}

const STORAGE_KEYS = {
  CONFIG: 'optikallpa_config_v1',
  PRODUCTOS: 'optikallpa_productos_v1',
  CLIENTES: 'optikallpa_clientes_v1',
  VENTAS: 'optikallpa_ventas_v1',
  PEDIDOS: 'optikallpa_pedidos_v1',
  COMPROBANTES: 'optikallpa_comprobantes_v1',
  PROVEEDORES: 'optikallpa_proveedores_v1',
  COMPRAS: 'optikallpa_compras_v1'
};

const DEFAULT_CONFIG: ApiClientConfig = {
  baseUrl: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SLIM_API_URL) || 'http://localhost:8080/api/v1',
  mode: 'local_storage',
  timeoutMs: 5000,
  emisorRuc: '20608945123',
  emisorRazonSocial: 'ÓPTICA KALLPA VISIÓN PERÚ S.A.C.',
  emisorDireccion: 'Av. Larco 450, Miraflores, Lima - Perú'
};

// Seed initial realistic Peruvian Optical dataset
const INITIAL_PROVEEDORES: Proveedor[] = [
  {
    id: 'prov-1',
    ruc: '20100142981',
    razonSocial: 'ESSILOR LUXOTTICA PERÚ S.A.C.',
    nombreContacto: 'Carlos Mendoza',
    telefono: '+51 987 654 321',
    email: 'pedidos@essilor.com.pe',
    direccion: 'Av. Javier Prado Este 4200, Surco, Lima',
    especialidad: 'monturas',
    totalCompras: 14200
  },
  {
    id: 'prov-2',
    ruc: '20512894101',
    razonSocial: 'RODENSTOCK DEL PERÚ S.A.',
    nombreContacto: 'Maritza Paredes',
    telefono: '+51 993 112 455',
    email: 'laboratorio@rodenstock.pe',
    direccion: 'Calle Los Negocios 182, Surquillo, Lima',
    especialidad: 'laboratorio_lunas',
    totalCompras: 9800
  },
  {
    id: 'prov-3',
    ruc: '20492817263',
    razonSocial: 'COOPERVISION PERÚ DISTRIBUIDORA',
    nombreContacto: 'Jorge Valdivia',
    telefono: '+51 971 889 021',
    email: 'ventas@coopervision.pe',
    direccion: 'Av. Benavides 1540, Miraflores, Lima',
    especialidad: 'lentes_contacto',
    totalCompras: 5400
  }
];

const INITIAL_PRODUCTOS: Producto[] = [
  {
    id: 'prod-1',
    codigo: 'MON-RB-5154',
    nombre: 'Montura Ray-Ban Clubmaster Optics',
    categoria: 'montura',
    marca: 'Ray-Ban',
    modelo: 'RX5154',
    color: 'Negro con Dorado',
    material: 'Acetato / Metal',
    calibre: '51-21-145',
    stock: 14,
    stockMinimo: 4,
    precioCosto: 240,
    precioVenta: 480,
    codigoSunat: '42142902'
  },
  {
    id: 'prod-2',
    codigo: 'MON-OAK-8050',
    nombre: 'Montura Oakley Pitchman R Carbon',
    categoria: 'montura',
    marca: 'Oakley',
    modelo: 'OX8050',
    color: 'Satin Black',
    material: 'O-Matter y Varillas Carbono',
    calibre: '50-19-140',
    stock: 9,
    stockMinimo: 3,
    precioCosto: 290,
    precioVenta: 560,
    codigoSunat: '42142902'
  },
  {
    id: 'prod-3',
    codigo: 'MON-VOG-5211',
    nombre: 'Montura Vogue Eyewear Cat-Eye Fémina',
    categoria: 'montura',
    marca: 'Vogue',
    modelo: 'VO5211',
    color: 'Carey Habana',
    material: 'Acetato Italiano',
    calibre: '52-17-140',
    stock: 18,
    stockMinimo: 5,
    precioCosto: 140,
    precioVenta: 290,
    codigoSunat: '42142902'
  },
  {
    id: 'prod-4',
    codigo: 'MON-TIT-FLX',
    nombre: 'Montura Titanio Memory Flex Ultraligera (Sin Marco)',
    categoria: 'montura',
    marca: 'Kallpa Titan',
    modelo: 'Air-Rim 01',
    color: 'Gris Grafito',
    material: 'Beta Titanio (Memory)',
    calibre: '53-18-142',
    stock: 6,
    stockMinimo: 3,
    precioCosto: 160,
    precioVenta: 340,
    codigoSunat: '42142902'
  },
  {
    id: 'prod-5',
    codigo: 'LUN-POL-BLU',
    nombre: 'Par Lunas Policarbonato Blue Defense UV420 + AR',
    categoria: 'luna',
    marca: 'Crizal / Prevencia',
    modelo: '1.59 Poly Blue Cut',
    material: 'Policarbonato Resistente a Impactos',
    stock: 45,
    stockMinimo: 10,
    precioCosto: 75,
    precioVenta: 180,
    codigoSunat: '42142901'
  },
  {
    id: 'prod-6',
    codigo: 'LUN-PROG-DIG',
    nombre: 'Par Lunas Progresivas Digitales Free-Form Fotocromáticas',
    categoria: 'luna',
    marca: 'Rodenstock',
    modelo: 'Progressive Pure Life 1.60',
    material: 'Resina Alto Índice 1.60 + Transitions',
    stock: 22,
    stockMinimo: 5,
    precioCosto: 280,
    precioVenta: 690,
    codigoSunat: '42142901'
  },
  {
    id: 'prod-7',
    codigo: 'LC-AIR-OPTX',
    nombre: 'Caja Lentes de Contacto Air Optix Plus HydraGlyde (6 Und)',
    categoria: 'lente_contacto',
    marca: 'Alcon',
    modelo: 'HydraGlyde Mensual',
    material: 'Lotrafilcon B Silicona Hidrogel',
    stock: 3,
    stockMinimo: 6, // Alerta stock bajo
    precioCosto: 95,
    precioVenta: 175,
    codigoSunat: '42142903'
  },
  {
    id: 'prod-8',
    codigo: 'LC-BIOF-TORIC',
    nombre: 'Caja Lentes de Contacto Biofinity Tóricas para Astigmatismo (6 Und)',
    categoria: 'lente_contacto',
    marca: 'CooperVision',
    modelo: 'Biofinity Toric Mensual',
    material: 'Comfilcon A',
    stock: 12,
    stockMinimo: 4,
    precioCosto: 125,
    precioVenta: 220,
    codigoSunat: '42142903'
  },
  {
    id: 'prod-9',
    codigo: 'ACC-SOL-RENU',
    nombre: 'Solución Multipropósito Renu Fresh 355ml + Estuche',
    categoria: 'accesorio',
    marca: 'Bausch & Lomb',
    stock: 28,
    stockMinimo: 8,
    precioCosto: 22,
    precioVenta: 45,
    codigoSunat: '42142904'
  },
  {
    id: 'prod-10',
    codigo: 'SRV-EXAM-COMP',
    nombre: 'Examen de Refracción Computarizado & Salud Ocular',
    categoria: 'servicio',
    marca: 'OptiKallpa Clínic',
    stock: 999,
    stockMinimo: 0,
    precioCosto: 0,
    precioVenta: 50,
    codigoSunat: '85121800'
  }
];

const INITIAL_CLIENTES: Cliente[] = [
  {
    id: 'cli-1',
    tipoDocumento: 'DNI',
    numeroDocumento: '45892104',
    nombres: 'Valeria Patricia',
    apellidos: 'Torres Quispe',
    telefono: '+51 984 123 456',
    email: 'valeria.torres@gmail.com',
    direccion: 'Av. Pardo 620 Dpto 402, Miraflores',
    ciudad: 'Lima',
    fechaNacimiento: '1992-05-14',
    ocupacion: 'Arquitecta / Diseñadora',
    totalCompras: 1040,
    saldoPendiente: 0,
    creadoEn: '2026-08-10',
    recetas: [
      {
        id: 'rec-1',
        clienteId: 'cli-1',
        fecha: '2026-10-02',
        optometrista: 'Lic. Optom. Daniel Alarcón',
        numeroColegiatura: 'CTO 0842-PE',
        tipoLente: 'Monofocal Lejos',
        tratamiento: 'Filtro Azul UV420',
        vigenciaMeses: 12,
        observaciones: 'Paciente refiere fatiga visual frente a pantallas 8hrs al día.',
        od: {
          esfera: '-2.25',
          cilindro: '-0.75',
          eje: '175',
          adicion: '',
          av: '20/20',
          dnp: '31.5',
          altura: '18'
        },
        oi: {
          esfera: '-2.00',
          cilindro: '-0.50',
          eje: '180',
          adicion: '',
          av: '20/20',
          dnp: '32.0',
          altura: '18'
        }
      }
    ]
  },
  {
    id: 'cli-2',
    tipoDocumento: 'DNI',
    numeroDocumento: '10745239',
    nombres: 'Gustavo Adolfo',
    apellidos: 'Zevallos Rivas',
    telefono: '+51 992 458 190',
    email: 'gustavo.zevallos@outlook.com',
    direccion: 'Calle Los Sauces 145, San Isidro',
    ciudad: 'Lima',
    fechaNacimiento: '1970-11-23',
    ocupacion: 'Ingeniero Consultor',
    totalCompras: 1250,
    saldoPendiente: 250, // Saldo pendiente al recoger
    creadoEn: '2026-09-18',
    recetas: [
      {
        id: 'rec-2',
        clienteId: 'cli-2',
        fecha: '2026-10-10',
        optometrista: 'Lic. Optom. Daniel Alarcón',
        numeroColegiatura: 'CTO 0842-PE',
        tipoLente: 'Progresivo Digital',
        tratamiento: 'Fotocromático Transitions',
        vigenciaMeses: 12,
        observaciones: 'Presbicia moderada con hipermetropía leve. Requiere progresivo pasillo suave.',
        od: {
          esfera: '+1.50',
          cilindro: '-0.50',
          eje: '90',
          adicion: '+2.00',
          av: '20/25',
          dnp: '32.5',
          altura: '19'
        },
        oi: {
          esfera: '+1.75',
          cilindro: '-0.75',
          eje: '85',
          adicion: '+2.00',
          av: '20/25',
          dnp: '32.0',
          altura: '19'
        }
      }
    ]
  },
  {
    id: 'cli-3',
    tipoDocumento: 'RUC',
    numeroDocumento: '20601284915',
    nombres: 'CONSULTORÍA & SERVICIOS INTEGRALES S.A.C.',
    apellidos: '',
    telefono: '+51 970 334 112',
    email: 'administracion@consultoriaperu.com',
    direccion: 'Av. República de Panamá 3591 Of 801, San Isidro',
    ciudad: 'Lima',
    fechaNacimiento: '',
    ocupacion: 'Corporativo',
    totalCompras: 2180,
    saldoPendiente: 0,
    creadoEn: '2026-09-25',
    recetas: []
  }
];

const INITIAL_PEDIDOS: PedidoLaboratorio[] = [
  {
    id: 'ped-1',
    codigoOrden: 'OT-2026-0042',
    ventaId: 'ven-2',
    clienteId: 'cli-2',
    clienteNombre: 'Gustavo Adolfo Zevallos Rivas',
    clienteTelefono: '+51 992 458 190',
    receta: INITIAL_CLIENTES[1].recetas[0],
    monturaDetalle: 'Montura Oakley Pitchman R Carbon (Negro)',
    lunasDetalle: 'Lunas Progresivas Digitales Free-Form Transitions Gen 8 1.60',
    laboratorioNombre: 'Laboratorio Óptico Rodenstock Perú',
    fechaIngreso: '2026-10-10',
    fechaPrometida: '2026-10-15',
    estado: 'en_taller',
    costoLaboratorio: 280,
    montoVentaTotal: 1250,
    adelantoPagado: 1000,
    saldoPorCobrar: 250,
    notas: 'Centrado exacto pupilar con altura 19mm. Biselado ranurado suave.'
  },
  {
    id: 'ped-2',
    codigoOrden: 'OT-2026-0041',
    ventaId: 'ven-1',
    clienteId: 'cli-1',
    clienteNombre: 'Valeria Patricia Torres Quispe',
    clienteTelefono: '+51 984 123 456',
    receta: INITIAL_CLIENTES[0].recetas[0],
    monturaDetalle: 'Montura Ray-Ban Clubmaster RX5154 Negro/Dorado',
    lunasDetalle: 'Policarbonato Blue Defense UV420 con Tratamiento Antirreflejo HMC',
    laboratorioNombre: 'Laboratorio Óptico Central Lima',
    fechaIngreso: '2026-10-02',
    fechaPrometida: '2026-10-06',
    fechaEntregaReal: '2026-10-06',
    estado: 'entregado',
    costoLaboratorio: 75,
    montoVentaTotal: 660,
    adelantoPagado: 660,
    saldoPorCobrar: 0,
    notas: 'Entrega conforme con estuche original y paño microfibra.'
  }
];

const INITIAL_COMPROBANTES: ComprobanteSunat[] = [
  {
    id: 'sunat-1',
    ventaId: 'ven-1',
    tipoComprobante: 'boleta',
    serie: 'B001',
    correlativo: '00004521',
    numeroCompleto: 'B001-00004521',
    fechaEmision: '2026-10-02',
    horaEmision: '16:42:10',
    emisorRuc: '20608945123',
    emisorRazonSocial: 'ÓPTICA KALLPA VISIÓN PERÚ S.A.C.',
    emisorDireccion: 'Av. Larco 450, Miraflores, Lima - Perú',
    clienteTipoDoc: 'DNI',
    clienteNumeroDoc: '45892104',
    clienteNombre: 'Valeria Patricia Torres Quispe',
    clienteDireccion: 'Av. Pardo 620 Dpto 402, Miraflores',
    moneda: 'PEN',
    subtotalGravado: 559.32,
    igv: 100.68,
    total: 660.00,
    estadoSunat: 'ACEPTADO',
    hashCdr: 'gT59Vv8N+wK12pLMq3uXy98aBs4=',
    codigoRespuesta: '0',
    mensajeRespuesta: 'La Boleta número B001-00004521 ha sido aceptada por SUNAT.',
    xmlFirmadoUbl: `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>B001-00004521</cbc:ID>
  <cbc:IssueDate>2026-10-02</cbc:IssueDate>
  <cbc:IssueTime>16:42:10</cbc:IssueTime>
  <cbc:InvoiceTypeCode listID="0101">03</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>PEN</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="6">20608945123</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>ÓPTICA KALLPA VISIÓN PERÚ S.A.C.</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="1">45892104</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>Valeria Patricia Torres Quispe</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="PEN">100.68</cbc:TaxAmount>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="PEN">559.32</cbc:LineExtensionAmount>
    <cbc:TaxInclusiveAmount currencyID="PEN">660.00</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="PEN">660.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`,
    codigoQr: '20608945123|03|B001|00004521|100.68|660.00|2026-10-02|1|45892104|gT59Vv8N+wK12pLMq3uXy98aBs4='
  },
  {
    id: 'sunat-2',
    ventaId: 'ven-3',
    tipoComprobante: 'factura',
    serie: 'F001',
    correlativo: '00001205',
    numeroCompleto: 'F001-00001205',
    fechaEmision: '2026-09-25',
    horaEmision: '11:15:30',
    emisorRuc: '20608945123',
    emisorRazonSocial: 'ÓPTICA KALLPA VISIÓN PERÚ S.A.C.',
    emisorDireccion: 'Av. Larco 450, Miraflores, Lima - Perú',
    clienteTipoDoc: 'RUC',
    clienteNumeroDoc: '20601284915',
    clienteNombre: 'CONSULTORÍA & SERVICIOS INTEGRALES S.A.C.',
    clienteDireccion: 'Av. República de Panamá 3591 Of 801, San Isidro',
    moneda: 'PEN',
    subtotalGravado: 1847.46,
    igv: 332.54,
    total: 2180.00,
    estadoSunat: 'ACEPTADO',
    hashCdr: 'zL89Kj7M+xP54wQRs2vYx01aCd9=',
    codigoRespuesta: '0',
    mensajeRespuesta: 'La Factura número F001-00001205 ha sido aceptada por SUNAT.',
    xmlFirmadoUbl: `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:ID>F001-00001205</cbc:ID>
  <cbc:IssueDate>2026-09-25</cbc:IssueDate>
  <cbc:InvoiceTypeCode listID="0101">01</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>PEN</cbc:DocumentCurrencyCode>
  <cac:LegalMonetaryTotal>
    <cbc:PayableAmount currencyID="PEN">2180.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`,
    codigoQr: '20608945123|01|F001|00001205|332.54|2180.00|2026-09-25|6|20601284915|zL89Kj7M+xP54wQRs2vYx01aCd9='
  }
];

const INITIAL_VENTAS: Venta[] = [
  {
    id: 'ven-1',
    serieNumero: 'B001-00004521',
    tipoComprobante: 'boleta',
    fecha: '2026-10-02',
    clienteId: 'cli-1',
    clienteNombre: 'Valeria Patricia Torres Quispe',
    clienteDocumento: '45892104',
    items: [
      { productoId: 'prod-1', nombre: 'Montura Ray-Ban Clubmaster RX5154', cantidad: 1, precioUnitario: 480, subtotal: 480 },
      { productoId: 'prod-5', nombre: 'Par Lunas Policarbonato Blue Defense UV420', cantidad: 1, precioUnitario: 180, subtotal: 180 }
    ],
    subtotal: 559.32,
    igv: 100.68,
    total: 660.00,
    metodoPago: 'yape',
    referenciaPago: 'Op. Yape 884129',
    estadoPago: 'pagado',
    adelantoMonto: 660.00,
    saldoMonto: 0,
    comprobanteSunat: INITIAL_COMPROBANTES[0],
    pedidoLaboratorioId: 'ped-2'
  },
  {
    id: 'ven-2',
    serieNumero: 'B001-00004522',
    tipoComprobante: 'boleta',
    fecha: '2026-10-10',
    clienteId: 'cli-2',
    clienteNombre: 'Gustavo Adolfo Zevallos Rivas',
    clienteDocumento: '10745239',
    items: [
      { productoId: 'prod-2', nombre: 'Montura Oakley Pitchman R Carbon', cantidad: 1, precioUnitario: 560, subtotal: 560 },
      { productoId: 'prod-6', nombre: 'Par Lunas Progresivas Free-Form Transitions 1.60', cantidad: 1, precioUnitario: 690, subtotal: 690 }
    ],
    subtotal: 1059.32,
    igv: 190.68,
    total: 1250.00,
    metodoPago: 'tarjeta',
    referenciaPago: 'Izipay Ref #49021',
    estadoPago: 'adelanto',
    adelantoMonto: 1000.00,
    saldoMonto: 250.00,
    pedidoLaboratorioId: 'ped-1'
  },
  {
    id: 'ven-3',
    serieNumero: 'F001-00001205',
    tipoComprobante: 'factura',
    fecha: '2026-09-25',
    clienteId: 'cli-3',
    clienteNombre: 'CONSULTORÍA & SERVICIOS INTEGRALES S.A.C.',
    clienteDocumento: '20601284915',
    items: [
      { productoId: 'prod-3', nombre: 'Montura Vogue Eyewear Cat-Eye', cantidad: 4, precioUnitario: 290, subtotal: 1160 },
      { productoId: 'prod-4', nombre: 'Montura Titanio Memory Flex', cantidad: 3, precioUnitario: 340, subtotal: 1020 }
    ],
    subtotal: 1847.46,
    igv: 332.54,
    total: 2180.00,
    metodoPago: 'transferencia',
    referenciaPago: 'Transf BCP #990145',
    estadoPago: 'pagado',
    adelantoMonto: 2180.00,
    saldoMonto: 0,
    comprobanteSunat: INITIAL_COMPROBANTES[1]
  }
];

const INITIAL_COMPRAS: CompraProveedor[] = [
  {
    id: 'cmp-1',
    proveedorId: 'prov-1',
    proveedorRazonSocial: 'ESSILOR LUXOTTICA PERÚ S.A.C.',
    proveedorRuc: '20100142981',
    numeroComprobante: 'F002-004512',
    fecha: '2026-09-20',
    subtotal: 4237.29,
    igv: 762.71,
    total: 5000.00,
    estadoPago: 'pagado',
    items: [
      { productoId: 'prod-1', nombre: 'Montura Ray-Ban RX5154', cantidad: 10, costoUnitario: 240, subtotal: 2400 },
      { productoId: 'prod-2', nombre: 'Montura Oakley OX8050', cantidad: 5, costoUnitario: 290, subtotal: 1450 },
      { productoId: 'prod-3', nombre: 'Montura Vogue VO5211', cantidad: 8, costoUnitario: 140, subtotal: 1120 }
    ]
  },
  {
    id: 'cmp-2',
    proveedorId: 'prov-3',
    proveedorRazonSocial: 'COOPERVISION PERÚ DISTRIBUIDORA',
    proveedorRuc: '20492817263',
    numeroComprobante: 'F001-008920',
    fecha: '2026-10-05',
    subtotal: 1694.92,
    igv: 305.08,
    total: 2000.00,
    estadoPago: 'pendiente', // Cuenta por pagar
    items: [
      { productoId: 'prod-8', nombre: 'Biofinity Tóricas Caja 6', cantidad: 16, costoUnitario: 125, subtotal: 2000 }
    ]
  }
];

// Helper to access LocalStorage safely
function getStored<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultVal;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Error reading ${key} from storage:`, err);
    return defaultVal;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

// Ensure initial database seeds are placed in localStorage
function initializeDatabase(): void {
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTOS)) {
    setStored(STORAGE_KEYS.PRODUCTOS, INITIAL_PRODUCTOS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CLIENTES)) {
    setStored(STORAGE_KEYS.CLIENTES, INITIAL_CLIENTES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.VENTAS)) {
    setStored(STORAGE_KEYS.VENTAS, INITIAL_VENTAS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.PEDIDOS)) {
    setStored(STORAGE_KEYS.PEDIDOS, INITIAL_PEDIDOS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.COMPROBANTES)) {
    setStored(STORAGE_KEYS.COMPROBANTES, INITIAL_COMPROBANTES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.PROVEEDORES)) {
    setStored(STORAGE_KEYS.PROVEEDORES, INITIAL_PROVEEDORES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.COMPRAS)) {
    setStored(STORAGE_KEYS.COMPRAS, INITIAL_COMPRAS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
    setStored(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
  }
}

// Auto-run initialization
initializeDatabase();

/**
 * High-performance Centralized API Service for OptiKallpa
 */
export const api = {
  // Config & Status
  config: {
    get: (): ApiClientConfig => getStored(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG),
    update: (updates: Partial<ApiClientConfig>): ApiClientConfig => {
      const current = getStored(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
      const updated = { ...current, ...updates };
      setStored(STORAGE_KEYS.CONFIG, updated);
      return updated;
    },
    resetToDefault: (): void => {
      setStored(STORAGE_KEYS.PRODUCTOS, INITIAL_PRODUCTOS);
      setStored(STORAGE_KEYS.CLIENTES, INITIAL_CLIENTES);
      setStored(STORAGE_KEYS.VENTAS, INITIAL_VENTAS);
      setStored(STORAGE_KEYS.PEDIDOS, INITIAL_PEDIDOS);
      setStored(STORAGE_KEYS.COMPROBANTES, INITIAL_COMPROBANTES);
      setStored(STORAGE_KEYS.PROVEEDORES, INITIAL_PROVEEDORES);
      setStored(STORAGE_KEYS.COMPRAS, INITIAL_COMPRAS);
      setStored(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
    }
  },

  // 1. INVENTARIO & PRODUCTOS
  productos: {
    getAll: async (filters?: { busqueda?: string; categoria?: string; soloStockBajo?: boolean }): Promise<Producto[]> => {
      const items = getStored<Producto[]>(STORAGE_KEYS.PRODUCTOS, INITIAL_PRODUCTOS);
      let filtered = [...items];

      if (filters?.busqueda) {
        const query = filters.busqueda.toLowerCase().trim();
        filtered = filtered.filter(p =>
          p.nombre.toLowerCase().includes(query) ||
          p.codigo.toLowerCase().includes(query) ||
          p.marca.toLowerCase().includes(query) ||
          (p.modelo && p.modelo.toLowerCase().includes(query)) ||
          (p.material && p.material.toLowerCase().includes(query))
        );
      }

      if (filters?.categoria && filters.categoria !== 'todos') {
        filtered = filtered.filter(p => p.categoria === filters.categoria);
      }

      if (filters?.soloStockBajo) {
        filtered = filtered.filter(p => p.stock <= p.stockMinimo);
      }

      return filtered;
    },

    getById: async (id: string): Promise<Producto | null> => {
      const items = getStored<Producto[]>(STORAGE_KEYS.PRODUCTOS, INITIAL_PRODUCTOS);
      return items.find(p => p.id === id) || null;
    },

    create: async (data: Omit<Producto, 'id'>): Promise<Producto> => {
      const items = getStored<Producto[]>(STORAGE_KEYS.PRODUCTOS, INITIAL_PRODUCTOS);
      const newProduct: Producto = {
        ...data,
        id: `prod-${Date.now()}`
      };
      items.unshift(newProduct);
      setStored(STORAGE_KEYS.PRODUCTOS, items);
      return newProduct;
    },

    update: async (id: string, updates: Partial<Producto>): Promise<Producto> => {
      const items = getStored<Producto[]>(STORAGE_KEYS.PRODUCTOS, INITIAL_PRODUCTOS);
      const index = items.findIndex(p => p.id === id);
      if (index === -1) throw new Error('Producto no encontrado');
      items[index] = { ...items[index], ...updates };
      setStored(STORAGE_KEYS.PRODUCTOS, items);
      return items[index];
    },

    ajustarStock: async (id: string, delta: number): Promise<Producto> => {
      const items = getStored<Producto[]>(STORAGE_KEYS.PRODUCTOS, INITIAL_PRODUCTOS);
      const index = items.findIndex(p => p.id === id);
      if (index === -1) throw new Error('Producto no encontrado');
      const newStock = Math.max(0, items[index].stock + delta);
      items[index].stock = newStock;
      setStored(STORAGE_KEYS.PRODUCTOS, items);
      return items[index];
    },

    delete: async (id: string): Promise<boolean> => {
      const items = getStored<Producto[]>(STORAGE_KEYS.PRODUCTOS, INITIAL_PRODUCTOS);
      const filtered = items.filter(p => p.id !== id);
      setStored(STORAGE_KEYS.PRODUCTOS, filtered);
      return true;
    }
  },

  // 2. CLIENTES & RECETAS OFTALMOLÓGICAS
  clientes: {
    getAll: async (busqueda?: string): Promise<Cliente[]> => {
      const items = getStored<Cliente[]>(STORAGE_KEYS.CLIENTES, INITIAL_CLIENTES);
      if (!busqueda || !busqueda.trim()) return items;
      const q = busqueda.toLowerCase().trim();
      return items.filter(c =>
        c.numeroDocumento.includes(q) ||
        c.nombres.toLowerCase().includes(q) ||
        c.apellidos.toLowerCase().includes(q) ||
        c.telefono.includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    },

    getById: async (id: string): Promise<Cliente | null> => {
      const items = getStored<Cliente[]>(STORAGE_KEYS.CLIENTES, INITIAL_CLIENTES);
      return items.find(c => c.id === id) || null;
    },

    // Fast Peruvian DNI (8 digits) or RUC (11 digits) lookup
    consultarDocumento: async (tipo: 'DNI' | 'RUC', numero: string): Promise<{
      encontrado: boolean;
      data?: Partial<Cliente>;
      origen: 'BD_LOCAL' | 'PADRON_RENIEC_SUNAT';
    }> => {
      // 1. Check local database first
      const items = getStored<Cliente[]>(STORAGE_KEYS.CLIENTES, INITIAL_CLIENTES);
      const match = items.find(c => c.numeroDocumento === numero);
      if (match) {
        return { encontrado: true, data: match, origen: 'BD_LOCAL' };
      }

      // 2. Fast simulated RENIEC / SUNAT padrón lookup for testing
      if (tipo === 'DNI' && numero.length === 8) {
        // Mock RENIEC quick directory
        const mockNombres: Record<string, { nombres: string; apellidos: string }> = {
          '45892104': { nombres: 'Valeria Patricia', apellidos: 'Torres Quispe' },
          '10745239': { nombres: 'Gustavo Adolfo', apellidos: 'Zevallos Rivas' },
          '72349182': { nombres: 'Milagros Lucía', apellidos: 'Flores Benites' },
          '41893021': { nombres: 'Renato Alonso', apellidos: 'Cárdenas Silva' }
        };

        if (mockNombres[numero]) {
          return {
            encontrado: true,
            data: {
              tipoDocumento: 'DNI',
              numeroDocumento: numero,
              nombres: mockNombres[numero].nombres,
              apellidos: mockNombres[numero].apellidos,
              direccion: 'Lima, Perú'
            },
            origen: 'PADRON_RENIEC_SUNAT'
          };
        }
      } else if (tipo === 'RUC' && numero.length === 11) {
        if (numero === '20601284915') {
          return {
            encontrado: true,
            data: {
              tipoDocumento: 'RUC',
              numeroDocumento: numero,
              nombres: 'CONSULTORÍA & SERVICIOS INTEGRALES S.A.C.',
              apellidos: '',
              direccion: 'Av. República de Panamá 3591 Of 801, San Isidro, Lima'
            },
            origen: 'PADRON_RENIEC_SUNAT'
          };
        }
      }

      return { encontrado: false, origen: 'PADRON_RENIEC_SUNAT' };
    },

    create: async (data: Omit<Cliente, 'id' | 'recetas' | 'totalCompras' | 'saldoPendiente' | 'creadoEn'>): Promise<Cliente> => {
      const items = getStored<Cliente[]>(STORAGE_KEYS.CLIENTES, INITIAL_CLIENTES);
      const newClient: Cliente = {
        ...data,
        id: `cli-${Date.now()}`,
        recetas: [],
        totalCompras: 0,
        saldoPendiente: 0,
        creadoEn: new Date().toISOString().split('T')[0]
      };
      items.unshift(newClient);
      setStored(STORAGE_KEYS.CLIENTES, items);
      return newClient;
    },

    update: async (id: string, updates: Partial<Cliente>): Promise<Cliente> => {
      const items = getStored<Cliente[]>(STORAGE_KEYS.CLIENTES, INITIAL_CLIENTES);
      const idx = items.findIndex(c => c.id === id);
      if (idx === -1) throw new Error('Cliente no encontrado');
      items[idx] = { ...items[idx], ...updates };
      setStored(STORAGE_KEYS.CLIENTES, items);
      return items[idx];
    },

    agregarReceta: async (clienteId: string, recetaData: Omit<RecetaOftalmica, 'id' | 'clienteId'>): Promise<RecetaOftalmica> => {
      const items = getStored<Cliente[]>(STORAGE_KEYS.CLIENTES, INITIAL_CLIENTES);
      const client = items.find(c => c.id === clienteId);
      if (!client) throw new Error('Cliente no encontrado');

      const nuevaReceta: RecetaOftalmica = {
        ...recetaData,
        id: `rec-${Date.now()}`,
        clienteId
      };

      client.recetas = [nuevaReceta, ...(client.recetas || [])];
      setStored(STORAGE_KEYS.CLIENTES, items);
      return nuevaReceta;
    }
  },

  // 3. VENTAS & FACTURACIÓN ELECTRÓNICA SUNAT
  ventas: {
    getAll: async (): Promise<Venta[]> => {
      return getStored<Venta[]>(STORAGE_KEYS.VENTAS, INITIAL_VENTAS);
    },

    getById: async (id: string): Promise<Venta | null> => {
      const items = getStored<Venta[]>(STORAGE_KEYS.VENTAS, INITIAL_VENTAS);
      return items.find(v => v.id === id) || null;
    },

    crearVenta: async (params: {
      cliente: Cliente;
      items: ItemCarrito[];
      tipoComprobante: TipoComprobante;
      metodoPago: MetodoPago;
      referenciaPago?: string;
      adelantoMonto?: number;
      crearOrdenLaboratorio?: boolean;
      laboratorioNombre?: string;
      fechaPrometidaLaboratorio?: string;
      notasLaboratorio?: string;
      recetaAsociada?: RecetaOftalmica;
    }): Promise<{ venta: Venta; comprobante?: ComprobanteSunat; ordenLaboratorio?: PedidoLaboratorio }> => {
      const config = getStored(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
      const ventas = getStored<Venta[]>(STORAGE_KEYS.VENTAS, INITIAL_VENTAS);
      const comprobantes = getStored<ComprobanteSunat[]>(STORAGE_KEYS.COMPROBANTES, INITIAL_COMPROBANTES);
      const pedidos = getStored<PedidoLaboratorio[]>(STORAGE_KEYS.PEDIDOS, INITIAL_PEDIDOS);
      const productos = getStored<Producto[]>(STORAGE_KEYS.PRODUCTOS, INITIAL_PRODUCTOS);
      const clientes = getStored<Cliente[]>(STORAGE_KEYS.CLIENTES, INITIAL_CLIENTES);

      // 1. Calculate financials (18% IGV)
      const total = params.items.reduce((acc, it) => acc + it.subtotal, 0);
      const subtotal = Math.round((total / 1.18) * 100) / 100;
      const igv = Math.round((total - subtotal) * 100) / 100;

      const adelanto = params.adelantoMonto !== undefined ? params.adelantoMonto : total;
      const saldo = Math.max(0, Math.round((total - adelanto) * 100) / 100);
      const estadoPago = saldo === 0 ? 'pagado' : 'adelanto';

      // 2. Correlative numbering for SUNAT
      const isBoleta = params.tipoComprobante === 'boleta';
      const isFactura = params.tipoComprobante === 'factura';
      const prefix = isBoleta ? 'B001' : isFactura ? 'F001' : 'NV01';

      const prevSame = comprobantes.filter(c => c.serie === prefix);
      const nextCorrelativoNum = prevSame.length + 4523;
      const correlativoStr = String(nextCorrelativoNum).padStart(8, '0');
      const serieNumero = `${prefix}-${correlativoStr}`;

      const ventaId = `ven-${Date.now()}`;
      const now = new Date();
      const fechaHoy = now.toISOString().split('T')[0];
      const horaActual = now.toTimeString().split(' ')[0];

      // 3. Generate electronic SUNAT voucher if Boleta or Factura
      let nuevoComprobante: ComprobanteSunat | undefined;

      if (isBoleta || isFactura) {
        // Hash calculation
        const hashSeed = `${config.emisorRuc}|${isBoleta ? '03' : '01'}|${prefix}|${correlativoStr}|${total}|${fechaHoy}`;
        const simulatedHash = btoa(hashSeed).substring(0, 24) + '=';

        const xmlUbl = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent>
        <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="SignKallpa">
          <ds:SignedInfo>
            <ds:DigestValue>${simulatedHash}</ds:DigestValue>
          </ds:SignedInfo>
          <ds:SignatureValue>MIIEvwYJKoZIhvcNAQcCoIIEsDCCB...[Firma Certificado Digital Sunat]...</ds:SignatureValue>
        </ds:Signature>
      </ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>${serieNumero}</cbc:ID>
  <cbc:IssueDate>${fechaHoy}</cbc:IssueDate>
  <cbc:IssueTime>${horaActual}</cbc:IssueTime>
  <cbc:InvoiceTypeCode listID="0101">${isBoleta ? '03' : '01'}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>PEN</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="6">${config.emisorRuc}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${config.emisorRazonSocial}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="${params.cliente.tipoDocumento === 'RUC' ? '6' : '1'}">${params.cliente.numeroDocumento}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${params.cliente.nombres} ${params.cliente.apellidos}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="PEN">${igv.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="PEN">${subtotal.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="PEN">${igv.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:ID>1000</cbc:ID>
          <cbc:Name>IGV</cbc:Name>
          <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="PEN">${subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxInclusiveAmount currencyID="PEN">${total.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="PEN">${total.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;

        const qrText = `${config.emisorRuc}|${isBoleta ? '03' : '01'}|${prefix}|${correlativoStr}|${igv.toFixed(2)}|${total.toFixed(2)}|${fechaHoy}|${params.cliente.tipoDocumento === 'RUC' ? '6' : '1'}|${params.cliente.numeroDocumento}|${simulatedHash}`;

        nuevoComprobante = {
          id: `sunat-${Date.now()}`,
          ventaId,
          tipoComprobante: params.tipoComprobante,
          serie: prefix,
          correlativo: correlativoStr,
          numeroCompleto: serieNumero,
          fechaEmision: fechaHoy,
          horaEmision: horaActual,
          emisorRuc: config.emisorRuc,
          emisorRazonSocial: config.emisorRazonSocial,
          emisorDireccion: config.emisorDireccion,
          clienteTipoDoc: params.cliente.tipoDocumento,
          clienteNumeroDoc: params.cliente.numeroDocumento,
          clienteNombre: `${params.cliente.nombres} ${params.cliente.apellidos}`.trim(),
          clienteDireccion: params.cliente.direccion || 'Lima, Perú',
          moneda: 'PEN',
          subtotalGravado: subtotal,
          igv,
          total,
          estadoSunat: 'ACEPTADO',
          hashCdr: simulatedHash,
          codigoRespuesta: '0',
          mensajeRespuesta: `El comprobante ${serieNumero} ha sido aceptado por SUNAT exitosamente.`,
          xmlFirmadoUbl: xmlUbl,
          codigoQr: qrText
        };

        comprobantes.unshift(nuevoComprobante);
        setStored(STORAGE_KEYS.COMPROBANTES, comprobantes);
      }

      // 4. Create Optical Laboratory Job Order if requested (montura + lunas biseladas)
      let nuevaOrdenLab: PedidoLaboratorio | undefined;
      const tieneLunas = params.items.some(i => i.producto.categoria === 'luna' || i.producto.categoria === 'montura');

      if (params.crearOrdenLaboratorio || (tieneLunas && params.recetaAsociada)) {
        const ordenCorrelativo = pedidos.length + 43;
        const codigoOrden = `OT-2026-${String(ordenCorrelativo).padStart(4, '0')}`;

        const monturaItem = params.items.find(i => i.producto.categoria === 'montura');
        const lunasItem = params.items.find(i => i.producto.categoria === 'luna');

        nuevaOrdenLab = {
          id: `ped-${Date.now()}`,
          codigoOrden,
          ventaId,
          clienteId: params.cliente.id,
          clienteNombre: `${params.cliente.nombres} ${params.cliente.apellidos}`.trim(),
          clienteTelefono: params.cliente.telefono || '-',
          receta: params.recetaAsociada || params.cliente.recetas[0] || {
            id: 'rec-temp',
            clienteId: params.cliente.id,
            fecha: fechaHoy,
            optometrista: 'Lic. Optometría',
            tipoLente: 'Monofocal Lejos',
            tratamiento: 'Antirreflejo HMC',
            vigenciaMeses: 12,
            od: { esfera: '0.00', cilindro: '0.00', eje: '0', adicion: '', av: '20/20', dnp: '32', altura: '18' },
            oi: { esfera: '0.00', cilindro: '0.00', eje: '0', adicion: '', av: '20/20', dnp: '32', altura: '18' }
          },
          monturaDetalle: monturaItem ? `${monturaItem.producto.marca} ${monturaItem.producto.nombre}` : 'Montura propia del cliente',
          lunasDetalle: lunasItem ? lunasItem.producto.nombre : 'Lunas de refracción oftálmica personalizada',
          laboratorioNombre: params.laboratorioNombre || 'Laboratorio Óptico Rodenstock Perú',
          fechaIngreso: fechaHoy,
          fechaPrometida: params.fechaPrometidaLaboratorio || new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
          estado: 'en_taller',
          costoLaboratorio: lunasItem ? lunasItem.producto.precioCosto : 60,
          montoVentaTotal: total,
          adelantoPagado: adelanto,
          saldoPorCobrar: saldo,
          notas: params.notasLaboratorio || 'Biselado de precisión según DNP y altura pupilar.'
        };

        pedidos.unshift(nuevaOrdenLab);
        setStored(STORAGE_KEYS.PEDIDOS, pedidos);
      }

      // 5. Discount inventory stock
      for (const item of params.items) {
        const prod = productos.find(p => p.id === item.producto.id);
        if (prod && prod.categoria !== 'servicio') {
          prod.stock = Math.max(0, prod.stock - item.cantidad);
        }
      }
      setStored(STORAGE_KEYS.PRODUCTOS, productos);

      // 6. Update client balance and purchases
      const clientIdx = clientes.findIndex(c => c.id === params.cliente.id);
      if (clientIdx !== -1) {
        clientes[clientIdx].totalCompras += total;
        clientes[clientIdx].saldoPendiente += saldo;
        setStored(STORAGE_KEYS.CLIENTES, clientes);
      }

      // 7. Store sale record
      const nuevaVenta: Venta = {
        id: ventaId,
        serieNumero,
        tipoComprobante: params.tipoComprobante,
        fecha: fechaHoy,
        clienteId: params.cliente.id,
        clienteNombre: `${params.cliente.nombres} ${params.cliente.apellidos}`.trim(),
        clienteDocumento: params.cliente.numeroDocumento,
        items: params.items.map(it => ({
          productoId: it.producto.id,
          nombre: it.producto.nombre,
          cantidad: it.cantidad,
          precioUnitario: it.precioUnitario,
          subtotal: it.subtotal
        })),
        subtotal,
        igv,
        total,
        metodoPago: params.metodoPago,
        referenciaPago: params.referenciaPago,
        estadoPago,
        adelantoMonto: adelanto,
        saldoMonto: saldo,
        comprobanteSunat: nuevoComprobante,
        pedidoLaboratorioId: nuevaOrdenLab?.id
      };

      ventas.unshift(nuevaVenta);
      setStored(STORAGE_KEYS.VENTAS, ventas);

      return {
        venta: nuevaVenta,
        comprobante: nuevoComprobante,
        ordenLaboratorio: nuevaOrdenLab
      };
    },

    cobrarSaldo: async (ventaId: string, montoCobrado: number, metodo: MetodoPago): Promise<Venta> => {
      const ventas = getStored<Venta[]>(STORAGE_KEYS.VENTAS, INITIAL_VENTAS);
      const clientes = getStored<Cliente[]>(STORAGE_KEYS.CLIENTES, INITIAL_CLIENTES);
      const pedidos = getStored<PedidoLaboratorio[]>(STORAGE_KEYS.PEDIDOS, INITIAL_PEDIDOS);

      const vIdx = ventas.findIndex(v => v.id === ventaId);
      if (vIdx === -1) throw new Error('Venta no encontrada');

      const venta = ventas[vIdx];
      const nuevoSaldo = Math.max(0, Math.round((venta.saldoMonto - montoCobrado) * 100) / 100);

      venta.saldoMonto = nuevoSaldo;
      venta.adelantoMonto += montoCobrado;
      if (nuevoSaldo === 0) {
        venta.estadoPago = 'pagado';
      }

      // Update associated client
      const cIdx = clientes.findIndex(c => c.id === venta.clienteId);
      if (cIdx !== -1) {
        clientes[cIdx].saldoPendiente = Math.max(0, clientes[cIdx].saldoPendiente - montoCobrado);
        setStored(STORAGE_KEYS.CLIENTES, clientes);
      }

      // Update associated lab order
      if (venta.pedidoLaboratorioId) {
        const pIdx = pedidos.findIndex(p => p.id === venta.pedidoLaboratorioId);
        if (pIdx !== -1) {
          pedidos[pIdx].saldoPorCobrar = nuevoSaldo;
          pedidos[pIdx].adelantoPagado += montoCobrado;
          setStored(STORAGE_KEYS.PEDIDOS, pedidos);
        }
      }

      setStored(STORAGE_KEYS.VENTAS, ventas);
      return venta;
    }
  },

  // 4. FACTURACIÓN ELECTRÓNICA SUNAT
  sunat: {
    getComprobantes: async (filters?: { estado?: string; tipo?: string; busqueda?: string }): Promise<ComprobanteSunat[]> => {
      let items = getStored<ComprobanteSunat[]>(STORAGE_KEYS.COMPROBANTES, INITIAL_COMPROBANTES);

      if (filters?.estado && filters.estado !== 'todos') {
        items = items.filter(c => c.estadoSunat === filters.estado);
      }

      if (filters?.tipo && filters.tipo !== 'todos') {
        items = items.filter(c => c.tipoComprobante === filters.tipo);
      }

      if (filters?.busqueda) {
        const q = filters.busqueda.toLowerCase().trim();
        items = items.filter(c =>
          c.numeroCompleto.toLowerCase().includes(q) ||
          c.clienteNumeroDoc.includes(q) ||
          c.clienteNombre.toLowerCase().includes(q)
        );
      }

      return items;
    },

    consultarEstado: async (id: string): Promise<ComprobanteSunat> => {
      const items = getStored<ComprobanteSunat[]>(STORAGE_KEYS.COMPROBANTES, INITIAL_COMPROBANTES);
      const c = items.find(it => it.id === id);
      if (!c) throw new Error('Comprobante no encontrado');

      // Refresh simulated verification with SUNAT OSE
      c.estadoSunat = 'ACEPTADO';
      c.codigoRespuesta = '0';
      c.mensajeRespuesta = `Validado con éxito en Servidor SUNAT: El comprobante ${c.numeroCompleto} se encuentra ACEPTADO y con validez tributaria.`;
      setStored(STORAGE_KEYS.COMPROBANTES, items);
      return c;
    },

    reenviarASunat: async (id: string): Promise<ComprobanteSunat> => {
      const items = getStored<ComprobanteSunat[]>(STORAGE_KEYS.COMPROBANTES, INITIAL_COMPROBANTES);
      const c = items.find(it => it.id === id);
      if (!c) throw new Error('Comprobante no encontrado');

      c.estadoSunat = 'ACEPTADO';
      c.codigoRespuesta = '0';
      c.mensajeRespuesta = `Envío exitoso: CDR recibido de SUNAT para ${c.numeroCompleto}.`;
      setStored(STORAGE_KEYS.COMPROBANTES, items);
      return c;
    }
  },

  // 5. PEDIDOS & TALLER / LABORATORIO
  pedidos: {
    getAll: async (estado?: EstadoOrdenLaboratorio | 'todos'): Promise<PedidoLaboratorio[]> => {
      const items = getStored<PedidoLaboratorio[]>(STORAGE_KEYS.PEDIDOS, INITIAL_PEDIDOS);
      if (!estado || estado === 'todos') return items;
      return items.filter(p => p.estado === estado);
    },

    actualizarEstado: async (id: string, nuevoEstado: EstadoOrdenLaboratorio): Promise<PedidoLaboratorio> => {
      const items = getStored<PedidoLaboratorio[]>(STORAGE_KEYS.PEDIDOS, INITIAL_PEDIDOS);
      const idx = items.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Pedido no encontrado');

      items[idx].estado = nuevoEstado;
      if (nuevoEstado === 'entregado' && !items[idx].fechaEntregaReal) {
        items[idx].fechaEntregaReal = new Date().toISOString().split('T')[0];
      }

      setStored(STORAGE_KEYS.PEDIDOS, items);
      return items[idx];
    }
  },

  // 6. PROVEEDORES & COMPRAS
  proveedores: {
    getAll: async (): Promise<Proveedor[]> => {
      return getStored<Proveedor[]>(STORAGE_KEYS.PROVEEDORES, INITIAL_PROVEEDORES);
    },

    create: async (data: Omit<Proveedor, 'id' | 'totalCompras'>): Promise<Proveedor> => {
      const items = getStored<Proveedor[]>(STORAGE_KEYS.PROVEEDORES, INITIAL_PROVEEDORES);
      const nuevo: Proveedor = {
        ...data,
        id: `prov-${Date.now()}`,
        totalCompras: 0
      };
      items.unshift(nuevo);
      setStored(STORAGE_KEYS.PROVEEDORES, items);
      return nuevo;
    }
  },

  compras: {
    getAll: async (): Promise<CompraProveedor[]> => {
      return getStored<CompraProveedor[]>(STORAGE_KEYS.COMPRAS, INITIAL_COMPRAS);
    },

    create: async (data: Omit<CompraProveedor, 'id'>): Promise<CompraProveedor> => {
      const compras = getStored<CompraProveedor[]>(STORAGE_KEYS.COMPRAS, INITIAL_COMPRAS);
      const productos = getStored<Producto[]>(STORAGE_KEYS.PRODUCTOS, INITIAL_PRODUCTOS);
      const proveedores = getStored<Proveedor[]>(STORAGE_KEYS.PROVEEDORES, INITIAL_PROVEEDORES);

      const nuevaCompra: CompraProveedor = {
        ...data,
        id: `cmp-${Date.now()}`
      };

      // Add stock to products
      for (const item of data.items) {
        const prod = productos.find(p => p.id === item.productoId);
        if (prod) {
          prod.stock += item.cantidad;
          prod.precioCosto = item.costoUnitario; // update last cost
        }
      }
      setStored(STORAGE_KEYS.PRODUCTOS, productos);

      // Update provider total purchases
      const prov = proveedores.find(p => p.id === data.proveedorId);
      if (prov) {
        prov.totalCompras += data.total;
        setStored(STORAGE_KEYS.PROVEEDORES, proveedores);
      }

      compras.unshift(nuevaCompra);
      setStored(STORAGE_KEYS.COMPRAS, compras);
      return nuevaCompra;
    }
  },

  // 7. REPORTES FINANCIEROS
  reportes: {
    getResumenFinanciero: async (): Promise<ReporteFinancieroResumen> => {
      const ventas = getStored<Venta[]>(STORAGE_KEYS.VENTAS, INITIAL_VENTAS);
      const compras = getStored<CompraProveedor[]>(STORAGE_KEYS.COMPRAS, INITIAL_COMPRAS);
      const clientes = getStored<Cliente[]>(STORAGE_KEYS.CLIENTES, INITIAL_CLIENTES);

      const ingresosTotales = ventas.reduce((acc, v) => acc + v.total, 0);
      const egresosTotales = compras.reduce((acc, c) => acc + c.total, 0);
      const utilidadBruta = Math.max(0, ingresosTotales - egresosTotales);
      const margenPorcentaje = ingresosTotales > 0 ? Math.round((utilidadBruta / ingresosTotales) * 100) : 0;

      const cuentasPorCobrarClientes = clientes.reduce((acc, c) => acc + (c.saldoPendiente || 0), 0);
      const cuentasPorPagarProveedores = compras.filter(c => c.estadoPago === 'pendiente').reduce((acc, c) => acc + c.total, 0);

      const ticketPromedio = ventas.length > 0 ? Math.round(ingresosTotales / ventas.length) : 0;

      // Group by payment methods
      const metodoMap: Record<MetodoPago, { monto: number; conteo: number }> = {
        yape: { monto: 0, conteo: 0 },
        plin: { monto: 0, conteo: 0 },
        tarjeta: { monto: 0, conteo: 0 },
        efectivo: { monto: 0, conteo: 0 },
        transferencia: { monto: 0, conteo: 0 },
        mixto: { monto: 0, conteo: 0 }
      };

      for (const v of ventas) {
        if (metodoMap[v.metodoPago]) {
          metodoMap[v.metodoPago].monto += v.total;
          metodoMap[v.metodoPago].conteo += 1;
        }
      }

      const ventasPorMetodoPago = (Object.keys(metodoMap) as MetodoPago[]).map(m => ({
        metodo: m,
        monto: metodoMap[m].monto,
        conteo: metodoMap[m].conteo
      })).filter(m => m.conteo > 0);

      // Group by categories
      const catMap: Record<string, number> = {
        'Monturas oftálmicas': 2750,
        'Lunas con tratamiento': 2100,
        'Lentes de contacto': 890,
        'Servicios clínicos': 250
      };

      const totalCats = Object.values(catMap).reduce((a, b) => a + b, 0);
      const ventasPorCategoria = Object.entries(catMap).map(([categoria, monto]) => ({
        categoria,
        monto,
        porcentaje: Math.round((monto / totalCats) * 100)
      }));

      return {
        periodo: 'Octubre 2026',
        ingresosTotales,
        egresosTotales,
        utilidadBruta,
        margenPorcentaje,
        cuentasPorCobrarClientes,
        cuentasPorPagarProveedores,
        ticketPromedio,
        totalVentasContador: ventas.length,
        ventasPorCategoria,
        ventasPorMetodoPago,
        flujoMensual: [
          { mes: 'Jun', ingresos: 8200, egresos: 4100 },
          { mes: 'Jul', ingresos: 12500, egresos: 6800 },
          { mes: 'Ago', ingresos: 9400, egresos: 5200 },
          { mes: 'Set', ingresos: 11800, egresos: 7000 },
          { mes: 'Oct', ingresos: ingresosTotales, egresos: egresosTotales }
        ]
      };
    }
  },

  // 8. SLIM 4 & MYSQL INTEGRATION SPEC & GENERATOR
  slim4: {
    getMySqlSchema: (): string => {
      return `-- =================================================================
-- SCHEMA DDL MYSQL 8.0 / MARIADB - OPTIKALLPA VISIÓN PERÚ
-- Normalizado para Slim 4 Framework (PDO Prepared Statements)
-- =================================================================

CREATE DATABASE IF NOT EXISTS optikallpa_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE optikallpa_db;

-- 1. Tabla de Categorías de Productos Ópticos
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Tabla de Productos e Inventario Óptico
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_sku VARCHAR(40) NOT NULL UNIQUE,
    nombre VARCHAR(120) NOT NULL,
    categoria_id INT NOT NULL,
    marca VARCHAR(60) NOT NULL,
    modelo VARCHAR(60) NULL,
    color VARCHAR(40) NULL,
    material VARCHAR(60) NULL,
    calibre VARCHAR(30) NULL,
    stock INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 3,
    precio_costo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    precio_venta DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    codigo_sunat VARCHAR(20) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_productos_busqueda (codigo_sku, marca, nombre),
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
) ENGINE=InnoDB;

-- 3. Tabla de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_documento ENUM('DNI', 'RUC', 'CE', 'PAS') NOT NULL DEFAULT 'DNI',
    numero_documento VARCHAR(15) NOT NULL UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NULL,
    telefono VARCHAR(25) NULL,
    email VARCHAR(100) NULL,
    direccion VARCHAR(200) NULL,
    ciudad VARCHAR(50) DEFAULT 'Lima',
    fecha_nacimiento DATE NULL,
    ocupacion VARCHAR(80) NULL,
    total_compras DECIMAL(12,2) DEFAULT 0.00,
    saldo_pendiente DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_clientes_doc (tipo_documento, numero_documento),
    INDEX idx_clientes_nombres (nombres, apellidos)
) ENGINE=InnoDB;

-- 4. Ficha Oftalmológica y Recetas de Refracción
CREATE TABLE IF NOT EXISTS recetas_oftalmicas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    optometrista VARCHAR(100) NOT NULL,
    numero_colegiatura VARCHAR(30) NULL,
    fecha DATE NOT NULL,
    vigencia_meses INT DEFAULT 12,
    tipo_lente VARCHAR(50) NOT NULL,
    tratamiento VARCHAR(60) NOT NULL,
    -- Ojo Derecho (OD)
    od_esfera VARCHAR(10) NOT NULL,
    od_cilindro VARCHAR(10) NULL,
    od_eje VARCHAR(5) NULL,
    od_adicion VARCHAR(10) NULL,
    od_av VARCHAR(10) NULL,
    od_dnp VARCHAR(10) NULL,
    od_altura VARCHAR(10) NULL,
    -- Ojo Izquierdo (OI)
    oi_esfera VARCHAR(10) NOT NULL,
    oi_cilindro VARCHAR(10) NULL,
    oi_eje VARCHAR(5) NULL,
    oi_adicion VARCHAR(10) NULL,
    oi_av VARCHAR(10) NULL,
    oi_dnp VARCHAR(10) NULL,
    oi_altura VARCHAR(10) NULL,
    observaciones TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Tabla de Proveedores Ópticos
CREATE TABLE IF NOT EXISTS proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ruc VARCHAR(11) NOT NULL UNIQUE,
    razon_social VARCHAR(150) NOT NULL,
    nombre_contacto VARCHAR(100) NULL,
    telefono VARCHAR(30) NULL,
    email VARCHAR(100) NULL,
    direccion VARCHAR(200) NULL,
    especialidad ENUM('monturas', 'laboratorio_lunas', 'lentes_contacto', 'insumos') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 6. Tabla de Ventas
CREATE TABLE IF NOT EXISTS ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    serie_numero VARCHAR(20) NOT NULL UNIQUE,
    tipo_comprobante ENUM('boleta', 'factura', 'nota_venta') NOT NULL,
    fecha_emision DATE NOT NULL,
    cliente_id INT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    igv DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    metodo_pago ENUM('yape', 'plin', 'tarjeta', 'efectivo', 'transferencia', 'mixto') NOT NULL,
    referencia_pago VARCHAR(60) NULL,
    estado_pago ENUM('pagado', 'adelanto') NOT NULL DEFAULT 'pagado',
    adelanto_monto DECIMAL(10,2) NOT NULL,
    saldo_monto DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    INDEX idx_ventas_fecha (fecha_emision)
) ENGINE=InnoDB;

-- 7. Facturación Electrónica SUNAT (UBL 2.1 & CDR)
CREATE TABLE IF NOT EXISTS comprobantes_sunat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venta_id INT NOT NULL UNIQUE,
    tipo_documento CHAR(2) NOT NULL, -- 01: Factura, 03: Boleta, 07: NC
    serie VARCHAR(4) NOT NULL,
    correlativo VARCHAR(8) NOT NULL,
    numero_completo VARCHAR(15) NOT NULL UNIQUE,
    fecha_emision DATE NOT NULL,
    hora_emision TIME NOT NULL,
    emisor_ruc VARCHAR(11) NOT NULL,
    cliente_tipo_doc VARCHAR(5) NOT NULL,
    cliente_numero_doc VARCHAR(15) NOT NULL,
    subtotal_gravado DECIMAL(10,2) NOT NULL,
    igv DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    estado_sunat ENUM('ACEPTADO', 'PENDIENTE', 'RECHAZADO', 'DE_BAJA') DEFAULT 'PENDIENTE',
    hash_cdr VARCHAR(40) NULL,
    codigo_respuesta VARCHAR(10) NULL,
    mensaje_respuesta TEXT NULL,
    xml_firmado LONGTEXT NULL,
    codigo_qr TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venta_id) REFERENCES ventas(id)
) ENGINE=InnoDB;

-- 8. Pedidos de Laboratorio Óptico (Taller de Biselado)
CREATE TABLE IF NOT EXISTS pedidos_laboratorio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_orden VARCHAR(20) NOT NULL UNIQUE,
    venta_id INT NOT NULL,
    cliente_id INT NOT NULL,
    receta_id INT NULL,
    montura_detalle VARCHAR(200) NOT NULL,
    lunas_detalle VARCHAR(200) NOT NULL,
    laboratorio_nombre VARCHAR(120) NOT NULL,
    fecha_ingreso DATE NOT NULL,
    fecha_prometida DATE NOT NULL,
    fecha_entrega_real DATE NULL,
    estado ENUM('en_taller', 'en_control_calidad', 'listo_entrega', 'entregado') DEFAULT 'en_taller',
    costo_laboratorio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    monto_total DECIMAL(10,2) NOT NULL,
    adelanto DECIMAL(10,2) NOT NULL,
    saldo DECIMAL(10,2) NOT NULL,
    notas TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venta_id) REFERENCES ventas(id),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
) ENGINE=InnoDB;
`;
    },

    getSlimRoutesSpec: (): string => {
      return `<?php
// =================================================================
// RUTAS REST SLIM 4 FRAMEWORK (app/routes.php)
// Conexión con OptiKallpa Frontend (api.ts)
// =================================================================

use Slim\\App;
use Slim\\Routing\\RouteCollectorProxy;
use App\\Controllers\\AuthController;
use App\\Controllers\\ProductosController;
use App\\Controllers\\ClientesController;
use App\\Controllers\\VentasController;
use App\\Controllers\\SunatController;
use App\\Controllers\\LaboratorioController;
use App\\Controllers\\ReportesController;
use App\\Middleware\\JwtAuthMiddleware;
use App\\Middleware\\CorsMiddleware;

return function (App $app) {
    // CORS Global Middleware
    $app->add(CorsMiddleware::class);

    // API V1 Group
    $app->group('/api/v1', function (RouteCollectorProxy $group) {
        
        // Autenticación
        $group->post('/auth/login', [AuthController::class, 'login']);
        $group->get('/auth/ping', [AuthController::class, 'ping']);

        // Rutas protegidas con JWT
        $group->group('', function (RouteCollectorProxy $api) {
            
            // 1. Inventario & Productos
            $api->get('/productos', [ProductosController::class, 'index']);
            $api->get('/productos/{id}', [ProductosController::class, 'show']);
            $api->post('/productos', [ProductosController::class, 'create']);
            $api->put('/productos/{id}', [ProductosController::class, 'update']);
            $api->delete('/productos/{id}', [ProductosController::class, 'delete']);

            // 2. Clientes & Recetas
            $api->get('/clientes', [ClientesController::class, 'index']);
            $api->get('/clientes/{id}', [ClientesController::class, 'show']);
            $api->post('/clientes', [ClientesController::class, 'create']);
            $api->put('/clientes/{id}', [ClientesController::class, 'update']);
            $api->get('/clientes/consulta-documento/{tipo}/{numero}', [ClientesController::class, 'consultarReniecSunat']);
            $api->post('/clientes/{id}/recetas', [ClientesController::class, 'agregarReceta']);

            // 3. Ventas & POS
            $api->get('/ventas', [VentasController::class, 'index']);
            $api->get('/ventas/{id}', [VentasController::class, 'show']);
            $api->post('/ventas', [VentasController::class, 'create']); // Procesa Venta + Stock + Facturación
            $api->post('/ventas/{id}/cobro-saldo', [VentasController::class, 'cobrarSaldo']);

            // 4. Facturación Electrónica SUNAT (UBL 2.1)
            $api->get('/sunat/comprobantes', [SunatController::class, 'index']);
            $api->get('/sunat/comprobantes/{id}/xml', [SunatController::class, 'descargarXml']);
            $api->get('/sunat/comprobantes/{id}/pdf', [SunatController::class, 'generarPdf']);
            $api->post('/sunat/comprobantes/{id}/reenviar', [SunatController::class, 'reenviarSunat']);
            $api->get('/sunat/comprobantes/{id}/consultar-cdr', [SunatController::class, 'consultarCdr']);

            // 5. Órdenes de Trabajo de Laboratorio Óptico
            $api->get('/laboratorio/ordenes', [LaboratorioController::class, 'index']);
            $api->put('/laboratorio/ordenes/{id}/estado', [LaboratorioController::class, 'cambiarEstado']);

            // 6. Reportes Financieros & Flujo de Caja
            $api->get('/reportes/financiero', [ReportesController::class, 'resumen']);
            $api->get('/reportes/ventas-categoria', [ReportesController::class, 'ventasPorCategoria']);

        })->add(JwtAuthMiddleware::class);
    });
};
`;
    },

    getSampleControllerPhp: (): string => {
      return `<?php
namespace App\\Controllers;

use Psr\\Http\\Message\\ResponseInterface as Response;
use Psr\\Http\\Message\\ServerRequestInterface as Request;
use PDO;

class VentasController
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        $this->db->beginTransaction();

        try {
            // 1. Validar Cliente y Subtotales (18% IGV Peruano)
            $total = (float)$data['total'];
            $subtotal = round($total / 1.18, 2);
            $igv = round($total - $subtotal, 2);

            // 2. Insertar Venta con Prepared Statements (Seguridad Anti-Inyección)
            $stmt = $this->db->prepare("
                INSERT INTO ventas (serie_numero, tipo_comprobante, fecha_emision, cliente_id, subtotal, igv, total, metodo_pago, referencia_pago, estado_pago, adelanto_monto, saldo_monto)
                VALUES (:serie, :tipo, CURDATE(), :cliente_id, :subtotal, :igv, :total, :metodo, :ref, :estado, :adelanto, :saldo)
            ");
            $stmt->execute([
                ':serie'      => $data['serie_numero'],
                ':tipo'       => $data['tipo_comprobante'],
                ':cliente_id' => $data['cliente_id'],
                ':subtotal'   => $subtotal,
                ':igv'        => $igv,
                ':total'      => $total,
                ':metodo'     => $data['metodo_pago'],
                ':ref'        => $data['referencia_pago'] ?? null,
                ':estado'     => $data['saldo_monto'] > 0 ? 'adelanto' : 'pagado',
                ':adelanto'   => $data['adelanto_monto'],
                ':saldo'      => $data['saldo_monto']
            ]);
            $ventaId = (int)$this->db->lastInsertId();

            // 3. Descontar Stock de Inventario
            $stockStmt = $this->db->prepare("UPDATE productos SET stock = GREATEST(0, stock - :cantidad) WHERE id = :id");
            foreach ($data['items'] as $item) {
                $stockStmt->execute([
                    ':cantidad' => $item['cantidad'],
                    ':id'       => $item['producto_id']
                ]);
            }

            // 4. Si es Boleta o Factura, Generar Comprobante SUNAT
            if (in_array($data['tipo_comprobante'], ['boleta', 'factura'])) {
                // Aquí se invoca el servicio UBL 2.1 de Greenter o cURL directo OSE
                $sunatStmt = $this->db->prepare("
                    INSERT INTO comprobantes_sunat (venta_id, tipo_documento, serie, correlativo, numero_completo, fecha_emision, hora_emision, emisor_ruc, cliente_tipo_doc, cliente_numero_doc, subtotal_gravado, igv, total, estado_sunat)
                    VALUES (:venta_id, :tipo_doc, :serie, :corr, :num_comp, CURDATE(), CURTIME(), '20608945123', :cli_tipo, :cli_num, :subtotal, :igv, :total, 'ACEPTADO')
                ");
                $sunatStmt->execute([
                    ':venta_id' => $ventaId,
                    ':tipo_doc' => $data['tipo_comprobante'] === 'boleta' ? '03' : '01',
                    ':serie'    => substr($data['serie_numero'], 0, 4),
                    ':corr'     => substr($data['serie_numero'], 5),
                    ':num_comp' => $data['serie_numero'],
                    ':cli_tipo' => $data['cliente_tipo_doc'],
                    ':cli_num'  => $data['cliente_numero_doc'],
                    ':subtotal' => $subtotal,
                    ':igv'      => $igv,
                    ':total'    => $total
                ]);
            }

            $this->db->commit();

            $response->getBody()->write(json_encode([
                'success' => true,
                'venta_id' => $ventaId,
                'message' => 'Venta registrada y comprobante emitido exitosamente.'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);

        } catch (\\Exception $e) {
            $this->db->rollBack();
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }
}
`;
    },

    pingRemoteBackend: async (url: string): Promise<{ success: boolean; latencyMs: number; message: string }> => {
      const start = performance.now();
      try {
        const res = await fetch(`${url}/auth/ping`, { method: 'GET', signal: AbortSignal.timeout(3000) });
        const latency = Math.round(performance.now() - start);
        if (res.ok) {
          return { success: true, latencyMs: latency, message: `Conexión exitosa con API Slim 4 (${latency}ms)` };
        }
        return { success: false, latencyMs: latency, message: `Respuesta HTTP ${res.status} desde el servidor Slim 4` };
      } catch (err: any) {
        return {
          success: false,
          latencyMs: 0,
          message: 'No se pudo conectar al endpoint remoto Slim 4 (Modo local de contingencia activo).'
        };
      }
    }
  }
};
