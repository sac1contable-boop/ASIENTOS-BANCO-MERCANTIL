import React, { useState } from 'react';
import { 
  X, Building2, Plus, CheckCircle2, FileSpreadsheet, Download, 
  Trash2, Edit3, Landmark, ArrowDownLeft, ArrowUpRight, Scale, AlertCircle, RotateCcw
} from 'lucide-react';
import { Company, BankConfig } from '../types';
import { exportToExcel } from '../services/excelExport';
import { formatVenezuelanMoney } from '../services/parser';

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  activeCompanyId: string;
  onSelectCompany: (id: string) => void;
  onCreateCompany: (company: Company) => void;
  onUpdateCompany: (id: string, updated: Partial<Company>) => void;
  onDeleteCompany: (id: string) => void;
  onResetDefaultCompanies: () => void;
}

export const CompanyModal: React.FC<CompanyModalProps> = ({
  isOpen,
  onClose,
  companies,
  activeCompanyId,
  onSelectCompany,
  onCreateCompany,
  onUpdateCompany,
  onDeleteCompany,
  onResetDefaultCompanies,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);

  // Formulario de nueva empresa
  const [newName, setNewName] = useState('');
  const [newRifPrefix, setNewRifPrefix] = useState('J');
  const [newRifNumber, setNewRifNumber] = useState('');
  const [newBankAccount, setNewBankAccount] = useState('1.1.1.2.60');
  const [newReceivableAccount, setNewReceivableAccount] = useState('1.1.2.1.10');
  const [newNotes, setNewNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Formulario de edición
  const [editName, setEditName] = useState('');
  const [editRif, setEditRif] = useState('');
  const [editBankAccount, setEditBankAccount] = useState('');
  const [editReceivableAccount, setEditReceivableAccount] = useState('');

  if (!isOpen) return null;

  const handleStartEdit = (company: Company) => {
    setEditingCompanyId(company.id);
    setEditName(company.name);
    setEditRif(company.rif);
    setEditBankAccount(company.bankConfig.bankAccountCode);
    setEditReceivableAccount(company.bankConfig.receivableAccountCode);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;

    onUpdateCompany(id, {
      name: editName.trim(),
      rif: editRif.trim(),
      bankConfig: {
        bankName: 'Banco Mercantil',
        bankAccountCode: editBankAccount.trim() || '1.1.1.2.60',
        bankAccountName: 'Banco Mercantil C.A.',
        receivableAccountCode: editReceivableAccount.trim() || '1.1.2.1.10',
        receivableAccountName: 'Cuentas por Cobrar',
        companyName: editName.trim(),
        rif: editRif.trim(),
      },
    });

    setEditingCompanyId(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newName.trim()) {
      setFormError('El nombre de la empresa / razón social es obligatorio.');
      return;
    }

    const fullRif = newRifNumber.trim() ? `${newRifPrefix}-${newRifNumber.trim()}` : '';

    const newCompany: Company = {
      id: `empresa-${Date.now()}`,
      name: newName.trim(),
      rif: fullRif,
      bankConfig: {
        bankName: 'Banco Mercantil',
        bankAccountCode: newBankAccount.trim() || '1.1.1.2.60',
        bankAccountName: 'Banco Mercantil C.A.',
        receivableAccountCode: newReceivableAccount.trim() || '1.1.2.1.10',
        receivableAccountName: 'Cuentas por Cobrar',
        companyName: newName.trim(),
        rif: fullRif,
      },
      transactions: [],
      createdAt: new Date().toISOString(),
      notes: newNotes.trim() || undefined,
    };

    onCreateCompany(newCompany);
    onSelectCompany(newCompany.id);

    // Limpiar formulario y volver a la lista
    setNewName('');
    setNewRifNumber('');
    setNewBankAccount('1.1.1.2.60');
    setNewReceivableAccount('1.1.2.1.10');
    setNewNotes('');
    setActiveTab('list');
  };

  // Descargar Excel individual de cualquier empresa
  const handleDownloadExcel = (company: Company) => {
    if (company.transactions.length === 0) {
      alert(`La empresa "${company.name}" no posee transacciones para exportar.`);
      return;
    }
    exportToExcel(company.transactions, company.bankConfig);
  };

  // Exportar todas las empresas con transacciones
  const handleExportAllCompanies = () => {
    const withTx = companies.filter(c => c.transactions.length > 0);
    if (withTx.length === 0) {
      alert('Ninguna empresa tiene transacciones para exportar.');
      return;
    }

    let delay = 0;
    withTx.forEach((comp) => {
      setTimeout(() => {
        exportToExcel(comp.transactions, comp.bankConfig);
      }, delay);
      delay += 400; // Espaciado entre descargas de navegador
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E1F0FA] text-[#0B3B60] flex items-center justify-center shadow-xs border border-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                Gestor Multi-Empresas (Banco Mercantil)
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#E1F0FA] text-[#0B3B60] font-bold border border-[#B8DCF5]">
                  {companies.length} Registradas
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Administra múltiples razones sociales con sus propios movimientos y genera sus asientos contables independientes
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

        {/* Pestañas / Barra de Acciones */}
        <div className="px-6 py-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-[#0B3B60] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Listado de Empresas ({companies.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Registrar Nueva Empresa</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportAllCompanies}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#0B3B60] bg-[#E1F0FA] hover:bg-[#cde4f7] border border-[#B8DCF5] transition-all cursor-pointer shadow-2xs"
              title="Descargar asientos contables en Excel para todas las empresas que contengan transacciones"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Asientos de Todas las Empresas</span>
            </button>
          </div>
        </div>

        {/* Contenido Modal */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC]">
          
          {/* VISTA 1: LISTADO DE EMPRESAS */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              {companies.map((company) => {
                const isActive = company.id === activeCompanyId;
                const isEditing = editingCompanyId === company.id;

                // Calcular totales de la empresa
                const totalNC = company.transactions
                  .filter(t => t.type === 'NC' || t.amount > 0)
                  .reduce((sum, t) => sum + Math.abs(t.amount), 0);
                const totalND = company.transactions
                  .filter(t => t.type === 'ND' || t.amount < 0)
                  .reduce((sum, t) => sum + t.amount, 0);
                const net = totalNC + totalND;
                const unclassified = company.transactions.filter(t => t.accountCode === 'SIN CLASIFICAR').length;

                return (
                  <div
                    key={company.id}
                    className={`bg-white rounded-2xl border transition-all p-5 shadow-2xs ${
                      isActive 
                        ? 'border-[#0B3B60] ring-2 ring-[#0B3B60]/10' 
                        : 'border-slate-200/90 hover:border-slate-300'
                    }`}
                  >
                    {isEditing ? (
                      /* Modo Edición */
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Nombre / Razón Social</label>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#0B3B60]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">RIF de la Empresa</label>
                            <input
                              type="text"
                              value={editRif}
                              onChange={(e) => setEditRif(e.target.value)}
                              placeholder="Ej: J-50494135-2"
                              className="w-full text-xs font-mono p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#0B3B60]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Código Cuenta Banco Mercantil</label>
                            <input
                              type="text"
                              value={editBankAccount}
                              onChange={(e) => setEditBankAccount(e.target.value)}
                              className="w-full text-xs font-mono p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#0B3B60]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Código Cuentas por Cobrar (Cuadre)</label>
                            <input
                              type="text"
                              value={editReceivableAccount}
                              onChange={(e) => setEditReceivableAccount(e.target.value)}
                              className="w-full text-xs font-mono p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#0B3B60]"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setEditingCompanyId(null)}
                            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-full"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(company.id)}
                            className="px-4 py-1.5 text-xs font-bold text-white bg-[#0B3B60] hover:bg-[#082a45] rounded-full shadow-xs"
                          >
                            Guardar Cambios
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Modo Vista Normal */
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        
                        {/* Info Principal Empresa */}
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 font-black text-sm shadow-xs ${
                            isActive
                              ? 'bg-[#0B3B60] text-white'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {company.name.slice(0, 2).toUpperCase()}
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-800">
                                {company.name}
                              </h4>
                              {company.rif && (
                                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                  {company.rif}
                                </span>
                              )}
                              {isActive && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Empresa Activa
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2 font-mono">
                              <span>Cuenta Mercantil: <strong className="text-slate-700">{company.bankConfig.bankAccountCode}</strong></span>
                              <span className="text-slate-300">•</span>
                              <span>Cobros: <strong className="text-slate-700">{company.bankConfig.receivableAccountCode}</strong></span>
                              {company.notes && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="font-sans text-slate-400 italic truncate max-w-xs">{company.notes}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Métricas Financieras de la Empresa */}
                        <div className="flex flex-wrap items-center gap-3 bg-[#F8FAFC] border border-slate-100 rounded-2xl p-2.5 text-xs font-mono">
                          <div className="px-2">
                            <span className="block text-[10px] text-slate-400 font-sans font-semibold uppercase">Movimientos</span>
                            <span className="font-bold text-slate-700">{company.transactions.length}</span>
                            {unclassified > 0 && (
                              <span className="ml-1 text-[10px] text-amber-700 bg-amber-100 px-1 py-0.2 rounded font-bold">
                                {unclassified} pend.
                              </span>
                            )}
                          </div>

                          <div className="h-6 w-px bg-slate-200"></div>

                          <div className="px-2">
                            <span className="block text-[10px] text-emerald-600 font-sans font-semibold uppercase">Créditos NC</span>
                            <span className="font-bold text-emerald-700">+{formatVenezuelanMoney(totalNC)}</span>
                          </div>

                          <div className="h-6 w-px bg-slate-200"></div>

                          <div className="px-2">
                            <span className="block text-[10px] text-rose-600 font-sans font-semibold uppercase">Débitos ND</span>
                            <span className="font-bold text-rose-700">{formatVenezuelanMoney(totalND)}</span>
                          </div>

                          <div className="h-6 w-px bg-slate-200"></div>

                          <div className="px-2">
                            <span className="block text-[10px] text-slate-400 font-sans font-semibold uppercase">Saldo Neto</span>
                            <span className={`font-black ${net >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                              {formatVenezuelanMoney(net)}
                            </span>
                          </div>
                        </div>

                        {/* Botones de Acción para cada Empresa */}
                        <div className="flex items-center gap-2">
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectCompany(company.id);
                                onClose();
                              }}
                              className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-[#0B3B60] hover:bg-[#082a45] transition-all shadow-xs cursor-pointer"
                              title="Cambiar el espacio de trabajo a esta empresa"
                            >
                              Seleccionar
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDownloadExcel(company)}
                            disabled={company.transactions.length === 0}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-all border border-slate-200 cursor-pointer"
                            title="Generar y descargar archivo Excel de asientos contables (3 Hojas)"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                            <span className="hidden sm:inline">Descargar Asientos</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStartEdit(company)}
                            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Editar empresa"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {companies.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`¿Estás seguro de eliminar la empresa "${company.name}" y todos sus movimientos?`)) {
                                  onDeleteCompany(company.id);
                                }
                              }}
                              className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Eliminar empresa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* VISTA 2: FORMULARIO REGISTRAR NUEVA EMPRESA */}
          {activeTab === 'create' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs max-w-2xl mx-auto">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-[#0B3B60]" />
                Registrar Nueva Empresa para Asientos Contables
              </h4>
              <p className="text-xs text-slate-500 mb-5">
                Ingresa los datos fiscales y las cuentas contables VEN-NIF correspondientes para la nueva razón social.
              </p>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Razón Social / Nombre Comercial *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ej: Inversiones Los Roques, C.A."
                    className="w-full text-xs p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[#0B3B60]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Prefijo RIF</label>
                    <select
                      value={newRifPrefix}
                      onChange={(e) => setNewRifPrefix(e.target.value)}
                      className="w-full text-xs p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl outline-none font-bold"
                    >
                      <option value="J">J - Jurídico</option>
                      <option value="G">G - Gubernamental</option>
                      <option value="V">V - Natural Venezolano</option>
                      <option value="E">E - Natural Extranjero</option>
                      <option value="C">C - Comuna / Cooperativa</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Número de RIF</label>
                    <input
                      type="text"
                      value={newRifNumber}
                      onChange={(e) => setNewRifNumber(e.target.value)}
                      placeholder="Ej: 50494135-2"
                      className="w-full text-xs font-mono p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[#0B3B60]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Cuenta Contable Banco Mercantil
                    </label>
                    <input
                      type="text"
                      required
                      value={newBankAccount}
                      onChange={(e) => setNewBankAccount(e.target.value)}
                      placeholder="1.1.1.2.60"
                      className="w-full text-xs font-mono p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[#0B3B60]"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Cuenta de activo para entradas (+) y salidas (-) bancarias
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Cuenta Contrapartida Cuentas por Cobrar
                    </label>
                    <input
                      type="text"
                      required
                      value={newReceivableAccount}
                      onChange={(e) => setNewReceivableAccount(e.target.value)}
                      placeholder="1.1.2.1.10"
                      className="w-full text-xs font-mono p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[#0B3B60]"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Fila totalizadora en Hoja 2 para cuadre a 0,00 Bs.
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Notas u Observaciones (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Ej: Sucursal Oriente, cuenta de recaudación en bolívares..."
                    className="w-full text-xs p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[#0B3B60]"
                  />
                </div>

                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveTab('list')}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 text-xs font-black text-white bg-[#0B3B60] hover:bg-[#082a45] rounded-full shadow-xs cursor-pointer"
                  >
                    Guardar y Activar Empresa
                  </button>
                </div>

              </form>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('¿Deseas restablecer las empresas predefinidas de ejemplo?')) {
                onResetDefaultCompanies();
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Empresas de Muestra</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-full text-xs font-bold text-white bg-[#0B3B60] hover:bg-[#082a45] transition-colors cursor-pointer shadow-xs"
          >
            Cerrar Gestor
          </button>
        </div>

      </div>
    </div>
  );
};
