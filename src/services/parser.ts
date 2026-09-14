import * as XLSX from 'xlsx';
import { Transaction, TransactionType } from '../types';

/**
 * Formatea un número al estilo contable venezolano: 1.234.567,89
 */
export function formatVenezuelanMoney(amount: number, showDecimals: boolean = true): string {
  if (isNaN(amount)) return '0,00';
  
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  const fixed = absAmount.toFixed(showDecimals ? 2 : 0);
  const [intPart, decPart] = fixed.split('.');
  
  // Agregar punto de miles
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  const result = showDecimals ? `${formattedInt},${decPart}` : formattedInt;
  return isNegative ? `-${result}` : result;
}

/**
 * Parsea un monto de texto en formato venezolano (1.234.567,89) o internacional (1,234,567.89)
 */
export function parseVenezuelanMoney(raw: string | number | null | undefined): number {
  if (raw === null || raw === undefined) return 0;
  if (typeof raw === 'number') return isNaN(raw) ? 0 : raw;
  
  let str = String(raw).trim();
  if (!str) return 0;
  
  // Detectar signo negativo por paréntesis: (1.234,56) o -
  const isNegative = str.startsWith('-') || str.endsWith('-') || (str.startsWith('(') && str.endsWith(')'));
  
  // Quitar símbolos como Bs., BsS, $, (), espacios
  str = str.replace(/[^\d.,]/g, '');
  
  if (!str) return 0;
  
  // Determinar si el último separador es coma o punto
  const lastCommaIndex = str.lastIndexOf(',');
  const lastDotIndex = str.lastIndexOf('.');
  
  let normalizedStr = str;
  
  if (lastCommaIndex > lastDotIndex) {
    // Formato europeo/venezolano: 1.234.567,89 -> remover puntos, reemplazar coma por punto
    normalizedStr = str.replace(/\./g, '').replace(',', '.');
  } else if (lastDotIndex > lastCommaIndex) {
    // Formato internacional: 1,234,567.89 -> remover comas
    normalizedStr = str.replace(/,/g, '');
  }
  
  const parsed = parseFloat(normalizedStr);
  if (isNaN(parsed)) return 0;
  
  return isNegative ? -Math.abs(parsed) : Math.abs(parsed);
}

export interface RawRow {
  date?: string;
  description: string;
  reference?: string;
  amount: number;
  type?: TransactionType;
  sheetName?: string;
}

/**
 * Parsea un texto plano pegado por el usuario (tabuladores, punto y coma, o comas)
 */
export function parseRawText(text: string): RawRow[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const rows: RawRow[] = [];

  for (const line of lines) {
    // Detectar separador común: tab, ;, o múltiples espacios
    let parts: string[] = [];
    if (line.includes('\t')) {
      parts = line.split('\t').map(p => p.trim());
    } else if (line.includes(';')) {
      parts = line.split(';').map(p => p.trim());
    } else if (line.includes('|')) {
      parts = line.split('|').map(p => p.trim());
    } else if (line.includes(',')) {
      // Solo si parece CSV
      parts = line.split(',').map(p => p.trim());
    } else {
      // Múltiples espacios consecutivos
      parts = line.split(/\s{2,}/).map(p => p.trim());
    }

    if (parts.length < 2) continue;

    // Ignorar encabezados conocidos
    const headerKeywords = ['descripcion', 'descripción', 'cuenta contable', 'monto', 'saldo', 'referencia', 'tipo', 'fecha', 'debe', 'haber'];
    const isHeader = parts.some(p => headerKeywords.includes(p.toLowerCase()));
    if (isHeader && parts.length > 2) continue;

    // Tratar de deducir columnas
    // Casos comunes:
    // 1) Cuenta Contable | Descripción | Tipo | Referencia | Monto
    // 2) Fecha | Referencia | Descripción | Débito | Crédito | Saldo
    // 3) Fecha | Descripción | Referencia | Monto
    // 4) Descripción | Tipo | Referencia | Monto
    
    let description = '';
    let reference = '';
    let amount = 0;
    let type: TransactionType | undefined;
    let date: string | undefined;

    // Si tiene 5 columnas y la 1ra parece cuenta contable (e.g. 1.1.1.2.60)
    if (parts.length >= 5 && /^\d\.\d/.test(parts[0])) {
      description = parts[1];
      const rawType = parts[2].toUpperCase();
      type = (rawType.includes('NC') || rawType.includes('CR') || rawType.includes('HABER')) ? 'NC' : 'ND';
      reference = parts[3];
      amount = parseVenezuelanMoney(parts[4]);
      if (type === 'ND' && amount > 0) amount = -amount;
      if (type === 'NC' && amount < 0) amount = Math.abs(amount);
    } else if (parts.length >= 4) {
      // Buscar la columna numérica
      const amountsFound: { index: number; val: number }[] = [];
      parts.forEach((p, idx) => {
        const val = parseVenezuelanMoney(p);
        if (val !== 0 || p === '0' || p === '0,00' || p === '0.00') {
          // Confirmar que parece número
          if (/[\d]/.test(p)) {
            amountsFound.push({ index: idx, val });
          }
        }
      });

      if (amountsFound.length >= 1) {
        const lastAmt = amountsFound[amountsFound.length - 1];
        amount = lastAmt.val;

        // Si hay débito y crédito separados (por ejemplo: Débito en col 3, Crédito en col 4)
        if (amountsFound.length >= 2) {
          const deb = amountsFound[amountsFound.length - 2].val;
          const cred = amountsFound[amountsFound.length - 1].val;
          if (deb > 0 && cred === 0) {
            amount = -deb;
            type = 'ND';
          } else if (cred > 0 && deb === 0) {
            amount = cred;
            type = 'NC';
          }
        }

        // Buscar descripción (la columna de texto más larga no numérica)
        const nonNumbers = parts.filter((_, idx) => !amountsFound.some(a => a.index === idx));
        if (nonNumbers.length > 0) {
          // Ordenar por longitud descendente
          const longest = [...nonNumbers].sort((a, b) => b.length - a.length)[0];
          description = longest;
        }

        // Buscar posible referencia (números de 6 a 12 dígitos)
        for (const p of parts) {
          if (p !== description && /^\d{5,12}$/.test(p.trim())) {
            reference = p.trim();
            break;
          }
        }

        // Buscar fecha (DD/MM/AAAA o similar)
        for (const p of parts) {
          if (/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(p.trim())) {
            date = p.trim();
            break;
          }
        }
      }
    } else if (parts.length >= 2) {
      description = parts[0];
      amount = parseVenezuelanMoney(parts[1]);
    }

    if (description) {
      if (!type) {
        type = amount >= 0 ? 'NC' : 'ND';
      }
      rows.push({
        description,
        reference: reference || '0',
        amount,
        type,
        date,
      });
    }
  }

  return rows;
}

