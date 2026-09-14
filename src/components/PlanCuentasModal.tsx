import React, { useState } from 'react';
import { X, SlidersHorizontal, Plus, Trash2, Search } from 'lucide-react';
import { AccountItem } from '../types';

interface PlanCuentasModalProps {
  isOpen: boolean;
  onClose: () => void;
  planCuentas: AccountItem[];
  onAddAccount: (account: AccountItem) => void;
  onDeleteAccount: (code: string) => void;
}

export const PlanCuentasModal: React.FC<PlanCuentasModalProps> = ({
  isOpen,
  onClose,
  planCuentas,
  onAddAccount,
  onDeleteAccount,
}) => {
  const [newCode, setNewCode] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newCategory, setNewCategory] = useState<AccountItem['category']>('Gasto');
  const [newDesc, setNewDesc] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) {
      setError('El código y el nombre de la cuenta son obligatorios.');
      return;
    }
    if (planCuentas.some(c => c.code.trim() === newCode.trim())) {
      setError('Ya existe una cuenta con este código contable.');
      return;
    }

    onAddAccount({
      code: newCode.trim(),
      name: newName.trim(),
      category: newCategory,
      description: newDesc.trim() || undefined,
    });

    setNewCode('');
    setNewName('');
    setNewDesc('');
    setError('');
  };

  const filteredAccounts = planCuentas.filter(c => {
    if (selectedCategory !== 'TODAS' && c.category !== selectedCategory) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E1F0FA] text-[#0B3B60] flex items-center justify-center shadow-xs border border-white">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Plan de Cuentas Contables (VEN-NIF)
              </h3>
              <p className="text-xs text-slate-500">
                Catálogo de cuentas para clasificación bancaria y generación de asientos
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

        {/* Formulario para agregar cuenta */}
        <div className="p-5 border-b border-slate-200 bg-white">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-[#0B3B60]" /> Agregar Nueva Cuenta al Catálogo
          </h4>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-3">
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="Código (ej: 6.1.2.5.10)"
                className="w-full text-xs font-mono p-2 bg-[#F8FAFC] border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[#0B3B60] text-slate-800"
              />
            </div>
            <div className="sm:col-span-4">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre de la cuenta"
                className="w-full text-xs p-2 bg-[#F8FAFC] border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[#0B3B60] text-slate-800"
              />
            </div>
            <div className="sm:col-span-3">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as AccountItem['category'])}
                className="w-full text-xs p-2 bg-[#F8FAFC] border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[#0B3B60] text-slate-700 font-semibold"
              >
                <option value="Activo">Activo</option>
                <option value="Pasivo">Pasivo</option>
                <option value="Patrimonio">Patrimonio</option>
                <option value="Ingreso">Ingreso</option>
                <option value="Gasto">Gasto</option>
                <option value="Especial">Especial</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full h-full py-2 px-3 rounded-full text-xs font-bold text-white bg-[#0B3B60] hover:bg-[#082a45] transition-all shadow-xs cursor-pointer"
              >
                Agregar
              </button>
            </div>
            {error && <p className="sm:col-span-12 text-xs text-rose-600 font-medium">{error}</p>}
          </form>
        </div>

        {/* Barra de Filtros de Cuentas */}
        <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-[#F8FAFC]">
          <div className="flex flex-wrap items-center gap-1.5">
            {['TODAS', 'Activo', 'Pasivo', 'Gasto', 'Ingreso', 'Especial'].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#0B3B60] text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Buscar cuenta..."
              className="w-full text-xs pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-full outline-none focus:border-[#0B3B60]"
            />
          </div>
        </div>

        {/* Lista de cuentas existentes */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC]">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead className="bg-[#F8FAFC] text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3 w-36 font-mono">Código</th>
                  <th className="p-3">Nombre de la Cuenta</th>
                  <th className="p-3 w-28 text-center">Tipo</th>
                  <th className="p-3 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAccounts.map((acct) => (
                  <tr key={acct.code} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2.5 font-mono font-bold text-slate-800">{acct.code}</td>
                    <td className="p-2.5 font-medium">
                      <div>{acct.name}</div>
                      {acct.description && (
                        <div className="text-[11px] text-slate-400 mt-0.5">{acct.description}</div>
                      )}
                    </td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          acct.category === 'Activo'
                            ? 'bg-sky-100 text-sky-800 border border-sky-200'
                            : acct.category === 'Pasivo'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : acct.category === 'Gasto'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : acct.category === 'Ingreso'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {acct.category}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      {acct.code !== 'SIN CLASIFICAR' && acct.code !== '1.1.1.2.60' && acct.code !== '1.1.2.1.10' && (
                        <button
                          type="button"
                          onClick={() => onDeleteAccount(acct.code)}
                          className="text-slate-300 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                          title="Eliminar del catálogo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-white">
          <p className="text-xs text-slate-500">
            Total de cuentas registradas: <span className="font-bold text-slate-700">{planCuentas.length}</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-full text-xs font-bold text-white bg-[#0B3B60] hover:bg-[#082a45] transition-colors cursor-pointer shadow-xs"
          >
            Listo
          </button>
        </div>

      </div>
    </div>
  );
};
