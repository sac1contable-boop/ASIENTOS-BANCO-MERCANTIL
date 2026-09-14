import React, { useState } from 'react';
import { X, BookOpen, Plus, CheckCircle, ShieldCheck, Tag, ArrowRight } from 'lucide-react';
import { ClassificationRule, AccountItem } from '../types';

interface ReglasModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: ClassificationRule[];
  planCuentas: AccountItem[];
  onAddCustomRule: (rule: ClassificationRule) => void;
}

export const ReglasModal: React.FC<ReglasModalProps> = ({
  isOpen,
  onClose,
  rules,
  planCuentas,
  onAddCustomRule,
}) => {
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [targetAccount, setTargetAccount] = useState('2.1.1.1.10');
  const [conditionType, setConditionType] = useState<'NC' | 'ND' | 'ANY'>('ND');
  const [keywordsStr, setKeywordsStr] = useState('');

  if (!isOpen) return null;

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim() || !keywordsStr.trim()) return;

    const kws = keywordsStr.split(',').map(k => k.trim()).filter(Boolean);
    const acct = planCuentas.find(c => c.code === targetAccount);

    const newRule: ClassificationRule = {
      id: `custom-rule-${Date.now()}`,
      ruleNumber: 99,
      name: ruleName.trim(),
      conditionType,
      targetAccount,
      targetAccountName: acct ? acct.name : 'Personalizada',
      keywords: kws,
      isCustom: true,
    };

    onAddCustomRule(newRule);
    setShowAddCustom(false);
    setRuleName('');
    setKeywordsStr('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E1F0FA] text-[#0B3B60] flex items-center justify-center shadow-xs border border-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Reglas de Clasificación Contable Banco Mercantil
              </h3>
              <p className="text-xs text-slate-500">
                Orden de prioridad y criterios oficiales establecidos para el estado de cuenta
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

        {/* Resumen del orden de ejecución */}
        <div className="px-6 py-3 bg-[#0B3B60] text-white flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#A2D2FF]" />
            <span className="font-semibold">
              Prioridad estricta (1 a 7): Ingresos (+) &gt; Préstamos (+) &gt; Proveedores (-) &gt; Comisiones (-) &gt; Timbres (-) &gt; Impuestos (-) &gt; Socios (-)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowAddCustom(!showAddCustom)}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 hover:bg-white/25 rounded-full text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddCustom ? 'Cerrar formulario' : 'Añadir Regla Personalizada'}</span>
          </button>
        </div>

        {/* Formulario para regla personalizada */}
        {showAddCustom && (
          <form onSubmit={handleCreateCustom} className="p-5 bg-sky-50/70 border-b border-sky-200 animate-in fade-in duration-150">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B3B60] mb-2.5">
              Nueva Regla Personalizada
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-4">
                <input
                  type="text"
                  required
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="Nombre de la regla (ej: Proveedor Local)"
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#0B3B60]"
                />
              </div>
              <div className="sm:col-span-3">
                <select
                  value={targetAccount}
                  onChange={(e) => setTargetAccount(e.target.value)}
                  className="w-full text-xs font-mono p-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#0B3B60]"
                >
                  {planCuentas.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <select
                  value={conditionType}
                  onChange={(e) => setConditionType(e.target.value as 'NC' | 'ND' | 'ANY')}
                  className="w-full text-xs font-bold p-2 bg-white border border-slate-200 rounded-xl outline-none"
                >
                  <option value="ND">ND (Negativo -)</option>
                  <option value="NC">NC (Positivo +)</option>
                  <option value="ANY">Cualquier Signo</option>
                </select>
              </div>
              <div className="sm:col-span-3 flex gap-2">
                <button
                  type="submit"
                  className="w-full py-2 px-3 rounded-full text-xs font-bold text-white bg-[#0B3B60] hover:bg-[#082a45] shadow-xs cursor-pointer"
                >
                  Guardar Regla
                </button>
              </div>
              <div className="sm:col-span-12">
                <input
                  type="text"
                  required
                  value={keywordsStr}
                  onChange={(e) => setKeywordsStr(e.target.value)}
                  placeholder="Palabras clave separadas por comas (ej: ferreteria, repuestos automotriz, santiago perez)"
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl outline-none"
                />
              </div>
            </div>
          </form>
        )}

        {/* Lista de Reglas Oficiales */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC] space-y-4">
          
          {/* Regla 1 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">
                  1
                </span>
                <h4 className="text-sm font-bold text-slate-800">
                  REGLA 1: INGRESOS - CUENTA 1.1.1.2.60 BANCO MERCANTIL
                </h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Condición: Monto POSITIVO (+) · NC
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Se aplica a todos los ingresos entrantes bancarios: Crédito Inmediato Cámara de Compensación, Orden de Pago según Instrucciones, Pago Móvil Comercial / Interbancario, Recepción Pago Móvil, Transf. CCE (Transveal, Mendez, Multiservicios, Fruits Oriente), Transferencias Recibidas (Cta.***6530, ***1661, ***4278, ***5482, ***6757).
            </p>
          </div>

          {/* Regla 2 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-black flex items-center justify-center">
                  2
                </span>
                <h4 className="text-sm font-bold text-slate-800">
                  REGLA 2: PRÉSTAMOS POR PAGAR Y ABONOS A CAPITAL - CUENTA 2.1.1.1.20
                </h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                Condición: ND (-) y NC (+) · Ambos
              </span>
            </div>
            <div className="text-xs text-slate-600 mt-2 space-y-2">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Abono del Capital del Préstamo (ND · Notas de Débito):
                </div>
                <p className="text-slate-500">
                  Identifica cobros y pagos de amortización de capital bancario: <code className="bg-white px-1 py-0.5 rounded font-mono text-[11px] text-slate-700 border border-slate-200">"Abono del Capital del Préstamo"</code>, <code className="bg-white px-1 py-0.5 rounded font-mono text-[11px] text-slate-700 border border-slate-200">"Abono a Capital"</code>, <code className="bg-white px-1 py-0.5 rounded font-mono text-[11px] text-slate-700 border border-slate-200">"Amortización de Capital"</code>, <code className="bg-white px-1 py-0.5 rounded font-mono text-[11px] text-slate-700 border border-slate-200">"Cobro/Pago Capital Préstamo"</code>. Genera cargo en el <strong>Debe</strong> de <strong className="text-slate-800 font-mono">2.1.1.1.20 Préstamos por Pagar</strong> (disminución del pasivo financiero) con contrapartida en el <strong>Haber</strong> de 1.1.1.2.60 Banco Mercantil.
                </p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Desembolso / Ingreso por Préstamo (NC · Notas de Crédito):
                </div>
                <p className="text-slate-500">
                  Identifica desembolsos de créditos recibidos: <code className="bg-white px-1 py-0.5 rounded font-mono text-[11px] text-slate-700 border border-slate-200">"Préstamo Nro."</code>, <code className="bg-white px-1 py-0.5 rounded font-mono text-[11px] text-slate-700 border border-slate-200">"Abono de Préstamo"</code>. Genera abono en el <strong>Haber</strong> de <strong className="text-slate-800 font-mono">2.1.1.1.20 Préstamos por Pagar</strong> (registro del pasivo) con cargo en el <strong>Debe</strong> de 1.1.1.2.60 Banco Mercantil.
                </p>
              </div>
            </div>
          </div>

          {/* Regla 3 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-black flex items-center justify-center">
                  3
                </span>
                <h4 className="text-sm font-bold text-slate-800">
                  REGLA 3: PROVEEDORES - CUENTA 2.1.1.1.10
                </h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                Condición: Monto NEGATIVO (-) · ND
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Compras comerciales y servicios de proveedores: Roll It Tires, Crédito Inmediato, OSGLBTR, SGLBTR, SENIAT IVA30 (Impuesto al Valor Agregado ordinario compras), Oceano Pacífico Sur, Scorpion Tyres, Walid Nizar El Fakih, Yenni Pavique, Acumuladores Duncan, Agroruedas Chakao, Cauchos La Mundial, Becerra Andres, Llantex CA, etc.
            </p>
          </div>

          {/* Regla 4 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-black flex items-center justify-center">
                  4
                </span>
                <h4 className="text-sm font-bold text-slate-800">
                  REGLA 4: GASTOS Y COMISIONES BANCARIAS - CUENTAS 6.1.2.5.02 Y 6.1.2.5.03
                </h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                Condición: Monto NEGATIVO (-) · ND
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-2 space-y-1">
              <div>
                <strong className="text-slate-700">6.1.2.5.02 Comisiones Ordinarias:</strong> Comisión Crédito Inmediato, Comisión Pago Móvil Comercial / Interbancario, Comisión por Transferencia a Terceros / Fondos, Emisión Estado de Cuenta Moneda Nacional/Ext., Tarifa Mantenimiento de Cuenta.
              </div>
              <div>
                <strong className="text-slate-700">6.1.2.5.03 Gastos Bancarios:</strong> Intereses por Préstamos bancarios, Cobro Comisión LCC, Comisión Flat Crédito (0,50%), Comisión por Servicio en ME (Moneda Extranjera).
              </div>
            </div>
          </div>

          {/* Regla 5 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-800 text-xs font-black flex items-center justify-center">
                  5
                </span>
                <h4 className="text-sm font-bold text-slate-800">
                  REGLA 5: TIMBRES FISCALES - CUENTA 6.1.2.1.64
                </h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                Condición: Monto NEGATIVO (-) · ND
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Condición: Contiene <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px] text-slate-700">"Ley de Timbre Fiscal sobre Préstamo"</code>.
            </p>
          </div>

          {/* Regla 6 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 text-xs font-black flex items-center justify-center">
                  6
                </span>
                <h4 className="text-sm font-bold text-slate-800">
                  REGLA 6: IMPUESTOS Y CONTRIBUCIONES TRIBUTARIAS
                </h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                Condición: Monto NEGATIVO (-) · ND
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="bg-[#F8FAFC] p-2 rounded-xl border border-slate-100">
                <span className="font-mono font-bold text-slate-700">2.1.2.2.10:</span> ISLR Personas (ISLR26)
              </div>
              <div className="bg-[#F8FAFC] p-2 rounded-xl border border-slate-100">
                <span className="font-mono font-bold text-slate-700">2.1.2.2.20:</span> IGTF21 (Grandes Transacciones)
              </div>
              <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-slate-100 col-span-1 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-800">2.1.2.3.15:</span>
                    <span className="font-semibold text-slate-800">Retención de IVA (IVA 35 · SENIAT)</span>
                  </div>
                  <span className="text-[10px] bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded border border-blue-200">
                    RIF J504941352 · IVA 35
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Pagos al SENIAT: <code className="bg-white px-1 py-0.5 rounded font-mono text-[10px] text-slate-700 border border-slate-200">"PAGO AL SENIAT RIF J504941352 - IVA 35 - REGIMEN DE RETENCION DE IVA"</code>, retenciones de IVA proveedores a pasivo corriente.
                </p>
              </div>
              <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-slate-100 col-span-1 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-800">2.1.2.3.10:</span>
                    <span className="font-semibold text-slate-800">Retención Salarios ISLR (ISLR 74 · SENIAT)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                    RIF J504941352 · ISLR 74
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Pagos al SENIAT: <code className="bg-white px-1 py-0.5 rounded font-mono text-[10px] text-slate-700 border border-slate-200">"PAGO AL SENIAT RIF J504941352 - ISLR 74 - RETENCION DE SALARIOS"</code> (Forma 99074), retención de sueldos y salarios a pasivo corriente.
                </p>
              </div>
              <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-slate-100 col-span-1 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-800">6.1.1.2.19:</span>
                    <span className="font-semibold text-slate-800">Protección Pensiones DPP 19 (SENIAT)</span>
                  </div>
                  <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200">
                    RIF J504941352 · DPP 19
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Pagos al SENIAT: <code className="bg-white px-1 py-0.5 rounded font-mono text-[10px] text-slate-700 border border-slate-200">"PAGO AL SENIAT RIF J504941352 - DPP 19 - DECLARACION PROTECCION A LAS PENSIONES"</code>, contribución especial Ley de Protección de Pensiones.
                </p>
              </div>
              <div className="bg-[#F8FAFC] p-2 rounded-xl border border-slate-100">
                <span className="font-mono font-bold text-slate-700">6.1.2.1.40:</span> Alcaldía Simón Bolívar
              </div>
              <div className="bg-[#F8FAFC] p-2 rounded-xl border border-slate-100 col-span-1 sm:col-span-2">
                <span className="font-mono font-bold text-slate-700">1.2.4.2.30:</span> ISLR Anticipo (IVA44 / Anticipado)
              </div>
            </div>
          </div>

          {/* Regla 7 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-black flex items-center justify-center">
                  7
                </span>
                <h4 className="text-sm font-bold text-slate-800">
                  REGLA 7: CUENTAS POR COBRAR SOCIOS - CUENTA 1.1.2.2.30
                </h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                Condición: Monto NEGATIVO (-) · ND
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Transferencias o desembolsos a socios de la empresa: Angelo Vanegas (préstamo sin comisión), Cristian Andrés Vanegas Becerra, etc.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-white">
          <span className="text-xs text-slate-500">
            Reglas sincronizadas con el manual operativo de Banco Mercantil
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-full text-xs font-bold text-white bg-[#0B3B60] hover:bg-[#082a45] transition-colors cursor-pointer shadow-xs"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};
