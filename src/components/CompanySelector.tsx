import React, { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Plus, Settings2, Check, FileSpreadsheet } from 'lucide-react';
import { Company } from '../types';

interface CompanySelectorProps {
  companies: Company[];
  activeCompany: Company;
  onSelectCompany: (id: string) => void;
  onOpenCompanyModal: () => void;
  onOpenCreateCompany: () => void;
}

export const CompanySelector: React.FC<CompanySelectorProps> = ({
  companies,
  activeCompany,
  onSelectCompany,
  onOpenCompanyModal,
  onOpenCreateCompany,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón Principal Selector */}
      <button
        id="btn-company-selector-toggle"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 bg-[#F8FAFC] hover:bg-slate-100/80 border border-slate-200/90 rounded-2xl px-3 py-1.5 transition-all text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0B3B60]/15"
      >
        <div className="w-8 h-8 rounded-xl bg-[#0B3B60] text-white flex items-center justify-center font-bold text-xs shadow-2xs flex-shrink-0">
          <Building2 className="w-4 h-4 text-white" />
        </div>

        <div className="flex flex-col min-w-0 pr-1">
          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 leading-none">
            Empresa Activa ({companies.length})
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs font-bold text-slate-800 truncate max-w-[150px] sm:max-w-[200px]">
              {activeCompany.name}
            </span>
            {activeCompany.rif && (
              <span className="hidden sm:inline-block text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-200/70 text-slate-600">
                {activeCompany.rif}
              </span>
            )}
          </div>
        </div>

        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Menú Desplegable con Listado de Empresas */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          <div className="px-4 py-3 bg-[#F8FAFC] border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Seleccionar Empresa
            </span>
            <span className="text-[11px] text-slate-400">
              {companies.length} disponibles
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
            {companies.map((comp) => {
              const isSelected = comp.id === activeCompany.id;
              const txCount = comp.transactions.length;

              return (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => {
                    onSelectCompany(comp.id);
                    setIsOpen(false);
                  }}
                  className={`w-full p-3 text-left flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected ? 'bg-sky-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] flex-shrink-0 ${
                      isSelected ? 'bg-[#0B3B60] text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {comp.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {comp.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                        <span>{comp.rif || 'Sin RIF'}</span>
                        <span>•</span>
                        <span>{txCount} mov.</span>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-[#0B3B60] flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Acciones del pie del dropdown */}
          <div className="p-2.5 bg-[#F8FAFC] border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenCreateCompany();
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-700 hover:bg-emerald-50 border border-emerald-200 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Empresa</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenCompanyModal();
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Gestionar ({companies.length})</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