/**
 * Lee un archivo Excel subido por el usuario (.xlsx o .xls)
 * Lee la primera hoja (Débitos / ND) y la segunda hoja (Créditos / NC),
 * así como cualquier otra hoja de datos, omitiendo hojas consolidadas duplicadas.
 */
export async function parseExcelFile(file: File): Promise<RawRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    return [];
  }

  const sheetNames = workbook.SheetNames;
  const allRows: RawRow[] = [];

  // Recorrer todas las hojas disponibles del archivo Excel
  for (let sheetIdx = 0; sheetIdx < sheetNames.length; sheetIdx++) {
    const sheetName = sheetNames[sheetIdx];
    const nameLower = sheetName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Si hay 2 o más hojas y una se llama "Consolidado", "Asiento Consolidado", "Resumen General",
    // la omitimos para no duplicar los movimientos que ya están en Hoja 1 y Hoja 2
    if (
      sheetNames.length >= 2 &&
      (nameLower.includes('consolid') ||
       nameLower.includes('resumen') ||
       nameLower.includes('todo') ||
       nameLower.includes('asiento consolidado'))
    ) {
      continue;
    }

    // Determinar el rol contable de la hoja:
    // Regla mandataria del usuario:
    // "EN LA PRIMERA HOJA ESTAN LOS DEBITOS Y EN LA SEGUNDA PAGINA ESTAN LOS CREDITOS"
    let sheetRole: 'DEBITOS' | 'CREDITOS' | 'AUTO' = 'AUTO';

    if (
      nameLower.includes('deb') ||
      nameLower.includes('egreso') ||
      nameLower.includes('nd') ||
      nameLower.includes('cargo') ||
      nameLower.includes('gasto')
    ) {
      sheetRole = 'DEBITOS';
    } else if (
      nameLower.includes('cred') ||
      nameLower.includes('ingreso') ||
      nameLower.includes('nc') ||
      nameLower.includes('abono') ||
      nameLower.includes('deposito')
    ) {
      sheetRole = 'CREDITOS';
    } else if (sheetNames.length >= 2) {
      // Si los nombres son estándar o genéricos (ej. Hoja 1, Hoja 2, Sheet1, Sheet2):
      // Hoja 1 (index 0) = Débitos (ND)
      // Hoja 2 (index 1) = Créditos (NC)
      if (sheetIdx === 0) {
        sheetRole = 'DEBITOS';
      } else if (sheetIdx === 1) {
        sheetRole = 'CREDITOS';
      }
    }

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    const sheetRows = parseWorksheetRows(worksheet, sheetRole, sheetName);
    allRows.push(...sheetRows);
  }

  return allRows;
}

