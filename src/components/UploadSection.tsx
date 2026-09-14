import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, ClipboardPaste, Sparkles, Trash2, ArrowUpRight, CheckCircle, AlertCircle } from 'lucide-react';
import { parseExcelFile, parseRawText } from '../services/parser';
import { BankConfig, Transaction, AccountItem, ClassificationRule } from '../types';
import { processRawRows } from '../services/ruleEngine';
import { SAMPLE_MERCANTIL_TRANSACTIONS } from '../data/defaultData';

interface UploadSectionProps {
  config: BankConfig;
  customRules: ClassificationRule[];
  planCuentas: AccountItem[];
  onTransactionsLoaded: (transactions: Transaction[]) => void;
  onClearTransactions: () => void;
  transactionsCount: number;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  config,
  customRules,
  planCuentas,
  onTransactionsLoaded,
  onClearTransactions,
  transactionsCount,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedText, setPastedText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let rawRows = [];
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (extension === 'xlsx' || extension === 'xls') {
        rawRows = await parseExcelFile(file);
      } else {
        const text = await file.text();
        rawRows = parseRawText(text);
      }

      if (rawRows.length === 0) {
        setErrorMsg('No se detectaron transacciones válidas en el archivo seleccionado. Asegúrate de que contenga descripciones y montos.');
        setIsLoading(false);
        return;
      }

      const processed = processRawRows(rawRows, config, customRules, planCuentas);
      onTransactionsLoaded(processed);
      
      const debitCount = processed.filter(t => t.type === 'ND').length;
      const creditCount = processed.filter(t => t.type === 'NC').length;

      setSuccessMsg(
        `Se procesaron con éxito ${processed.length} movimientos (${debitCount} Débitos ND y ${creditCount} Créditos NC) desde "${file.name}" leyendo Hoja 1 y Hoja 2.`
      );
    } catch (err) {
      console.error(err);
      setErrorMsg('Ocurrió un error al procesar el archivo. Comprueba el formato de las columnas.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleProcessPastedText = () => {
    if (!pastedText.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const rawRows = parseRawText(pastedText);
      if (rawRows.length === 0) {
        setErrorMsg('No se pudieron extraer transacciones del texto pegado. Verifica que incluya columnas de concepto/descripción y monto.');
        setIsLoading(false);
        return;
      }

      const processed = processRawRows(rawRows, config, customRules, planCuentas);
      onTransactionsLoaded(processed);
      setSuccessMsg(`Se importaron ${processed.length} transacciones pegadas.`);
      setShowPasteModal(false);
      setPastedText('');
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al interpretar el texto.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = () => {
    setErrorMsg(null);
    onTransactionsLoaded(SAMPLE_MERCANTIL_TRANSACTIONS);
    setSuccessMsg(`Se cargaron 78 transacciones oficiales del extracto bancario de Banco Mercantil para prueba.`);
  };

  return (
    <div id="upload-section-container" className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs mb-6">
      
      {/* Encabezado de Carga */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#0B3B60]" />
            Cargar Estado de Cuenta Banco Mercantil
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
            <span>Para la empresa:</span>
            <strong className="text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              {config.companyName || 'Empresa Activa'}
            </strong>
            {config.rif && <span className="font-mono text-slate-500">({config.rif})</span>}
            <span className="text-slate-300">•</span>
            <span>Arrastra tu archivo Excel (.xlsx, .xls), CSV o pega filas</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botón Cargar Prueba */}
          <button
            id="btn-load-sample-data"
            type="button"
            onClick={handleLoadSample}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-[#0B3B60] bg-[#E1F0FA] hover:bg-[#cce3f5] transition-all border border-[#B8DCF5] shadow-2xs cursor-pointer"
            title="Cargar 78 registros idénticos a los del documento para verificar clasificación y cuadre exacto"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0B3B60]" />
            <span>Cargar Ejemplo (PDF Mercantil)</span>
          </button>

          {/* Botón Pegar Texto */}
          <button
            id="btn-paste-raw-text"
            type="button"
            onClick={() => setShowPasteModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all border border-slate-200/80 shadow-2xs cursor-pointer"
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-slate-600" />
            <span>Pegar Texto</span>
          </button>

          {/* Limpiar */}
          {transactionsCount > 0 && (
            <button
              id="btn-clear-all-data"
              type="button"
              onClick={onClearTransactions}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-all border border-rose-200 cursor-pointer"
              title="Limpiar todas las transacciones actuales"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Zona Drag & Drop */}
      <div
        id="dropzone-area"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
          isDragging
            ? 'border-[#0B3B60] bg-[#E1F0FA]/40 scale-[0.99]'
            : 'border-slate-200 bg-[#F8FAFC] hover:bg-slate-100/70 hover:border-slate-300'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls, .csv, .txt"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-[#0B3B60] shadow-xs mb-3">
          <FileSpreadsheet className="w-6 h-6" />
        </div>

        <p className="text-sm font-bold text-slate-800">
          Haz clic aquí para seleccionar el archivo o arrástralo hasta acá
        </p>
        <p className="text-xs text-slate-500 mt-1 max-w-lg">
          Lee automáticamente libros de Excel (.xlsx, .xls) con <strong>Hoja 1 (Débitos)</strong> y <strong>Hoja 2 (Créditos)</strong> para generar el asiento contable completo
        </p>

        <div className="flex items-center gap-2 mt-3 text-[11px] font-semibold text-slate-500">
          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">.XLSX</span>
          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">.XLS</span>
          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">.CSV</span>
          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">.TXT</span>
        </div>
      </div>

      {/* Alertas y Mensajes */}
      {errorMsg && (
        <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Modal de Pegar Texto */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#F8FAFC]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#E1F0FA] text-[#0B3B60] flex items-center justify-center">
                  <ClipboardPaste className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  Pegar Movimientos Bancarios
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <label className="block text-xs font-semibold text-slate-600 mb-2">
                Pega aquí las líneas copiadas de tu estado de cuenta o tabla de Excel:
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Ejemplo:&#10;Transferencia Cta.***6530	NC	33899101	1.000.000,00&#10;Comisión por Transferencia a Terceros	ND	00093931	-10,10&#10;SGLBTR – Roll It Tires CA	ND	82464769	-3.152.500,00"
                rows={8}
                className="w-full text-xs font-mono p-3 bg-[#F8FAFC] border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-[#0B3B60] focus:ring-2 focus:ring-[#0B3B60]/10 text-slate-800"
              />
              <p className="text-[11px] text-slate-400 mt-2">
                Puedes incluir columnas de Cuenta, Descripción, Tipo, Referencia y Monto, o simplemente Descripción y Monto.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-white">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleProcessPastedText}
                disabled={!pastedText.trim() || isLoading}
                className="px-5 py-2 rounded-full text-xs font-bold text-white bg-[#0B3B60] hover:bg-[#082b47] disabled:opacity-50 transition-all shadow-xs cursor-pointer"
              >
                Procesar y Clasificar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
