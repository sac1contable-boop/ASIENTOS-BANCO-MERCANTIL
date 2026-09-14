import { Company } from '../types';
import { DEFAULT_COMPANIES } from '../data/defaultData';

const STORAGE_KEY_COMPANIES = 'mercantil_multiempresa_companies_v1';
const STORAGE_KEY_ACTIVE_COMPANY = 'mercantil_multiempresa_active_company_id_v1';

export function loadCompaniesFromStorage(): Company[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COMPANIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Asegurar que las empresas predefinidas (incluyendo NEUMATICOS AQUI VC, C.A.) existan en la lista
        const existingIds = new Set(parsed.map((c: Company) => c.id));
        const existingNames = new Set(parsed.map((c: Company) => c.name?.trim().toUpperCase()));

        const merged = [...parsed].map((comp: Company) => {
          // Actualizar transacciones existentes: Gastos Bancarios (intereses) y Préstamos por Pagar (abonos a capital)
          const updatedTxs = (comp.transactions || []).map(tx => {
            const descNorm = (tx.description || '').toLowerCase();
            const isDebit = tx.type === 'ND' || tx.amount < 0;
            const isInterestDebit = isDebit && (descNorm.includes('interes') || descNorm.includes('intereses'));
            
            const isCapitalPayment = isDebit && !isInterestDebit && (
              descNorm.includes('abono del capital') ||
              descNorm.includes('abono de capital') ||
              descNorm.includes('abono al capital') ||
              descNorm.includes('abono a capital') ||
              descNorm.includes('abono capital') ||
              descNorm.includes('amortizacion de capital') ||
              descNorm.includes('amortización de capital') ||
              descNorm.includes('amortizacion capital') ||
              descNorm.includes('amortización capital') ||
              descNorm.includes('amortizacion de prestamo') ||
              descNorm.includes('amortización de préstamo') ||
              descNorm.includes('cobro capital') ||
              descNorm.includes('pago capital') ||
              descNorm.includes('cuota capital') ||
              (descNorm.includes('capital') && descNorm.includes('prestamo')) ||
              (descNorm.includes('abono') && descNorm.includes('prestamo') && !descNorm.includes('angelo') && !descNorm.includes('cristian'))
            );

            if (tx.accountCode === '6.1.2.5.03') {
              return {
                ...tx,
                accountName: 'Gastos Bancarios',
              };
            }

            if (isInterestDebit && (tx.accountCode === 'SIN CLASIFICAR' || tx.accountCode === '2.1.1.1.20' || tx.accountCode === '6.1.2.5.02')) {
              return {
                ...tx,
                accountCode: '6.1.2.5.03',
                accountName: 'Gastos Bancarios',
                ruleMatched: 'Regla 4B: Gastos Bancarios / Intereses (6.1.2.5.03)',
              };
            }

            if (isCapitalPayment && (tx.accountCode === 'SIN CLASIFICAR' || tx.accountCode === '2.1.1.1.10' || tx.accountCode === '6.1.2.5.02')) {
              return {
                ...tx,
                accountCode: '2.1.1.1.20',
                accountName: 'Préstamos por Pagar',
                ruleMatched: 'Regla 2: Abono a Capital Préstamo (2.1.1.1.20)',
              };
            }

            const isPensionPayment = isDebit && (
              descNorm.includes('dpp 19') ||
              descNorm.includes('dpp19') ||
              descNorm.includes('dpp-19') ||
              descNorm.includes('pension') ||
              (descNorm.includes('j504941352') && (descNorm.includes('19') || descNorm.includes('dpp') || descNorm.includes('pension'))) ||
              descNorm.includes('proteccion a las pensiones') ||
              descNorm.includes('proteccion de las pensiones') ||
              descNorm.includes('proteccion de pensiones') ||
              descNorm.includes('proteccion pensiones')
            );

            if (isPensionPayment && (tx.accountCode === 'SIN CLASIFICAR' || tx.accountCode === '2.1.1.1.10' || tx.accountCode === '1.2.4.2.30' || tx.accountCode === '6.1.1.2.19')) {
              return {
                ...tx,
                accountCode: '6.1.1.2.19',
                accountName: 'Protección Pensiones DPP19',
                ruleMatched: 'Regla 6: Contribución Especial Pensiones (6.1.1.2.19)',
              };
            }

            const isIva35Payment = isDebit && (
              descNorm.includes('iva 35') ||
              descNorm.includes('iva35') ||
              descNorm.includes('iva-35') ||
              descNorm.includes('regimen de retencion de iva') ||
              descNorm.includes('regimen retencion iva') ||
              descNorm.includes('retencion de iva') ||
              (descNorm.includes('j504941352') && (descNorm.includes('35') || (descNorm.includes('iva') && descNorm.includes('retencion'))))
            );

            if (isIva35Payment && (tx.accountCode === 'SIN CLASIFICAR' || tx.accountCode === '2.1.1.1.10' || tx.accountCode === '2.1.2.3.15')) {
              return {
                ...tx,
                accountCode: '2.1.2.3.15',
                accountName: 'Retención de IVA (IVA35)',
                ruleMatched: 'Regla 6: Retención IVA35 (2.1.2.3.15)',
              };
            }

            const isIslr74Payment = isDebit && (
              descNorm.includes('islr 74') ||
              descNorm.includes('islr74') ||
              descNorm.includes('islr-74') ||
              descNorm.includes('retencion de salarios') ||
              descNorm.includes('retencion salarios') ||
              descNorm.includes('forma 99074') ||
              (descNorm.includes('j504941352') && (descNorm.includes('74') || descNorm.includes('salario') || descNorm.includes('sueldo')))
            );

            if (isIslr74Payment && (tx.accountCode === 'SIN CLASIFICAR' || tx.accountCode === '2.1.1.1.10' || tx.accountCode === '2.1.2.3.10')) {
              return {
                ...tx,
                accountCode: '2.1.2.3.10',
                accountName: 'Retención Salarios ISLR74',
                ruleMatched: 'Regla 6: Retención Salarios ISLR74 (2.1.2.3.10)',
              };
            }

            return tx;
          });

          return {
            ...comp,
            transactions: updatedTxs,
          };
        });

        for (const defComp of DEFAULT_COMPANIES) {
          if (!existingIds.has(defComp.id) && !existingNames.has(defComp.name.trim().toUpperCase())) {
            // Añadir al inicio si es NEUMATICOS AQUI VC, C.A. o al final
            if (defComp.id === 'empresa-neumaticos-aqui-vc') {
              merged.unshift(defComp);
            } else {
              merged.push(defComp);
            }
          }
        }
        return merged;
      }
    }
  } catch (err) {
    console.error('Error loading companies from localStorage:', err);
  }
  return DEFAULT_COMPANIES;
}

export function saveCompaniesToStorage(companies: Company[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_COMPANIES, JSON.stringify(companies));
  } catch (err) {
    console.error('Error saving companies to localStorage:', err);
  }
}

export function loadActiveCompanyIdFromStorage(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_COMPANY);
    if (saved && saved !== 'empresa-1') return saved;
  } catch (err) {
    console.error('Error reading active company id from localStorage:', err);
  }
  return 'empresa-neumaticos-aqui-vc';
}

export function saveActiveCompanyIdToStorage(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_COMPANY, id);
  } catch (err) {
    console.error('Error saving active company id to localStorage:', err);
  }
}
