import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Scale, Layers, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatVenezuelanMoney } from '../services/parser';

interface MetricsCardsProps {
  totalNC: number;
  totalND: number;
  count: number;
  unclassifiedCount: number;
  onFilterUnclassified: () => void;
  isFilteringUnclassified: boolean;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  totalNC,
  totalND,
  count,
  unclassifiedCount,
  onFilterUnclassified,
  isFilteringUnclassified,
}) => {
  const netBalance = totalNC + totalND;
  const isNetPositive = netBalance >= 0;

  return (
    <div id="metrics-overview" className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 my-6">
      
      {/* 1. Total Créditos (NC - Ingresos) */}
      <div id="metric-card-nc" className="bg-emerald-50/70 border border-emerald-200/80 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
            Créditos (NC / Abonos)
          </span>
          <div className="w-7 h-7 rounded-full bg-emerald-200/70 flex items-center justify-center text-emerald-800 font-bold">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="font-mono text-lg sm:text-xl font-black text-emerald-900">
            {formatVenezuelanMoney(totalNC)}
          </span>
          <span className="text-xs font-bold text-emerald-700">Bs.</span>
        </div>
        <p className="mt-1 text-[11px] text-emerald-700 font-medium">
          Aportes, cobros POS y transferencias
        </p>
      </div>

      {/* 2. Total Débitos (ND - Egresos) */}
      <div id="metric-card-nd" className="bg-rose-50/70 border border-rose-200/80 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
            Débitos (ND / Cargos)
          </span>
          <div className="w-7 h-7 rounded-full bg-rose-200/70 flex items-center justify-center text-rose-800 font-bold">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="font-mono text-lg sm:text-xl font-black text-rose-900">
            {formatVenezuelanMoney(Math.abs(totalND))}
          </span>
          <span className="text-xs font-bold text-rose-700">Bs.</span>
        </div>
        <p className="mt-1 text-[11px] text-rose-700 font-medium">
          Proveedores, comisiones y tributos
        </p>
      </div>

      {/* 3. Saldo Neto del Período */}
      <div id="metric-card-net" className="bg-sky-50/70 border border-sky-200/80 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B3B60]">
            Saldo Neto del Período
          </span>
          <div className="w-7 h-7 rounded-full bg-[#E1F0FA] flex items-center justify-center text-[#0B3B60] font-bold">
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className={`font-mono text-lg sm:text-xl font-black ${isNetPositive ? 'text-[#0B3B60]' : 'text-rose-900'}`}>
            {formatVenezuelanMoney(netBalance)}
          </span>
          <span className="text-xs font-bold text-slate-500">Bs.</span>
        </div>
        <p className="mt-1 text-[11px] text-[#0B3B60]/80 font-medium">
          Variación neta en Banco Mercantil
        </p>
      </div>

      {/* 4. Total Transacciones */}
      <div id="metric-card-count" className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Movimientos
          </span>
          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-mono text-lg sm:text-xl font-black text-slate-800">
            {count}
          </span>
          <span className="text-xs font-bold text-slate-400">registros</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400 font-medium">
          Generador para 3 hojas Excel
        </p>
      </div>

      {/* 5. Sin Clasificar / Alerta Cuadre */}
      <button
        id="metric-card-unclassified"
        type="button"
        onClick={onFilterUnclassified}
        className={`text-left col-span-2 sm:col-span-1 border rounded-3xl p-4 sm:p-5 transition-all cursor-pointer ${
          unclassifiedCount > 0
            ? isFilteringUnclassified
              ? 'bg-amber-100/90 border-amber-400 ring-2 ring-amber-300/60 shadow-xs'
              : 'bg-amber-50/90 border-amber-300 hover:bg-amber-100/70 shadow-xs'
            : 'bg-[#F0FDF4] border-emerald-200 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${unclassifiedCount > 0 ? 'text-amber-800' : 'text-emerald-800'}`}>
            {unclassifiedCount > 0 ? 'Por Revisar' : 'Cuadre Contable'}
          </span>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${unclassifiedCount > 0 ? 'bg-amber-200 text-amber-900 font-bold' : 'bg-emerald-200 text-emerald-800 font-bold'}`}>
            {unclassifiedCount > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className={`font-mono text-lg sm:text-xl font-black ${unclassifiedCount > 0 ? 'text-amber-800' : 'text-emerald-900'}`}>
            {unclassifiedCount > 0 ? unclassifiedCount : '100% OK'}
          </span>
          {unclassifiedCount > 0 && <span className="text-xs font-bold text-amber-700">pendientes</span>}
        </div>
        <p className={`mt-1 text-[11px] font-medium ${unclassifiedCount > 0 ? 'text-amber-700 underline decoration-amber-300' : 'text-emerald-700'}`}>
          {unclassifiedCount > 0
            ? isFilteringUnclassified
              ? 'Mostrando solo pendientes ✕'
              : 'Clic para filtrar y corregir'
            : 'Partida doble balanceada'}
        </p>
      </button>

    </div>
  );
};
