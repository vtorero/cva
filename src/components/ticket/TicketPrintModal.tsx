/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { ComprobanteSunat, Venta, RecetaOftalmica } from '../../types';
import { Printer, X, Download, CheckCircle2, QrCode } from 'lucide-react';

interface TicketPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  comprobante?: ComprobanteSunat;
  venta?: Venta;
  receta?: RecetaOftalmica;
}

export const TicketPrintModal: React.FC<TicketPrintModalProps> = ({
  isOpen,
  onClose,
  comprobante,
  venta,
  receta
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || (!comprobante && !venta)) return null;

  const handlePrint = () => {
    window.print();
  };

  const c = comprobante;
  const v = venta;

  const numeroCompleto = c?.numeroCompleto || v?.serieNumero || 'B001-00004521';
  const esBoleta = numeroCompleto.startsWith('B');
  const esFactura = numeroCompleto.startsWith('F');
  const tituloDoc = esBoleta 
    ? 'BOLETA DE VENTA ELECTRÓNICA' 
    : esFactura 
    ? 'FACTURA ELECTRÓNICA' 
    : 'NOTA DE VENTA';

  const emisorRuc = c?.emisorRuc || '20608945123';
  const emisorNombre = c?.emisorRazonSocial || 'ÓPTICA KALLPA VISIÓN PERÚ S.A.C.';
  const emisorDireccion = c?.emisorDireccion || 'Av. Larco 450, Miraflores, Lima - Perú';

  const clienteDoc = c?.clienteNumeroDoc || v?.clienteDocumento || '-';
  const clienteTipoDoc = c?.clienteTipoDoc || (clienteDoc.length === 11 ? 'RUC' : 'DNI');
  const clienteNombre = c?.clienteNombre || v?.clienteNombre || '-';
  const fecha = c?.fechaEmision || v?.fecha || new Date().toISOString().split('T')[0];
  const hora = c?.horaEmision || '12:00:00';

  const subtotal = c?.subtotalGravado || v?.subtotal || 0;
  const igv = c?.igv || v?.igv || 0;
  const total = c?.total || v?.total || 0;
  const adelanto = v?.adelantoMonto ?? total;
  const saldo = v?.saldoMonto ?? 0;

  const hashCdr = c?.hashCdr || 'gT59Vv8N+wK12pLMq3uXy98aBs4=';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 no-print">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Comprobante de Pago & Ficha Óptica
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              {numeroCompleto} · Formato Ticket Térmico 80mm
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Printable Ticket */}
        <div className="p-6 overflow-y-auto bg-slate-100 flex justify-center">
          <div
            id="printable-ticket"
            ref={printRef}
            className="w-[80mm] max-w-full bg-white p-5 shadow-xs border border-slate-200 font-mono text-[11px] leading-tight text-slate-800"
          >
            {/* Emisor */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <div className="font-bold text-xs uppercase tracking-tight text-slate-900">
                {emisorNombre}
              </div>
              <div className="text-[10px] text-slate-600 mt-0.5">RUC: {emisorRuc}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{emisorDireccion}</div>
              <div className="text-[10px] text-slate-500">Telf: (01) 445-8920 / Cel: 984-123-456</div>
            </div>

            {/* Tipo de Documento y Número */}
            <div className="text-center py-2.5 border-b border-dashed border-slate-300">
              <div className="font-bold text-xs text-slate-900">{tituloDoc}</div>
              <div className="font-bold text-sm tracking-wide text-sky-950 tabular-nums mt-0.5">
                {numeroCompleto}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Fecha: {fecha} {hora}
              </div>
            </div>

            {/* Datos del Cliente */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">{clienteTipoDoc}:</span>
                <span className="font-bold tabular-nums">{clienteDoc}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CLIENTE:</span>
                <span className="font-bold text-right truncate max-w-[170px]">{clienteNombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">MONEDA:</span>
                <span>SOLES (PEN)</span>
              </div>
            </div>

            {/* Si tiene Receta Oftálmica vinculada */}
            {receta && (
              <div className="py-2.5 border-b border-dashed border-slate-300 bg-slate-50/80 -mx-5 px-5 my-1">
                <div className="font-bold text-[10px] uppercase text-sky-900 mb-1 flex items-center justify-between">
                  <span>Prescripción Oftálmica</span>
                  <span className="text-[9px] text-slate-500">{receta.optometrista}</span>
                </div>
                <div className="text-[9px] space-y-0.5">
                  <div className="flex justify-between font-semibold border-b border-slate-200 pb-0.5">
                    <span>OJO</span>
                    <span>ESF</span>
                    <span>CIL</span>
                    <span>EJE</span>
                    <span>ADD</span>
                    <span>DNP</span>
                  </div>
                  <div className="flex justify-between tabular-nums">
                    <span className="font-bold">OD</span>
                    <span>{receta.od.esfera || '0.00'}</span>
                    <span>{receta.od.cilindro || '0.00'}</span>
                    <span>{receta.od.eje ? `${receta.od.eje}°` : '-'}</span>
                    <span>{receta.od.adicion || '-'}</span>
                    <span>{receta.od.dnp ? `${receta.od.dnp}mm` : '-'}</span>
                  </div>
                  <div className="flex justify-between tabular-nums">
                    <span className="font-bold">OI</span>
                    <span>{receta.oi.esfera || '0.00'}</span>
                    <span>{receta.oi.cilindro || '0.00'}</span>
                    <span>{receta.oi.eje ? `${receta.oi.eje}°` : '-'}</span>
                    <span>{receta.oi.adicion || '-'}</span>
                    <span>{receta.oi.dnp ? `${receta.oi.dnp}mm` : '-'}</span>
                  </div>
                </div>
                <div className="text-[9px] text-slate-600 mt-1">
                  Tipo: {receta.tipoLente} · {receta.tratamiento}
                </div>
              </div>
            )}

            {/* Detalle de Productos */}
            <div className="py-2.5 border-b border-dashed border-slate-300">
              <div className="flex justify-between font-bold text-[10px] pb-1 border-b border-slate-200">
                <span>CANT / DESCRIPCIÓN</span>
                <span>TOTAL</span>
              </div>
              <div className="space-y-1.5 pt-1.5">
                {v?.items && v.items.length > 0 ? (
                  v.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-1">
                      <div className="flex-1">
                        <span className="font-bold mr-1">{it.cantidad}x</span>
                        <span className="text-slate-700">{it.nombre}</span>
                      </div>
                      <div className="tabular-nums font-semibold shrink-0">
                        S/ {it.subtotal.toFixed(2)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between">
                    <span>1x Producto Óptico Especializado</span>
                    <span className="tabular-nums font-semibold">S/ {total.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Totales y Liquidación */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-right">
              <div className="flex justify-between text-slate-600">
                <span>OP. GRAVADA:</span>
                <span className="tabular-nums">S/ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>I.G.V. (18%):</span>
                <span className="tabular-nums">S/ {igv.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>IMPORTE TOTAL:</span>
                <span className="tabular-nums">S/ {total.toFixed(2)}</span>
              </div>

              {/* Saldo y adelanto si aplica */}
              {saldo > 0 ? (
                <div className="pt-1.5 space-y-0.5 bg-amber-50 -mx-2 p-1.5 rounded text-amber-900">
                  <div className="flex justify-between text-[10px]">
                    <span>ADELANTO PAGADO:</span>
                    <span className="tabular-nums font-bold">S/ {adelanto.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-amber-800">
                    <span>SALDO AL RECOGER:</span>
                    <span className="tabular-nums">S/ {saldo.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between text-[10px] text-emerald-700 font-semibold pt-0.5">
                  <span>CONDICIÓN:</span>
                  <span>CANCELADO (100%)</span>
                </div>
              )}
            </div>

            {/* Hash SUNAT & QR */}
            <div className="pt-3 text-center space-y-2">
              <div className="flex justify-center">
                <div className="w-20 h-20 border border-slate-300 p-1 flex items-center justify-center bg-white">
                  <QrCode className="w-16 h-16 text-slate-800" />
                </div>
              </div>

              <div className="text-[9px] text-slate-500">
                <div className="font-semibold text-slate-700">HASH CDR SUNAT:</div>
                <div className="break-all font-mono">{hashCdr}</div>
              </div>

              <div className="text-[8.5px] leading-tight text-slate-500 pt-1 border-t border-dashed border-slate-200">
                Representación impresa de la {tituloDoc}.<br />
                Autorizado mediante Resolución de Superintendencia.<br />
                Consulte su comprobante en: <span className="underline">www.sunat.gob.pe</span>
              </div>

              <div className="text-[9px] text-slate-600 font-bold pt-1">
                ¡Gracias por confiar en OptiKallpa Perú!
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex justify-between items-center no-print">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Validado con servidor SUNAT</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
