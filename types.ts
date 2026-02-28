export enum UserRole {
  ADMIN = 'admin',
  VIEWER = 'viewer',
  INPUT = 'input',
}

export interface ActivityLog {
  id: string;
  action: 'add' | 'edit' | 'delete';
  entityType: string;
  entityId: string;
  details: string;
  userId: string;
  userName: string;
  walletId: string;
  walletName: string;
  createdAt: string;
}

export interface Page {
  id: string;
  label: string;
}

export interface User {
  id: string;
  fullName: string;
  phone: string;
  username: string;
  role: UserRole;
  accessibleWalletIds?: string[]; // Menyimpan ID dompet yang dapat diakses pengguna
  password?: string; // Digunakan saat membuat/mengubah pengguna
}

export interface Wallet {
  id: string;
  name: string;
  balance: number;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  parentId?: string | null;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  walletId: string;
  description: string;
  invoiceUrl?: string; // For transaction proof
}

export interface Budget {
  categoryId: string;
  amount: number;
  walletId: string; // Ditambahkan untuk anggaran per dompet
}