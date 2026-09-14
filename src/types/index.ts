export type TransactionType = 'NC' | 'ND' | 'NV';

export interface Transaction {
  id: string;
  accountCode: string;
  accountName?: string;
  description: string;
  type: TransactionType;
  reference: string;
  amount: number; // positive for NC (unless contrapartida), negative for ND in raw transactions
  date?: string;
  category?: string;
  ruleMatched?: string;
  isManuallyEdited?: boolean;
  sheetName?: string;
}

export interface AccountItem {
  code: string;
  name: string;
  category: 'Activo' | 'Pasivo' | 'Patrimonio' | 'Ingreso' | 'Gasto' | 'Especial';
  description?: string;
}

export interface ClassificationRule {
  id: string;
  ruleNumber: number;
  name: string;
  conditionType: 'NC' | 'ND' | 'ANY'; // Monto POSITIVO (+) o NEGATIVO (-)
  targetAccount: string;
  targetAccountName: string;
  keywords: string[];
  exactMatch?: boolean;
  notes?: string;
  isCustom?: boolean;
}

export interface BankConfig {
  bankName: string;
  bankAccountCode: string; // Default: '1.1.1.2.60' (Banco Mercantil)
  bankAccountName: string;
  receivableAccountCode: string; // Default: '1.1.2.1.10' (Cuentas por Cobrar)
  receivableAccountName: string;
  companyName: string;
  rif?: string;
}

export interface Company {
  id: string;
  name: string;
  rif: string;
  bankConfig: BankConfig;
  transactions: Transaction[];
  createdAt: string;
  notes?: string;
}

