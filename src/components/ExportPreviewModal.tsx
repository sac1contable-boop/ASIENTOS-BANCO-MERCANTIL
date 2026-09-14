import React, { useState } from 'react';
import { X, FileSpreadsheet, Download, Layers, ArrowDownLeft, ArrowUpRight, Scale, CheckCircle2 } from 'lucide-react';
import { BankConfig, Transaction } from '../types';
import { prepareSheetsData, exportToExcel } from '../services/excelExport';
import { formatVenezuelanMoney } from '../services/parser';

interface ExportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  config: BankConfig;
}

export const ExportPreviewModal: React.FC<ExportPreviewModalProps> = ({
  isOpen,
  onClose,
  transactions,
  config,
}) => {
  const [activeTab, setActiveTab] = useState<'sheet1' | 'sheet2' | 'sheet3'>('sheet1');

  if (!isOpen) return null;

  const { sheet1NCData, sheet2NDData, sheet3ConsolidatedData, totalNC, totalND, netBalance } = prepareSheetsData(transactions, config);

  // Seleccionar datos de la pestaña activa
  let currentSheetData = sheet1NCData;
  let tabName = 'Hoja 1: NC Ingresos (Banco + Cuentas por Cobrar)';
  let tabExplanation = '✅ Depósitos y NC (+) con línea resumen Cuentas por Cobrar (1.1.2.1.10) en negativo (-). Total: 0,00 Bs.';
  
  if (activeTab === 'sheet2') {
    currentSheetData = sheet2NDData;
    tabName = 'Hoja 2: ND Egresos (Partida Doble)';
    tabExplanation = '⚖️ Conceptos en positivo (+) contra salidas de Banco Mercantil (1.1.1.2.60) en negativo (-). Total: 0,00 Bs.';
  } else if (activeTab === 'sheet3') {
    currentSheetData = sheet3ConsolidatedData;
    tabName = 'Hoja 3: Asiento Consolidado Completo';
    tabExplanation = '📑 Hoja 1 y Hoja 2 unificadas en una sola hoja para el asiento contable íntegro. Total: 0,00 Bs.';
  }

  // Calcular suma de la hoja activa
  const currentSheetSum = currentSheetData.slice(1).reduce((acc, row) => acc + (Number(row[4]) || 0), 0);
  const isSheetBalanced = Math.abs(currentSheetSum) < 0.01;

  const handleDownload = () => {
    exportToExcel(transactions, config);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E1F0FA] text-[#0B3B60] flex items-center justify-center shadow-xs border border-white">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Vista Previa de Asientos Contables (Excel - 3 Hojas Reglamentarias)
              </h3>
              <p className="text-xs text-slate-500">
                {config.companyName || 'Empresa'} · Banco Mercantil ({config.bankAccountCode || '1.1.1.2.60'}) · Partida Doble
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors border border-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pestañas de las 3 Hojas */}
        <div className="px-6 pt-4 pb-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Hoja 1: NC Ingresos */}
            <button
              type="button"
              onClick={() => setActiveTab('sheet1')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'sheet1'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              Hoja 1: NC Ingresos ({sheet1NCData.length > 1 ? sheet1NCData.length - 1 : 0})
            </button>

            {/* Hoja 2: ND Egresos */}
            <button
              type="button"
              onClick={() => setActiveTab('sheet2')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'sheet2'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Hoja 2: ND Egresos ({sheet2NDData.length > 1 ? sheet2NDData.length - 1 : 0})
            </button>

            {/* Hoja 3: Asiento Consolidado */}
            <button
              type="button"
              onClick={() => setActiveTab('sheet3')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'sheet3'
                  ? 'bg-[#0B3B60] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Hoja 3: Asiento Consolidado ({sheet3ConsolidatedData.length > 1 ? sheet3ConsolidatedData.length - 1 : 0})
            </button>

          </div>

          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="text-slate-500 hidden lg:inline">{tabExplanation}</span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
              isSheetBalanced ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              <CheckCircle2 className="w-3 h-3" />
              Cuadre: {formatVenezuelanMoney(currentSheetSum)} Bs.
            </span>
          </div>
        </div>

        {/* Tabla Preview de la Hoja Seleccionada */}
        <div className="flex-1 overflow-auto p-6 bg-[#F8FAFC]">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead className="bg-[#F8FAFC] text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3 w-10 text-center text-slate-400">#</th>
                  <th className="p-3 w-36">Cuenta Contable</th>
                  <th className="p-3 min-w-[280px]">Descripción</th>
                  <th className="p-3 w-16 text-center">Tipo</th>
                  <th className="p-3 w-28">Referencia</th>
                  <th className="p-3 w-36 text-right">Monto (Bs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {currentSheetData.slice(1).map((row, idx) => {
                  const [cuenta, desc, tipo, ref, monto] = row;
                  const numMonto = Number(monto) || 0;
                  const isNegative = numMonto < 0;
                  const isBalancingRow = (cuenta === (config.receivableAccountCode || '1.1.2.1.10')) && desc === 'CUENTAS POR COBRAR';

                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50 transition-colors ${
                        isBalancingRow ? 'bg-amber-50/60 font-semibold' : ''
                      }`}
                    >
                      <td className="p-2.5 text-center text-slate-400 text-[11px]">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-slate-800">{cuenta}</td>
                      <td className="p-2.5 font-sans font-medium text-slate-700">
                        {desc}
                        {isBalancingRow && (
                          <span className="ml-2 text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-bold">
                            Fila de Cuadre Total
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            tipo === 'NC'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : tipo === 'NV'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {tipo}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-400">{ref || '-'}</td>
                      <td
                        className={`p-2.5 text-right font-bold ${
                          isNegative ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {formatVenezuelanMoney(numMonto)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-white">
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <div>
              Total NC: <span className="font-mono font-bold text-emerald-700">{formatVenezuelanMoney(totalNC)} Bs.</span>
            </div>
            <div>
              Total ND: <span className="font-mono font-bold text-rose-700">{formatVenezuelanMoney(Math.abs(totalND))} Bs.</span>
            </div>
            <div>
              Saldo Neto: <span className="font-mono font-bold text-slate-800">{formatVenezuelanMoney(netBalance)} Bs.</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              id="btn-download-excel-file"
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-full text-xs font-black text-white bg-[#0B3B60] hover:bg-[#082a45] shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#A2D2FF]" />
              Descargar Archivo Excel (.xlsx)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
