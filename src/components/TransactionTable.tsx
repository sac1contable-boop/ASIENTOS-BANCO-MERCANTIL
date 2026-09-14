import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowDownLeft, ArrowUpRight, FileSpreadsheet, Trash2, Plus, Edit2, Check, X, AlertTriangle, Layers, RotateCcw } from 'lucide-react';
import { AccountItem, BankConfig, Transaction, TransactionType } from '../types';
import { formatVenezuelanMoney } from '../services/parser';

interface TransactionTableProps {
  transactions: Transaction[];
  planCuentas: AccountItem[];
  config: BankConfig;
  onUpdateTransaction: (id: string, updated: Partial<Transaction>) => void;
  onDeleteTransaction: (id: string) => void;
  onAddTransaction: (tx: Transaction) => void;
  onOpenExportPreview: () => void;
  onReclassifyAll: () => void;
  filterUnclassifiedOnly: boolean;
  onClearFilterUnclassified: () => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  planCuentas,
  config,
  onUpdateTransaction,
  onDeleteTransaction,
  onAddTransaction,
  onOpenExportPreview,
  onReclassifyAll,
  filterUnclassifiedOnly,
  onClearFilterUnclassified,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'NC' | 'ND'>('ALL');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    accountCode: string;
    description: string;
    reference: string;
    amount: number;
    type: TransactionType;
  } | null>(null);

  // Modal para agregar fila manual
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newRef, setNewRef] = useState('');
  const [newAmt, setNewAmt] = useState('');
  const [newType, setNewType] = useState<TransactionType>('ND');
  const [newAcct, setNewAcct] = useState('2.1.1.1.10');

  // Filtrado de registros
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Filtro de no clasificados
      if (filterUnclassifiedOnly && t.accountCode !== 'SIN CLASIFICAR') {
        return false;
      }

      // Filtro de tipo NC / ND
      if (typeFilter !== 'ALL' && t.type !== typeFilter) {
        return false;
      }

      // Búsqueda por texto
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const inDesc = t.description.toLowerCase().includes(query);
        const inRef = t.reference.toLowerCase().includes(query);
        const inAcct = t.accountCode.toLowerCase().includes(query);
        const inRule = (t.ruleMatched || '').toLowerCase().includes(query);
        return inDesc || inRef || inAcct || inRule;
      }

      return true;
    });
  }, [transactions, filterUnclassifiedOnly, typeFilter, searchTerm]);

  // Totales de la selección actual
  const currentTotal = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  const handleStartEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setEditForm({
      accountCode: tx.accountCode,
      description: tx.description,
      reference: tx.reference,
      amount: tx.amount,
      type: tx.type,
    });
  };

  const handleSaveEdit = (id: string) => {
    if (!editForm) return;
    const acctItem = planCuentas.find(c => c.code === editForm.accountCode);
    
    // Asegurar signo coherente con el tipo
    const finalAmt = editForm.type === 'ND' ? -Math.abs(editForm.amount) : Math.abs(editForm.amount);

    onUpdateTransaction(id, {
      accountCode: editForm.accountCode,
      accountName: acctItem ? acctItem.name : 'Personalizada',
      description: editForm.description,
      reference: editForm.reference,
      amount: finalAmt,
      type: editForm.type,
      isManuallyEdited: true,
    });

    setEditingId(null);
    setEditForm(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleAddManualRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim() || !newAmt) return;

    const num = parseFloat(newAmt.replace(/\./g, '').replace(',', '.'));
    if (isNaN(num)) return;

    const finalAmt = newType === 'ND' ? -Math.abs(num) : Math.abs(num);
    const acct = planCuentas.find(c => c.code === newAcct);

    const newTx: Transaction = {
      id: `manual-${Date.now()}`,
      accountCode: newAcct,
      accountName: acct ? acct.name : 'Personalizada',
      description: newDesc.trim(),
      reference: newRef.trim() || '0',
      amount: finalAmt,
      type: newType,
      ruleMatched: 'Entrada Manual',
      isManuallyEdited: true,
    };

    onAddTransaction(newTx);
    setShowAddModal(false);
    setNewDesc('');
    setNewRef('');
    setNewAmt('');
  };

  return (
    <div id="transaction-table-container" className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      
      {/* Barra de Controles y Filtros */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#F8FAFC]">
        
        {/* Pestañas de Filtro Tipo */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="filter-all"
            type="button"
            onClick={() => {
              setTypeFilter('ALL');
              if (filterUnclassifiedOnly) onClearFilterUnclassified();
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              typeFilter === 'ALL' && !filterUnclassifiedOnly
                ? 'bg-[#0B3B60] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            Todas ({transactions.length})
          </button>

          <button
            id="filter-nc"
            type="button"
            onClick={() => {
              setTypeFilter('NC');
              if (filterUnclassifiedOnly) onClearFilterUnclassified();
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              typeFilter === 'NC' && !filterUnclassifiedOnly
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            Créditos NC ({transactions.filter(t => t.type === 'NC' || t.amount > 0).length})
          </button>

          <button
            id="filter-nd"
            type="button"
            onClick={() => {
              setTypeFilter('ND');
              if (filterUnclassifiedOnly) onClearFilterUnclassified();
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              typeFilter === 'ND' && !filterUnclassifiedOnly
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Débitos ND ({transactions.filter(t => t.type === 'ND' || t.amount < 0).length})
          </button>

          {/* Botón Filtro Pendientes */}
          {transactions.some(t => t.accountCode === 'SIN CLASIFICAR') && (
            <button
              id="filter-pending-btn"
              type="button"
              onClick={onClearFilterUnclassified}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                filterUnclassifiedOnly
                  ? 'bg-amber-500 text-white ring-2 ring-amber-300 shadow-xs'
                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Pendientes ({transactions.filter(t => t.accountCode === 'SIN CLASIFICAR').length})</span>
              {filterUnclassifiedOnly && <span className="text-[10px] ml-1">✕</span>}
            </button>
          )}
        </div>

        {/* Acciones Principales y Búsqueda */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Campo de Búsqueda */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-transactions-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por concepto, ref..."
              className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-full outline-none focus:border-[#0B3B60] focus:ring-2 focus:ring-[#0B3B60]/10 text-slate-700"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Re-clasificar con motor */}
          {transactions.length > 0 && (
            <button
              id="btn-reclassify-all"
              type="button"
              onClick={onReclassifyAll}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-full text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 cursor-pointer shadow-2xs"
              title="Volver a aplicar las reglas a todas las transacciones"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Re-aplicar Reglas</span>
            </button>
          )}

          {/* Agregar fila manual */}
          <button
            id="btn-add-row-manual"
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-full text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Nueva Fila</span>
          </button>

          {/* Botón Ver Asientos / Exportar Excel */}
          <button
            id="btn-open-export-preview"
            type="button"
            onClick={onOpenExportPreview}
            disabled={transactions.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-black text-white bg-[#0B3B60] hover:bg-[#082a45] disabled:opacity-50 transition-all shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#A2D2FF]" />
            <span>Generar Asientos Excel</span>
          </button>
        </div>

      </div>

      {/* Tabla de Movimientos */}
      <div className="overflow-x-auto">
        <table id="transactions-data-table" className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#F8FAFC] text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
            <tr>
              <th className="p-3 w-10 text-center">#</th>
              <th className="p-3 w-40">Cuenta Contable</th>
              <th className="p-3 min-w-[280px]">Descripción / Concepto</th>
              <th className="p-3 w-16 text-center">Tipo</th>
              <th className="p-3 w-28">Referencia</th>
              <th className="p-3 w-36 text-right">Monto (Bs.)</th>
              <th className="p-3 w-44">Regla Aplicada</th>
              <th className="p-3 w-16 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Layers className="w-8 h-8 text-slate-300" />
                    <p className="font-semibold text-sm">No hay transacciones que coincidan con el filtro</p>
                    <p className="text-xs">Carga un extracto bancario o presiona "Cargar Ejemplo (PDF Mercantil)" arriba.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx, idx) => {
                const isEditing = editingId === tx.id;
                const isNC = tx.type === 'NC' || tx.amount > 0;
                const isUnclassified = tx.accountCode === 'SIN CLASIFICAR';

                if (isEditing && editForm) {
                  return (
                    <tr key={tx.id} className="bg-sky-50/50 border-y-2 border-sky-300">
                      <td className="p-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-2">
                        <select
                          value={editForm.accountCode}
                          onChange={(e) => setEditForm({ ...editForm, accountCode: e.target.value })}
                          className="w-full text-xs font-mono p-1.5 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#0B3B60]"
                        >
                          {planCuentas.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.code} - {c.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#0B3B60]"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <select
                          value={editForm.type}
                          onChange={(e) => setEditForm({ ...editForm, type: e.target.value as TransactionType })}
                          className="text-xs font-bold p-1 bg-white border border-slate-300 rounded-lg outline-none"
                        >
                          <option value="NC">NC</option>
                          <option value="ND">ND</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={editForm.reference}
                          onChange={(e) => setEditForm({ ...editForm, reference: e.target.value })}
                          className="w-full text-xs font-mono p-1.5 bg-white border border-slate-300 rounded-lg outline-none"
                        />
                      </td>
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={Math.abs(editForm.amount)}
                          onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })}
                          className="w-full text-xs font-mono text-right p-1.5 bg-white border border-slate-300 rounded-lg outline-none"
                        />
                      </td>
                      <td className="p-2 text-xs text-slate-400 italic">Editando...</td>
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(tx.id)}
                            className="p-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer"
                            title="Guardar cambios"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                            title="Cancelar edición"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={tx.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      isUnclassified ? 'bg-amber-50/50' : ''
                    }`}
                  >
                    <td className="p-2.5 text-center text-slate-400 text-[11px] font-mono">{idx + 1}</td>
                    <td className="p-2.5">
                      <div className="flex flex-col">
                        <span className={`font-mono font-bold ${isUnclassified ? 'text-amber-700 underline' : 'text-slate-800'}`}>
                          {tx.accountCode}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                          {tx.accountName || ''}
                        </span>
                      </div>
                    </td>
                    <td className="p-2.5 font-sans font-medium text-slate-700">
                      <div>{tx.description}</div>
                      <div className="flex flex-wrap items-center gap-1 mt-0.5">
                        {tx.sheetName && (
                          <span className="inline-block text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 rounded">
                            {tx.sheetName}
                          </span>
                        )}
                        {tx.isManuallyEdited && (
                          <span className="inline-block text-[9px] font-bold text-sky-600 bg-sky-50 px-1.5 rounded">
                            Editado manualmente
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isNC
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-slate-500 text-[11px]">
                      {tx.reference || '-'}
                    </td>
                    <td
                      className={`p-2.5 text-right font-mono font-bold ${
                        isNC ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {formatVenezuelanMoney(tx.amount)}
                    </td>
                    <td className="p-2.5">
                      <span className="text-[11px] text-slate-500 block truncate max-w-[180px]" title={tx.ruleMatched}>
                        {tx.ruleMatched || '-'}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(tx)}
                          className="p-1 rounded text-slate-400 hover:text-[#0B3B60] hover:bg-slate-100 cursor-pointer transition-colors"
                          title="Editar fila"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                          title="Eliminar fila"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Barra Inferior con Total de la Vista */}
      <div className="p-4 border-t border-slate-100 bg-[#F8FAFC] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="text-slate-500">
          Mostrando <span className="font-bold text-slate-700">{filteredTransactions.length}</span> de <span className="font-bold text-slate-700">{transactions.length}</span> registros
        </div>
        <div className="flex items-center gap-3 font-mono">
          <span className="text-slate-400">Total filtrado:</span>
          <span className={`text-sm font-black ${currentTotal >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatVenezuelanMoney(currentTotal)} Bs.
          </span>
        </div>
      </div>

      {/* Modal para agregar fila manual */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#F8FAFC]">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                Agregar Movimiento Bancario Manual
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddManualRow} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Descripción / Concepto</label>
                <input
                  type="text"
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Ej: Transferencia a Inversiones XYZ"
                  className="w-full text-xs p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[#0B3B60]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de Movimiento</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as TransactionType)}
                    className="w-full text-xs p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl outline-none font-bold"
                  >
                    <option value="ND">ND - Nota Débito (Egreso -)</option>
                    <option value="NC">NC - Nota Crédito (Ingreso +)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Referencia</label>
                  <input
                    type="text"
                    value={newRef}
                    onChange={(e) => setNewRef(e.target.value)}
                    placeholder="Ej: 00123456"
                    className="w-full text-xs font-mono p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Monto en Bolívares (Bs.)</label>
                <input
                  type="text"
                  required
                  value={newAmt}
                  onChange={(e) => setNewAmt(e.target.value)}
                  placeholder="Ej: 150000,50"
                  className="w-full text-xs font-mono p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Cuenta Contable (VEN-NIF)</label>
                <select
                  value={newAcct}
                  onChange={(e) => setNewAcct(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl outline-none"
                >
                  {planCuentas.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.name} ({c.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full text-xs font-bold text-white bg-[#0B3B60] hover:bg-[#082a45] shadow-xs cursor-pointer"
                >
                  Agregar a la Lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
