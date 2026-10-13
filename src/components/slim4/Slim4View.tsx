/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { api, ApiClientConfig } from '../../services/api';
import {
  Database,
  Server,
  Code,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  Zap,
  Globe,
  FileCode,
  RotateCcw
} from 'lucide-react';

export const Slim4View: React.FC = () => {
  const [config, setConfig] = useState<ApiClientConfig>(api.config.get());
  const [tabActiva, setTabActiva] = useState<'schema' | 'routes' | 'controller' | 'config'>('schema');
  const [copiado, setCopiado] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs: number; message: string } | null>(null);
  const [probando, setProbando] = useState<boolean>(false);

  const schemaSql = api.slim4.getMySqlSchema();
  const routesPhp = api.slim4.getSlimRoutesSpec();
  const controllerPhp = api.slim4.getSampleControllerPhp();

  const handleCopiar = (texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleProbarConexion = async () => {
    setProbando(true);
    try {
      const res = await api.slim4.pingRemoteBackend(config.baseUrl);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        latencyMs: 0,
        message: 'Error de red al intentar conectar con el backend Slim 4.'
      });
    } finally {
      setProbando(false);
    }
  };

  const handleGuardarConfig = (e: React.FormEvent) => {
    e.preventDefault();
    api.config.update(config);
    alert('Configuración de la API Slim 4 guardada correctamente.');
  };

  const handleResetData = () => {
    if (confirm('¿Deseas restablecer los datos de prueba a los valores originales de fábrica?')) {
      api.config.resetToDefault();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Informativo de Arquitectura */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-sky-950 text-white shrink-0 mt-0.5">
              <Server className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Arquitectura de Integración Slim 4 & MySQL
              </h2>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                El frontend interactúa con las APIs centralizadas en <code className="font-mono text-sky-700 bg-sky-50 px-1 py-0.5 rounded">src/services/api.ts</code>.
                Esta capa abstrae el modelo relacional MySQL 8.0 y los microservicios REST en Slim 4, permitiendo un rendimiento ultrarrápido y seguro contra inyecciones SQL.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleResetData}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Restablecer Datos Demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs de Navegación de Especificaciones */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setTabActiva('schema')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            tabActiva === 'schema'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>MySQL Schema (schema.sql)</span>
        </button>

        <button
          onClick={() => setTabActiva('routes')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            tabActiva === 'routes'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Rutas Slim 4 (routes.php)</span>
        </button>

        <button
          onClick={() => setTabActiva('controller')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            tabActiva === 'controller'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Controlador PHP Seguro (PDO)</span>
        </button>

        <button
          onClick={() => setTabActiva('config')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            tabActiva === 'config'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Conexión & Ping</span>
        </button>
      </div>

      {/* Contenido según Tab */}
      {tabActiva === 'schema' && (
        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-xs">
          <div className="px-5 py-3 bg-slate-950 flex items-center justify-between text-xs text-slate-300 border-b border-slate-800">
            <span className="font-mono">schema.sql · DDL Normalizado MySQL 8.0</span>
            <button
              onClick={() => handleCopiar(schemaSql)}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded font-mono text-[11px] transition-colors"
            >
              {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiado ? 'Copiado al portapapeles' : 'Copiar SQL'}</span>
            </button>
          </div>
          <pre className="p-4 overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed max-h-[580px]">
            {schemaSql}
          </pre>
        </div>
      )}

      {tabActiva === 'routes' && (
        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-xs">
          <div className="px-5 py-3 bg-slate-950 flex items-center justify-between text-xs text-slate-300 border-b border-slate-800">
            <span className="font-mono">app/routes.php · Slim 4 Route Collector</span>
            <button
              onClick={() => handleCopiar(routesPhp)}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded font-mono text-[11px] transition-colors"
            >
              {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiado ? 'Copiado al portapapeles' : 'Copiar Rutas'}</span>
            </button>
          </div>
          <pre className="p-4 overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed max-h-[580px]">
            {routesPhp}
          </pre>
        </div>
      )}

      {tabActiva === 'controller' && (
        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-xs">
          <div className="px-5 py-3 bg-slate-950 flex items-center justify-between text-xs text-slate-300 border-b border-slate-800">
            <span className="font-mono">src/Controllers/VentasController.php · Transacciones PDO & SUNAT</span>
            <button
              onClick={() => handleCopiar(controllerPhp)}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded font-mono text-[11px] transition-colors"
            >
              {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiado ? 'Copiado al portapapeles' : 'Copiar Controlador'}</span>
            </button>
          </div>
          <pre className="p-4 overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed max-h-[580px]">
            {controllerPhp}
          </pre>
        </div>
      )}

      {tabActiva === 'config' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs max-w-2xl space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Configurador de Endpoint de la API Slim 4
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ajusta la URL base y realiza pruebas de latencia hacia tu servidor Slim 4 en producción o desarrollo local.
            </p>
          </div>

          <form onSubmit={handleGuardarConfig} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                URL Base de la API Slim 4 (VITE_SLIM_API_URL)
              </label>
              <input
                type="text"
                value={config.baseUrl}
                onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="http://localhost:8080/api/v1"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Por defecto el sistema utiliza el motor local persistente optimizado con Indexed Storage.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  RUC Emisor para Facturación SUNAT
                </label>
                <input
                  type="text"
                  value={config.emisorRuc}
                  onChange={(e) => setConfig({ ...config, emisorRuc: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Razón Social Emisor
                </label>
                <input
                  type="text"
                  value={config.emisorRazonSocial}
                  onChange={(e) => setConfig({ ...config, emisorRazonSocial: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleProbarConexion}
                disabled={probando}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>{probando ? 'Midiendo Latencia...' : 'Probar Conexión (Ping)'}</span>
              </button>

              <button
                type="submit"
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
              >
                Guardar Configuración
              </button>
            </div>
          </form>

          {testResult && (
            <div className={`p-4 rounded-lg border text-xs ${testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
              <div className="font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Resultado de Conexión:</span>
              </div>
              <p className="mt-1 font-mono text-[11px]">{testResult.message}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