/**
 * Parsea las filas de una hoja de trabajo específica según su rol contable
 */
function parseWorksheetRows(
  worksheet: XLSX.WorkSheet,
  sheetRole: 'DEBITOS' | 'CREDITOS' | 'AUTO',
  sheetName: string
): RawRow[] {
  const rawData: (string | number | null | undefined)[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
  });

  const rows: RawRow[] = [];

  // Detectar columnas en la cabecera si están presentes
  let debitColIdx = -1;
  let creditColIdx = -1;
  let descColIdx = -1;
  let typeColIdx = -1;
  let refColIdx = -1;
  let dateColIdx = -1;

  for (let r = 0; r < Math.min(10, rawData.length); r++) {
    const rRow = rawData[r];
    if (!rRow) continue;
    const sRow = rRow.map(c => (c !== null && c !== undefined ? String(c).trim().toLowerCase() : ''));
    
    const hasHeaders = sRow.some(c => 
      c.includes('cuenta') || c.includes('descrip') || c.includes('concepto') || 
      c.includes('debito') || c.includes('débito') || c.includes('credito') || c.includes('crédito') ||
      c.includes('monto') || c.includes('saldo') || c.includes('referencia') || c.includes('fecha')
    );

    if (hasHeaders) {
      sRow.forEach((c, idx) => {
        if (c.includes('debito') || c.includes('débito') || c.includes('cargo') || c.includes('egreso')) debitColIdx = idx;
        if (c.includes('credito') || c.includes('crédito') || c.includes('abono') || c.includes('ingreso')) creditColIdx = idx;
        if (c.includes('descrip') || c.includes('concepto') || c.includes('detalle')) descColIdx = idx;
        if (c.includes('tipo')) typeColIdx = idx;
        if (c.includes('referencia') || c.includes('comprobante') || c.includes('ref') || c.includes('doc')) refColIdx = idx;
        if (c.includes('fecha') || c.includes('fec')) dateColIdx = idx;
      });
      break;
    }
  }

  for (let rowIndex = 0; rowIndex < rawData.length; rowIndex++) {
    const row = rawData[rowIndex];
    if (!row || row.length === 0) continue;

    const strRow = row.map(cell => (cell !== null && cell !== undefined ? String(cell).trim() : ''));
    if (strRow.every(c => c === '')) continue;

    const joined = strRow.join(' ').toLowerCase();

    // 1. Omitir encabezados de tabla
    if (
      joined.includes('cuenta contable') ||
      (joined.includes('descrip') && joined.includes('monto')) ||
      (joined.includes('fecha') && joined.includes('referencia') && (joined.includes('monto') || joined.includes('debito') || joined.includes('saldo'))) ||
      (joined.includes('tipo') && joined.includes('referencia') && joined.includes('monto'))
    ) {
      continue;
    }

    // 2. Omitir filas de totales, subtotales y saldos iniciales/finales
    const isSummaryRow = 
      joined.startsWith('total') ||
      joined.includes('total debit') ||
      joined.includes('total credit') ||
      joined.includes('total general') ||
      joined.includes('sumatoria') ||
      joined.includes('saldo final') ||
      joined.includes('saldo inicial') ||
      joined.includes('saldo anterior') ||
      strRow[0].toLowerCase() === 'total' ||
      strRow[1]?.toLowerCase() === 'total';

    if (isSummaryRow) {
      continue;
    }

    // 3. Omitir fila de contrapartida resumen de "CUENTAS POR COBRAR" si viene de un archivo previamente exportado
    const isCuentasPorCobrarSummary = 
      strRow.some(c => c.toUpperCase() === 'CUENTAS POR COBRAR') &&
      row.some(c => parseVenezuelanMoney(c) < 0);
    if (isCuentasPorCobrarSummary) {
      continue;
    }

    // 4. Formato estándar contable de 5 columnas: [Cuenta Contable, Descripción, Tipo, Referencia, Monto]
    if (strRow.length >= 5 && /^\d\.\d/.test(strRow[0])) {
      const desc = strRow[1];
      const rawType = strRow[2].toUpperCase();
      let explicitType: TransactionType | undefined;
      
      if (rawType.includes('NC') || rawType.includes('CR') || rawType.includes('HABER')) {
        explicitType = 'NC';
      } else if (rawType.includes('ND') || rawType.includes('DB') || rawType.includes('DEB') || rawType.includes('DEBE')) {
        explicitType = 'ND';
      }

      const type: TransactionType = explicitType || (sheetRole === 'CREDITOS' ? 'NC' : sheetRole === 'DEBITOS' ? 'ND' : 'ND');
      const ref = strRow[3] || '0';
      const parsedAmt = parseVenezuelanMoney(row[4]);
      const finalAmt = type === 'ND' ? -Math.abs(parsedAmt) : Math.abs(parsedAmt);

      if (desc && parsedAmt !== 0) {
        rows.push({
          description: desc,
          reference: ref,
          amount: finalAmt,
          type,
          sheetName,
        });
      }
      continue;
    }

    // 5. Formato con columnas separadas de Débito y Crédito
    if (debitColIdx >= 0 && creditColIdx >= 0) {
      const debitVal = parseVenezuelanMoney(row[debitColIdx]);
      const creditVal = parseVenezuelanMoney(row[creditColIdx]);
      const desc = (descColIdx >= 0 ? strRow[descColIdx] : '') || strRow.find(s => s.length > 3) || '';
      const ref = (refColIdx >= 0 ? strRow[refColIdx] : '') || strRow.find(s => /^\d{5,14}$/.test(s)) || '0';
      const date = (dateColIdx >= 0 ? strRow[dateColIdx] : '') || strRow.find(s => /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(s));

      if (Math.abs(debitVal) > 0 && desc) {
        rows.push({
          description: desc,
          reference: ref,
          amount: -Math.abs(debitVal),
          type: 'ND',
          date,
          sheetName,
        });
        continue;
      }
      if (Math.abs(creditVal) > 0 && desc) {
        rows.push({
          description: desc,
          reference: ref,
          amount: Math.abs(creditVal),
          type: 'NC',
          date,
          sheetName,
        });
        continue;
      }
    }

    // 6. Formato bancario general (extracto de Banco Mercantil)
    const numIndices: { idx: number; val: number }[] = [];
    row.forEach((cell, idx) => {
      const val = parseVenezuelanMoney(cell);
      if (val !== 0) {
        numIndices.push({ idx, val });
      }
    });

    if (numIndices.length === 0) continue;

    // Detectar el monto principal de la fila
    let amount = numIndices[numIndices.length - 1].val;
    if (numIndices.length >= 2 && joined.includes('saldo')) {
      amount = numIndices[0].val;
    }

    // Extraer descripción principal
    const textCandidates = strRow.filter((str, idx) => 
      !numIndices.some(n => n.idx === idx) && 
      str.length > 2 &&
      !/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(str) &&
      !/^\d{5,14}$/.test(str)
    );

    let description = '';
    if (descColIdx >= 0 && strRow[descColIdx]) {
      description = strRow[descColIdx];
    } else if (textCandidates.length > 0) {
      description = [...textCandidates].sort((a, b) => b.length - a.length)[0];
    }

    // Extraer referencia
    let reference = '';
    if (refColIdx >= 0 && strRow[refColIdx]) {
      reference = strRow[refColIdx];
    } else {
      for (const cell of strRow) {
        if (cell !== description && /^\d{5,14}$/.test(cell)) {
          reference = cell;
          break;
        }
      }
    }

    // Extraer fecha
    let date = '';
    if (dateColIdx >= 0 && strRow[dateColIdx]) {
      date = strRow[dateColIdx];
    } else {
      for (const cell of strRow) {
        if (/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(cell)) {
          date = cell;
          break;
        }
      }
    }

    // Determinar Tipo y Signo según el rol de la hoja:
    // - En Hoja 1 (Débitos): Son notas de débito / egresos (ND), monto negativo (-).
    // - En Hoja 2 (Créditos): Son notas de crédito / ingresos (NC), monto positivo (+).
    let type: TransactionType;
    let finalAmount = amount;

    if (typeColIdx >= 0 && strRow[typeColIdx]) {
      const rawType = strRow[typeColIdx].toUpperCase();
      if (rawType.includes('NC') || rawType.includes('CR')) {
        type = 'NC';
        finalAmount = Math.abs(amount);
      } else if (rawType.includes('ND') || rawType.includes('DB') || rawType.includes('DEB')) {
        type = 'ND';
        finalAmount = -Math.abs(amount);
      } else if (sheetRole === 'DEBITOS') {
        type = 'ND';
        finalAmount = -Math.abs(amount);
      } else if (sheetRole === 'CREDITOS') {
        type = 'NC';
        finalAmount = Math.abs(amount);
      } else {
        type = amount >= 0 ? 'NC' : 'ND';
      }
    } else if (sheetRole === 'DEBITOS') {
      type = 'ND';
      finalAmount = -Math.abs(amount);
    } else if (sheetRole === 'CREDITOS') {
      type = 'NC';
      finalAmount = Math.abs(amount);
    } else {
      type = amount >= 0 ? 'NC' : 'ND';
    }

    if (description && finalAmount !== 0) {
      rows.push({
        description,
        reference: reference || '0',
        amount: finalAmount,
        type,
        date,
        sheetName,
      });
    }
  }

  return rows;
}
