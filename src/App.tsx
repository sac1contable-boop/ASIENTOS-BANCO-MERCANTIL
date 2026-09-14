import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { MetricsCards } from './components/MetricsCards';
import { UploadSection } from './components/UploadSection';
import { TransactionTable } from './components/TransactionTable';
import { ExportPreviewModal } from './components/ExportPreviewModal';
import { PlanCuentasModal } from './components/PlanCuentasModal';
import { ReglasModal } from './components/ReglasModal';
import { CompanyModal } from './components/CompanyModal';
import { BankConfig, Transaction, AccountItem, ClassificationRule, Company } from './types';
import { DEFAULT_PLAN_CUENTAS, DEFAULT_RULES, DEFAULT_COMPANIES } from './data/defaultData';
import { classifyTransaction } from './services/ruleEngine';
import { 
  loadCompaniesFromStorage, 
  saveCompaniesToStorage, 
  loadActiveCompanyIdFromStorage, 
  saveActiveCompanyIdToStorage 
} from './services/storage';
import { Building2, Plus, Users, FileSpreadsheet, ArrowRight, Check } from 'lucide-react';
import { exportToExcel } from './services/excelExport';

export default function App() {
  // Lista de empresas y empresa activa
  const [companies, setCompanies] = useState<Company[]>(() => loadCompaniesFromStorage());
  const [activeCompanyId, setActiveCompanyId] = useState<string>(() => loadActiveCompanyIdFromStorage());

  // Catálogo de cuentas VEN-NIF (compartido / configurable)
  const [planCuentas, setPlanCuentas] = useState<AccountItem[]>(DEFAULT_PLAN_CUENTAS);

  // Reglas de clasificación
  const [rules, setRules] = useState<ClassificationRule[]>(DEFAULT_RULES);

  // Modales
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showPlanCuentasModal, setShowPlanCuentasModal] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showCompanyModal, setShowCompanyModal] = useState<boolean>(false);

  // Filtro de no clasificados
  const [filterUnclassifiedOnly, setFilterUnclassifiedOnly] = useState<boolean>(false);

  // Guardar en localStorage cuando cambie companies
  useEffect(() => {
    saveCompaniesToStorage(companies);
  }, [companies]);

  // Guardar en localStorage cuando cambie activeCompanyId
  useEffect(() => {
    saveActiveCompanyIdToStorage(activeCompanyId);
  }, [activeCompanyId]);

  // Empresa activa actual
  const activeCompany = useMemo(() => {
    return companies.find(c => c.id === activeCompanyId) || companies[0] || DEFAULT_COMPANIES[0];
  }, [companies, activeCompanyId]);

  const transactions = activeCompany.transactions || [];
  const config = activeCompany.bankConfig;

  // Cambiar configuración de banco de la empresa activa
  const handleConfigChange = (newConfig: BankConfig) => {
    setCompanies(prev =>
      prev.map(c =>
        c.id === activeCompany.id
          ? {
              ...c,
              name: newConfig.companyName || c.name,
              rif: newConfig.rif || c.rif,
              bankConfig: newConfig,
            }
          : c
      )
    );
  };

  // Métricas financieras calculadas para la empresa activa
  const metrics = useMemo(() => {
    let totalNC = 0;
    let totalND = 0;
    let unclassifiedCount = 0;

    for (const t of transactions) {
      if (t.type === 'NC' || t.amount > 0) {
        totalNC += Math.abs(t.amount);
      } else {
        totalND += t.amount;
      }

      if (t.accountCode === 'SIN CLASIFICAR') {
        unclassifiedCount++;
      }
    }

    return {
      totalNC,
      totalND,
      count: transactions.length,
      unclassifiedCount,
    };
  }, [transactions]);

  // Actualizar transacciones de la empresa activa
  const updateActiveCompanyTransactions = (
    updater: (prev: Transaction[]) => Transaction[]
  ) => {
    setCompanies(prev =>
      prev.map(c =>
        c.id === activeCompany.id
          ? { ...c, transactions: updater(c.transactions || []) }
          : c
      )
    );
  };

  // Actualizar una transacción
  const handleUpdateTransaction = (id: string, updated: Partial<Transaction>) => {
    updateActiveCompanyTransactions(prev =>
      prev.map(t => (t.id === id ? { ...t, ...updated } : t))
    );
  };

  // Eliminar transacción
  const handleDeleteTransaction = (id: string) => {
    updateActiveCompanyTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Agregar transacción manual
  const handleAddTransaction = (newTx: Transaction) => {
    updateActiveCompanyTransactions(prev => [newTx, ...prev]);
  };

  // Cargar transacciones desde archivo o muestra
  const handleTransactionsLoaded = (loaded: Transaction[]) => {
    updateActiveCompanyTransactions(() => loaded);
    setFilterUnclassifiedOnly(false);
  };

  // Limpiar transacciones de la empresa activa
  const handleClearTransactions = () => {
    if (window.confirm(`¿Deseas vaciar todas las transacciones de "${activeCompany.name}"?`)) {
      updateActiveCompanyTransactions(() => []);
    }
  };

  // Re-clasificar todas las transacciones con el motor de reglas actual
  const handleReclassifyAll = () => {
    updateActiveCompanyTransactions(prev =>
      prev.map(t => {
        if (t.isManuallyEdited) return t;

        const classification = classifyTransaction(
          t.description,
          t.amount,
          t.type,
          config,
          rules,
          planCuentas
        );

        return {
          ...t,
          accountCode: classification.accountCode,
          accountName: classification.accountName,
          ruleMatched: classification.ruleMatched,
        };
      })
    );
  };

  // Gestión de Empresas
  const handleCreateCompany = (newCompany: Company) => {
    setCompanies(prev => [...prev, newCompany]);
    setActiveCompanyId(newCompany.id);
  };

  const handleUpdateCompany = (id: string, updated: Partial<Company>) => {
    setCompanies(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updated } : c))
    );
  };

  const handleDeleteCompany = (id: string) => {
    if (companies.length <= 1) {
      alert('Debe existir al menos una empresa en el sistema.');
      return;
    }
    const remaining = companies.filter(c => c.id !== id);
    setCompanies(remaining);
    if (activeCompanyId === id) {
      setActiveCompanyId(remaining[0].id);
    }
  };

  const handleResetDefaultCompanies = () => {
    setCompanies(DEFAULT_COMPANIES);
    setActiveCompanyId(DEFAULT_COMPANIES[0].id);
  };

  // Agregar cuenta al catálogo
  const handleAddAccount = (account: AccountItem) => {
    setPlanCuentas(prev => [account, ...prev]);
  };

  // Eliminar cuenta del catálogo
  const handleDeleteAccount = (code: string) => {
    setPlanCuentas(prev => prev.filter(c => c.code !== code));
  };

  // Agregar regla personalizada
  const handleAddCustomRule = (rule: ClassificationRule) => {
    setRules(prev => [rule, ...prev]);
    setTimeout(() => {
      handleReclassifyAll();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans antialiased selection:bg-[#0B3B60] selection:text-white">
      
      {/* Header con Configuración Mercantil, Selector de Empresa y Modales */}
      <Header
        companies={companies}
        activeCompany={activeCompany}
        onSelectCompany={setActiveCompanyId}
        onOpenCompanyModal={() => setShowCompanyModal(true)}
        onOpenCreateCompany={() => setShowCompanyModal(true)}
        onConfigChange={handleConfigChange}
        onOpenRules={() => setShowRulesModal(true)}
        onOpenPlanCuentas={() => setShowPlanCuentasModal(true)}
        totalTransactions={transactions.length}
      />

      {/* Barra Rápida de Selección de Empresa (Bento / Tabs de Acceso Rápido) */}
      <div className="bg-white border-b border-slate-200/70 shadow-2xs px-4 sm:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Tabs de Empresas registradas */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1 flex-shrink-0">
              <Building2 className="w-3.5 h-3.5 text-[#0B3B60]" />
              <span className="hidden md:inline">Empresas:</span>
            </span>

            {companies.map(c => {
              const isSelected = c.id === activeCompany.id;
              const count = c.transactions?.length || 0;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCompanyId(c.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#0B3B60] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                  }`}
                >
                  <span className="truncate max-w-[130px] sm:max-w-[180px]">{c.name}</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {count}
                  </span>
                  {isSelected && <Check className="w-3 h-3 text-emerald-300" />}
                </button>
              );
            })}

            {/* Botón + Añadir Empresa Rápido */}
            <button
              type="button"
              onClick={() => setShowCompanyModal(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50 border border-emerald-200 transition-colors flex-shrink-0 cursor-pointer"
              title="Registrar nueva empresa"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nueva</span>
            </button>
          </div>

          {/* Acciones directas para la empresa activa */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              disabled={transactions.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer shadow-2xs disabled:opacity-40"
              title="Generar y descargar asiento contable para la empresa activa"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Generar Asiento de {activeCompany.name.split(',')[0]}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCompanyModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
              title="Abrir gestor multi-empresas"
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">Gestionar Empresas</span>
            </button>
          </div>

        </div>
      </div>

      {/* Contenedor Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6">
        
        {/* Tarjetas de Métricas de Cuadre */}
        <MetricsCards
          totalNC={metrics.totalNC}
          totalND={metrics.totalND}
          count={metrics.count}
          unclassifiedCount={metrics.unclassifiedCount}
          onFilterUnclassified={() => setFilterUnclassifiedOnly(!filterUnclassifiedOnly)}
          isFilteringUnclassified={filterUnclassifiedOnly}
        />

        {/* Sección de Carga de Estados de Cuenta */}
        <UploadSection
          config={config}
          customRules={rules}
          planCuentas={planCuentas}
          onTransactionsLoaded={handleTransactionsLoaded}
          onClearTransactions={handleClearTransactions}
          transactionsCount={transactions.length}
        />

        {/* Tabla Interactiva de Movimientos y Clasificación */}
        <TransactionTable
          transactions={transactions}
          planCuentas={planCuentas}
          config={config}
          onUpdateTransaction={handleUpdateTransaction}
          onDeleteTransaction={handleDeleteTransaction}
          onAddTransaction={handleAddTransaction}
          onOpenExportPreview={() => setShowExportModal(true)}
          onReclassifyAll={handleReclassifyAll}
          filterUnclassifiedOnly={filterUnclassifiedOnly}
          onClearFilterUnclassified={() => setFilterUnclassifiedOnly(false)}
        />

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 px-4 sm:px-8 text-center text-xs text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong className="text-slate-700">Banco Mercantil Venezuela</strong> · Sistema Contable Multi-Empresas y Partida Doble
          </div>
          <div>
            Cumplimiento de Principios de Contabilidad Generalmente Aceptados en Venezuela (VEN-NIF)
          </div>
        </div>
      </footer>

      {/* Modal de Vista Previa y Descarga de Excel (3 Hojas) */}
      <ExportPreviewModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        transactions={transactions}
        config={config}
      />

      {/* Modal de Gestión Multi-Empresas */}
      <CompanyModal
        isOpen={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        companies={companies}
        activeCompanyId={activeCompanyId}
        onSelectCompany={setActiveCompanyId}
        onCreateCompany={handleCreateCompany}
        onUpdateCompany={handleUpdateCompany}
        onDeleteCompany={handleDeleteCompany}
        onResetDefaultCompanies={handleResetDefaultCompanies}
      />

      {/* Modal del Plan de Cuentas */}
      <PlanCuentasModal
        isOpen={showPlanCuentasModal}
        onClose={() => setShowPlanCuentasModal(false)}
        planCuentas={planCuentas}
        onAddAccount={handleAddAccount}
        onDeleteAccount={handleDeleteAccount}
      />

      {/* Modal del Motor de Reglas Mercantil */}
      <ReglasModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        rules={rules}
        planCuentas={planCuentas}
        onAddCustomRule={handleAddCustomRule}
      />

    </div>
  );
}
