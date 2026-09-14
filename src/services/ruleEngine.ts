import { AccountItem, BankConfig, ClassificationRule, Transaction, TransactionType } from '../types';
import { RawRow } from './parser';

export interface ClassificationResult {
  accountCode: string;
  accountName: string;
  ruleMatched: string;
  isUnclassified: boolean;
}

/**
 * Normaliza cadenas de texto para comparaciones insensibles a mayúsculas, acentos y signos de puntuación
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Motor de Clasificación Contable para Banco Mercantil
 */
export function classifyTransaction(
  description: string,
  amount: number,
  type: TransactionType,
  config: BankConfig,
  customRules: ClassificationRule[] = [],
  planCuentas: AccountItem[] = []
): ClassificationResult {
  const norm = normalizeText(description);
  const isPositive = amount > 0 || type === 'NC';

  // Buscar nombre de la cuenta en el plan
  const getAccountName = (code: string, fallback: string): string => {
    const found = planCuentas.find(c => c.code === code);
    return found ? found.name : fallback;
  };

  // 1. REGLAS PERSONALIZADAS DEL USUARIO (Prioridad alta si existen)
  for (const rule of customRules.filter(r => r.isCustom)) {
    const matchesCondition =
      rule.conditionType === 'ANY' ||
      (rule.conditionType === 'NC' && isPositive) ||
      (rule.conditionType === 'ND' && !isPositive);

    if (matchesCondition) {
      const match = rule.keywords.some(kw => norm.includes(normalizeText(kw)));
      if (match) {
        return {
          accountCode: rule.targetAccount,
          accountName: rule.targetAccountName || getAccountName(rule.targetAccount, 'Personalizada'),
          ruleMatched: `Regla Personalizada: ${rule.name}`,
          isUnclassified: rule.targetAccount === 'SIN CLASIFICAR',
        };
      }
    }
  }

  // 2. REGLA 2: PRÉSTAMOS POR PAGAR (2.1.1.1.20) - Monto POSITIVO (+)
  // Si es un abono/desembolso de préstamo bancario
  if (
    isPositive &&
    (norm.includes('prestamo nro') ||
      norm.includes('prestamo no') ||
      norm.includes('abono de prestamo') ||
      norm.includes('abono del prestamo') ||
      norm.includes('abono al prestamo') ||
      norm.includes('abono del capital') ||
      norm.includes('abono de capital') ||
      norm.includes('abono al capital') ||
      norm.includes('abono a capital') ||
      norm.includes('abono capital') ||
      norm.includes('desembolso prestamo') ||
      norm.includes('credito bancario otorgado'))
  ) {
    return {
      accountCode: '2.1.1.1.20',
      accountName: getAccountName('2.1.1.1.20', 'Préstamos por Pagar'),
      ruleMatched: 'Regla 2: Préstamos por Pagar (2.1.1.1.20)',
      isUnclassified: false,
    };
  }

  // 3. REGLA 1: INGRESOS - BANCO MERCANTIL (1.1.1.2.60) - Monto POSITIVO (+)
  if (isPositive) {
    return {
      accountCode: config.bankAccountCode || '1.1.1.2.60',
      accountName: getAccountName(config.bankAccountCode || '1.1.1.2.60', 'Banco Mercantil'),
      ruleMatched: 'Regla 1: Ingresos Banco Mercantil',
      isUnclassified: false,
    };
  }

  // PARA MONTOS NEGATIVOS (-) (ND / Notas de Débito):

  // 4. REGLA 5: TIMBRES FISCALES - 6.1.2.1.64
  if (norm.includes('timbre fiscal') || norm.includes('ley de timbre fiscal')) {
    return {
      accountCode: '6.1.2.1.64',
      accountName: getAccountName('6.1.2.1.64', 'Ley de Timbre Fiscal sobre Préstamo'),
      ruleMatched: 'Regla 5: Timbres Fiscales (6.1.2.1.64)',
      isUnclassified: false,
    };
  }

  // 5. REGLA 4B: GASTOS BANCARIOS E INTERESES POR PRÉSTAMOS - 6.1.2.5.03
  if (
    norm.includes('interes') ||
    norm.includes('gastos bancarios') ||
    norm.includes('gasto bancario') ||
    norm.includes('cobro comision lcc') ||
    norm.includes('comision flat credito') ||
    norm.includes('comision flat') ||
    norm.includes('comision por servicio en me') ||
    norm.includes('servicio en me')
  ) {
    return {
      accountCode: '6.1.2.5.03',
      accountName: getAccountName('6.1.2.5.03', 'Gastos Bancarios'),
      ruleMatched: 'Regla 4B: Gastos Bancarios / Intereses (6.1.2.5.03)',
      isUnclassified: false,
    };
  }

  // 6. REGLA 2: ABONO DEL CAPITAL DEL PRÉSTAMO / AMORTIZACIÓN A PRÉSTAMOS - 2.1.1.1.20 (ND / Débitos)
  if (
    norm.includes('abono del capital') ||
    norm.includes('abono de capital') ||
    norm.includes('abono al capital') ||
    norm.includes('abono a capital') ||
    norm.includes('abono capital') ||
    norm.includes('amortizacion de capital') ||
    norm.includes('amortizacion capital') ||
    norm.includes('amortizacion de prestamo') ||
    norm.includes('amortizacion prestamo') ||
    norm.includes('cobro capital') ||
    norm.includes('pago capital') ||
    norm.includes('cuota capital') ||
    norm.includes('debito capital') ||
    (norm.includes('capital') && norm.includes('prestamo')) ||
    (norm.includes('abono') && norm.includes('prestamo') && !norm.includes('angelo') && !norm.includes('cristian')) ||
    (norm.includes('cuota') && norm.includes('prestamo') && !norm.includes('interes'))
  ) {
    return {
      accountCode: '2.1.1.1.20',
      accountName: getAccountName('2.1.1.1.20', 'Préstamos por Pagar'),
      ruleMatched: 'Regla 2: Abono a Capital Préstamo (2.1.1.1.20)',
      isUnclassified: false,
    };
  }

  // 7. REGLA 4A: COMISIONES BANCARIAS ORDINARIAS - 6.1.2.5.02
  // Debe chequearse antes de Angelo Vanegas / socios si la descripción contiene "comisión"
  if (
    norm.includes('comision') ||
    norm.includes('tarifa mantenimiento') ||
    norm.includes('emision edo. de cta') ||
    norm.includes('emision edo de cta') ||
    norm.includes('emision estado de cuenta') ||
    norm.includes('operacion de alto valor')
  ) {
    return {
      accountCode: '6.1.2.5.02',
      accountName: getAccountName('6.1.2.5.02', 'Comisiones Bancarias Ordinarias'),
      ruleMatched: 'Regla 4: Comisiones Bancarias (6.1.2.5.02)',
      isUnclassified: false,
    };
  }

  // 7. REGLA 7: CUENTAS POR COBRAR SOCIOS - 1.1.2.2.30
  if (
    norm.includes('angelo vanegas') ||
    norm.includes('cristian vanegas') ||
    norm.includes('vanegas becerra cristian')
  ) {
    return {
      accountCode: '1.1.2.2.30',
      accountName: getAccountName('1.1.2.2.30', 'Cuentas por Cobrar Socios'),
      ruleMatched: 'Regla 7: Cuentas por Cobrar Socios (1.1.2.2.30)',
      isUnclassified: false,
    };
  }

  // 8. REGLA 6: IMPUESTOS Y CONTRIBUCIONES SENIAT / ALCALDÍAS
  // 6a. ISLR Personas Naturales - 2.1.2.2.10
  if (norm.includes('islr26') || norm.includes('islr personas')) {
    return {
      accountCode: '2.1.2.2.10',
      accountName: getAccountName('2.1.2.2.10', 'ISLR Personas (ISLR26)'),
      ruleMatched: 'Regla 6: Impuestos - ISLR Personas (ISLR26)',
      isUnclassified: false,
    };
  }

  // 6b. IGTF - 2.1.2.2.20
  if (norm.includes('igtf21') || norm.includes('igtf')) {
    return {
      accountCode: '2.1.2.2.20',
      accountName: getAccountName('2.1.2.2.20', 'IGTF por Pagar (IGTF21)'),
      ruleMatched: 'Regla 6: Impuestos - IGTF21',
      isUnclassified: false,
    };
  }

  // 6c. ISLR Salarios / Sueldos (SENIAT ISLR 74 / Forma 99074) - 2.1.2.3.10
  if (
    norm.includes('islr 74') ||
    norm.includes('islr74') ||
    norm.includes('islr-74') ||
    norm.includes('islr - 74') ||
    norm.includes('doc. islr 74') ||
    norm.includes('doc islr 74') ||
    norm.includes('doc. islr74') ||
    norm.includes('doc islr74') ||
    norm.includes('retencion de salarios') ||
    norm.includes('retención de salarios') ||
    norm.includes('retencion salarios') ||
    norm.includes('retención salarios') ||
    norm.includes('retencion de sueldos') ||
    norm.includes('retención de sueldos') ||
    norm.includes('retencion sueldos') ||
    norm.includes('retención sueldos') ||
    norm.includes('forma 99074') ||
    norm.includes('forma 74') ||
    (norm.includes('j504941352') && (norm.includes('74') || norm.includes('salario') || norm.includes('sueldo')))
  ) {
    return {
      accountCode: '2.1.2.3.10',
      accountName: getAccountName('2.1.2.3.10', 'Retención Salarios ISLR74'),
      ruleMatched: 'Regla 6: Retención Salarios ISLR74 (2.1.2.3.10)',
      isUnclassified: false,
    };
  }

  // 6d. Retención de IVA (SENIAT IVA 35) - 2.1.2.3.15
  if (
    norm.includes('iva 35') ||
    norm.includes('iva35') ||
    norm.includes('iva-35') ||
    norm.includes('iva - 35') ||
    norm.includes('doc. iva 35') ||
    norm.includes('doc iva 35') ||
    norm.includes('doc. iva35') ||
    norm.includes('doc iva35') ||
    norm.includes('regimen de retencion de iva') ||
    norm.includes('regimen de retención de iva') ||
    norm.includes('regimen de retencion del iva') ||
    norm.includes('regimen de retención del iva') ||
    norm.includes('regimen retencion iva') ||
    norm.includes('regimen retencion del iva') ||
    norm.includes('retencion de iva') ||
    norm.includes('retención de iva') ||
    norm.includes('retencion del iva') ||
    norm.includes('retención del iva') ||
    norm.includes('retencion iva') ||
    norm.includes('retención iva') ||
    (norm.includes('j504941352') && (norm.includes('iva 35') || norm.includes('iva35') || (norm.includes('iva') && norm.includes('retencion')) || (norm.includes('35') && !norm.includes('iva30'))))
  ) {
    return {
      accountCode: '2.1.2.3.15',
      accountName: getAccountName('2.1.2.3.15', 'Retención de IVA (IVA35)'),
      ruleMatched: 'Regla 6: Retención IVA35 (2.1.2.3.15)',
      isUnclassified: false,
    };
  }

  // 6e. Pensiones DPP 19 (Contribución Especial Ley de Protección a las Pensiones SENIAT) - 6.1.1.2.19
  if (
    norm.includes('dpp 19') ||
    norm.includes('dpp19') ||
    norm.includes('dpp-19') ||
    norm.includes('dpp - 19') ||
    norm.includes('doc. dpp 19') ||
    norm.includes('doc dpp 19') ||
    norm.includes('doc. dpp19') ||
    norm.includes('doc dpp19') ||
    norm.includes('proteccion a las pensiones') ||
    norm.includes('proteccion de las pensiones') ||
    norm.includes('proteccion de pensiones') ||
    norm.includes('proteccion pensiones') ||
    norm.includes('declaracion proteccion a las pensiones') ||
    norm.includes('declaracion proteccion de las pensiones') ||
    norm.includes('declaracion proteccion pensiones') ||
    norm.includes('declaracion pensiones') ||
    norm.includes('ley de proteccion de pensiones') ||
    norm.includes('ley proteccion pensiones') ||
    norm.includes('contribucion especial pensiones') ||
    (norm.includes('j504941352') && (norm.includes('dpp') || norm.includes('pension') || norm.includes('19'))) ||
    (norm.includes('seniat') && (norm.includes('pension') || norm.includes('dpp 19') || norm.includes('dpp19') || norm.includes('dpp')))
  ) {
    return {
      accountCode: '6.1.1.2.19',
      accountName: getAccountName('6.1.1.2.19', 'Protección Pensiones DPP19'),
      ruleMatched: 'Regla 6: Contribución Especial Pensiones (6.1.1.2.19)',
      isUnclassified: false,
    };
  }

  // 6f. Alcaldía Simón Bolívar / Impuestos Municipales - 6.1.2.1.40
  if (norm.includes('alcaldia') || norm.includes('alcaldía') || norm.includes('simon bolivar') || norm.includes('simón bolívar')) {
    return {
      accountCode: '6.1.2.1.40',
      accountName: getAccountName('6.1.2.1.40', 'Impuestos Municipales (Alcaldías)'),
      ruleMatched: 'Regla 6: Impuestos - Alcaldía Municipal',
      isUnclassified: false,
    };
  }

  // 6g. ISLR Anticipo (IVA44) - 1.2.4.2.30
  if (
    norm.includes('iva44') ||
    norm.includes('islr anticipo') ||
    norm.includes('islr declarado por anticipado') ||
    (norm.includes('pago seniat') && norm.includes('anticipado'))
  ) {
    return {
      accountCode: '1.2.4.2.30',
      accountName: getAccountName('1.2.4.2.30', 'ISLR Anticipo (IVA44)'),
      ruleMatched: 'Regla 6: Impuestos - Anticipo IVA44',
      isUnclassified: false,
    };
  }

  // 9. REGLA 3: PROVEEDORES NACIONALES - 2.1.1.1.10
  // Incluye compras con IVA30 (SENIAT IVA30 Impuesto al Valor Agregado ordinario de proveedores),
  // transferencias a proveedores (Roll It Tires, Duncan, Agroruedas Chakao, Llantex, Scorpion, etc.)
  // y transferencias salientes generales
  if (
    norm.includes('iva30') ||
    norm.includes('roll it tires') ||
    norm.includes('osglbtr') ||
    norm.includes('sglbtr') ||
    norm.includes('oceano pacifico') ||
    norm.includes('scorpion tyres') ||
    norm.includes('walid nizar') ||
    norm.includes('yenni pavique') ||
    norm.includes('acumuladores duncan') ||
    norm.includes('agroruedas chakao') ||
    norm.includes('cauchos la mundial') ||
    norm.includes('becerra andres') ||
    norm.includes('llantex') ||
    norm.includes('credito inmediato') ||
    norm.includes('transf. a') ||
    norm.includes('transf a') ||
    norm.includes('transferencia a') ||
    norm.includes('transferencia –') ||
    norm.includes('transferencia -') ||
    norm.includes('transferencia desde cuenta')
  ) {
    return {
      accountCode: '2.1.1.1.10',
      accountName: getAccountName('2.1.1.1.10', 'Proveedores Nacionales'),
      ruleMatched: 'Regla 3: Proveedores Nacionales (2.1.1.1.10)',
      isUnclassified: false,
    };
  }

  // 10. SIN CLASIFICAR (Para revisión manual)
  return {
    accountCode: 'SIN CLASIFICAR',
    accountName: 'Partida Pendiente de Revisión',
    ruleMatched: 'Ninguna regla coincidente (Revisión manual)',
    isUnclassified: true,
  };
}

/**
 * Transforma filas crudas en transacciones clasificadas
 */
export function processRawRows(
  rows: RawRow[],
  config: BankConfig,
  customRules: ClassificationRule[] = [],
  planCuentas: AccountItem[] = []
): Transaction[] {
  return rows.map((row, idx) => {
    const isPositive = row.amount >= 0;
    const type: TransactionType = row.type || (isPositive ? 'NC' : 'ND');
    
    // Asegurar signos correctos: montos de ND son negativos en el modelo interno
    const normalizedAmount = type === 'ND' ? -Math.abs(row.amount) : Math.abs(row.amount);

    const classification = classifyTransaction(
      row.description,
      normalizedAmount,
      type,
      config,
      customRules,
      planCuentas
    );

    return {
      id: `tx-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      accountCode: classification.accountCode,
      accountName: classification.accountName,
      description: row.description,
      type,
      reference: row.reference || '0',
      amount: normalizedAmount,
      date: row.date,
      ruleMatched: classification.ruleMatched,
      isManuallyEdited: false,
      sheetName: row.sheetName,
    };
  });
}
