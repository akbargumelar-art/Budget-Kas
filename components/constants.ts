import { Page } from '../types.ts';

export const PAGES: { [key: string]: Page } = {
  DASHBOARD: { id: 'dashboard', label: 'Dashboard' },
  TRANSACTIONS: { id: 'transactions', label: 'Transaksi' },
  BUDGETING: { id: 'budgeting', label: 'Budgeting' },
  SETTINGS: { id: 'settings', label: 'Pengaturan' },
};