import * as XLSX from 'xlsx';
import { BankConfig, Transaction } from '../types';

export type ExcelRow = [string, string, string, string | number, number | string];

export interface SheetsDataResult {
  sheet1NCData: ExcelRow[];
  sheet2NDData: ExcelRow[];
  sheet3ConsolidatedData: ExcelRow[];
  // Alias de compatibilidad
  sheetNCData: ExcelRow[];
  sheetNDData: ExcelRow[];
  sheetAllData: ExcelRow[];
  totalNC: number;
  totalND: number;
  netBalance: number;
}

/**
 * Prepara los datos tabulares para las 3 hojas del archivo Excel según las reglas del usuario:
 * - Hoja 1: Todas las NC, depósitos y transferencias que ingresan al banco (en 1.1.1.2.60 en positivo)
 *   y al final una línea resumen de contrapartida a 1.1.2.1.10 CUENTAS POR COBRAR en negativo (-),
 *   dando como total del asiento exactamente 0,00 Bs.
 * - Hoja 2: Todas las ND (comisiones, proveedores, impuestos, etc.) en positivo (+) y su contrapartida
 *   1.1.1.2.60 Banco Mercantil en negativo (-), cumpliendo partida doble y sumando 0,00 Bs.
 * - Hoja 3: Asiento consolidado que copia la Hoja 1 y la Hoja 2 en una sola hoja con el asiento completo.
 */
export function prepareSheetsData(
  transactions: Transaction[],
  config: BankConfig
): SheetsDataResult {
  const bankAccount = config.bankAccountCode || '1.1.1.2.60';
  const receivableAccount = config.receivableAccountCode || '1.1.2.1.10';

  // Encabezados estándar de 5 columnas
  const headers: ExcelRow = ['Cuenta Contable', 'Descripción', 'Tipo', 'Referencia', 'Monto'];

  // =========================================================================
  // 1. HOJA 1: NOTAS DE CRÉDITO, DEPÓSITOS Y TRANSFERENCIAS (INGRESOS AL BANCO)
  // =========================================================================
  const sheet1NCData: ExcelRow[] = [headers];
  const ncTransactions = transactions.filter(t => t.type === 'NC' || t.amount > 0);

  let totalNC = 0;

  // Primero todas las operaciones de dinero ingresado al banco
  for (const tx of ncTransactions) {
    const amt = Math.abs(tx.amount);
    totalNC += amt;

    sheet1NCData.push([
      bankAccount,
      tx.description,
      'NC',
      tx.reference || '0',
      amt,
    ]);
  }

  // Al final: línea resumen de contrapartida a CUENTAS POR COBRAR (1.1.2.1.10) en negativo
  if (ncTransactions.length > 0) {
    sheet1NCData.push([
      receivableAccount,
      'CUENTAS POR COBRAR',
      'NC',
      '0',
      -Number(totalNC.toFixed(2)),
    ]);
  }

  // =========================================================================
  // 2. HOJA 2: NOTAS DE DÉBITO (EGRESOS / COMISIONES, PROVEEDORES, IMPUESTOS)
  // =========================================================================
  const sheet2NDData: ExcelRow[] = [headers];
  const ndTransactions = transactions.filter(t => t.type === 'ND' || t.amount < 0);

  let totalND = 0;

  for (const tx of ndTransactions) {
    const positiveAmt = Math.abs(tx.amount);
    totalND += tx.amount; // suma negativa original

    const classifiedAccount = tx.accountCode || 'SIN CLASIFICAR';

    // 1) Concepto (comisiones, proveedores, impuestos, etc.) en POSITIVO (+)
    sheet2NDData.push([
      classifiedAccount,
      tx.description,
      'ND',
      tx.reference || '0',
      positiveAmt,
    ]);

    // 2) Contrapartida: cuenta de banco 1.1.1.2.60 BANCO MERCANTIL en NEGATIVO (-)
    sheet2NDData.push([
      bankAccount,
      tx.description,
      'ND',
      tx.reference || '0',
      -positiveAmt,
    ]);
  }

  // =========================================================================
  // 3. HOJA 3: COPIA DE LA HOJA 1 Y LA HOJA 2 EN UNA SOLA HOJA (ASIENTO COMPLETO)
  // =========================================================================
  const sheet3ConsolidatedData: ExcelRow[] = [
    headers,
    ...sheet1NCData.slice(1), // Filas de la Hoja 1
    ...sheet2NDData.slice(1), // Filas de la Hoja 2
  ];

  return {
    sheet1NCData,
    sheet2NDData,
    sheet3ConsolidatedData,
    // Alias para compatibilidad con componentes existentes
    sheetNCData: sheet1NCData,
    sheetNDData: sheet2NDData,
    sheetAllData: sheet3ConsolidatedData,
    totalNC,
    totalND,
    netBalance: totalNC + totalND,
  };
}

/**
 * Genera y descarga el archivo Excel completo (.xlsx) con las 3 hojas formateadas
 */
export function exportToExcel(
  transactions: Transaction[],
  config: BankConfig
): void {
  const { sheet1NCData, sheet2NDData, sheet3ConsolidatedData } = prepareSheetsData(transactions, config);

  const wb = XLSX.utils.book_new();

  // Helper para crear hoja con anchos de columnas
  const createFormattedWorksheet = (data: ExcelRow[]) => {
    const ws = XLSX.utils.aoa_to_sheet(data);

    ws['!cols'] = [
      { wch: 18 }, // Cuenta Contable
      { wch: 50 }, // Descripción
      { wch: 8 },  // Tipo
      { wch: 16 }, // Referencia
      { wch: 20 }, // Monto
    ];

    return ws;
  };

  // Hoja 1: Todas las NC / Depósitos / Transferencias + Línea resumen contrapartida Cuentas por Cobrar (1.1.2.1.10)
  const ws1 = createFormattedWorksheet(sheet1NCData);
  XLSX.utils.book_append_sheet(wb, ws1, 'Hoja 1 - NC Ingresos');

  // Hoja 2: Todas las ND (Conceptos en positivo y Banco Mercantil 1.1.1.2.60 en negativo)
  const ws2 = createFormattedWorksheet(sheet2NDData);
  XLSX.utils.book_append_sheet(wb, ws2, 'Hoja 2 - ND Egresos');

  // Hoja 3: Asiento Consolidado Completo (Copia de Hoja 1 + Hoja 2)
  const ws3 = createFormattedWorksheet(sheet3ConsolidatedData);
  XLSX.utils.book_append_sheet(wb, ws3, 'Hoja 3 - Asiento Consolidado');

  // Generar nombre de archivo con fecha y empresa
  const cleanCompanyName = (config.companyName || 'Empresa').replace(/[^\w\s-]/gi, '').trim().replace(/\s+/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `Asiento_Contable_${cleanCompanyName}_${dateStr}.xlsx`;

  XLSX.writeFile(wb, fileName);
}
