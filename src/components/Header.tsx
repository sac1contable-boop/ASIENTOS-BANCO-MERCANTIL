import React from 'react';
import { Building2, Landmark, BookOpen, SlidersHorizontal, Users, Plus } from 'lucide-react';
import { BankConfig, Company } from '../types';
import { CompanySelector } from './CompanySelector';

interface HeaderProps {
  companies: Company[];
  activeCompany: Company;
  onSelectCompany: (id: string) => void;
  onOpenCompanyModal: () => void;
  onOpenCreateCompany: () => void;
  onConfigChange: (config: BankConfig) => void;
  onOpenRules: () => void;
  onOpenPlanCuentas: () => void;
  totalTransactions: number;
}

export const Header: React.FC<HeaderProps> = ({
  companies,
  activeCompany,
  onSelectCompany,
  onOpenCompanyModal,
  onOpenCreateCompany,
  onConfigChange,
  onOpenRules,
  onOpenPlanCuentas,
  totalTransactions,
}) => {
  const config = activeCompany.bankConfig;

  return (
    <header id="main-header" className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3.5 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        
        {/* Logo y Marca Banco Mercantil */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-[#0B3B60] rounded-2xl flex items-center justify-center font-black text-white text-sm flex-shrink-0 shadow-sm border border-[#082942]">
            <span className="tracking-tighter">BM</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-800 tracking-tight leading-tight">
                Asistente Contable Banco Mercantil
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E1F0FA] text-[#0B3B60] border border-[#B8DCF5]">
                MULTI-EMPRESAS
              </span>
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-1.5 mt-0.5">
              <span>VEN-NIF</span>
              <span className="text-slate-300">•</span>
              <span>Partida Doble (3 Hojas)</span>
              <span className="text-slate-300">•</span>
              <span>Venezuela</span>
            </p>
          </div>
        </div>

        {/* Selector de Empresas y Controles Rápidos */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Selector Desplegable de Empresa Activa */}
          <CompanySelector
            companies={companies}
            activeCompany={activeCompany}
            onSelectCompany={onSelectCompany}
            onOpenCompanyModal={onOpenCompanyModal}
            onOpenCreateCompany={onOpenCreateCompany}
          />

          {/* Botón Gestión de Empresas */}
          <button
            id="btn-open-companies-manager"
            type="button"
            onClick={onOpenCompanyModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all border border-slate-200/80 shadow-2xs cursor-pointer"
            title="Administrar todas las empresas, editar RIF y exportar asientos"
          >
            <Users className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Empresas</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 text-slate-700 font-bold">
              {companies.length}
            </span>
          </button>

          {/* Código Cuenta Banco Mercantil */}
          <div className="flex items-center gap-2 bg-[#F8FAFC] border border-slate-200/80 rounded-2xl px-3 py-1.5 focus-within:border-[#0B3B60] focus-within:ring-2 focus-within:ring-[#0B3B60]/15 transition-all" title="Cuenta contable de Banco Mercantil para débitos y créditos">
            <Landmark className="w-4 h-4 text-[#0B3B60] flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Cuenta Mercantil</span>
              <input
                id="input-bank-account-code"
                type="text"
                value={config.bankAccountCode}
                onChange={(e) => onConfigChange({ ...config, bankAccountCode: e.target.value })}
                title={config.bankAccountName}
                className="text-xs font-mono font-semibold text-slate-700 bg-transparent outline-none w-24"
              />
            </div>
          </div>

          {/* Botones de Modales Auxiliares */}
          <div className="flex items-center gap-2 ml-auto lg:ml-0">
            <button
              id="btn-open-plan-cuentas"
              type="button"
              onClick={onOpenPlanCuentas}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-all border border-slate-200/80 shadow-2xs cursor-pointer"
              title="Ver y configurar catálogo de cuentas contables"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden xl:inline">Plan de Cuentas</span>
            </button>

            <button
              id="btn-open-rules"
              type="button"
              onClick={onOpenRules}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#0B3B60] bg-[#E1F0FA] hover:bg-[#cde4f7] rounded-full transition-all border border-[#B8DCF5] shadow-2xs cursor-pointer"
              title="Consultar motor de reglas contables de Banco Mercantil"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#0B3B60]" />
              <span className="hidden xl:inline">Reglas Mercantil</span>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};

