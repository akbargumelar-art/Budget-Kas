import { useState, useMemo, useCallback, useEffect } from 'react';
import { Page, UserRole, Transaction, Wallet, Category, Budget, User, ActivityLog } from '../types.ts';
import { PAGES } from './constants.ts';
import BottomNav from './BottomNav.tsx';
import Dashboard from '../pages/Dashboard.tsx';
import Transactions from '../pages/Transactions.tsx';
import Budgeting from '../pages/Budgeting.tsx';
import Settings from '../pages/Settings.tsx';
import AddTransactionModal from '../AddTransactionModal.tsx';
import LoginScreen from '../pages/LoginScreen.tsx';

const API_URL = '/api';

export default function App() {
  const [activePage, setActivePage] = useState<Page>(PAGES.DASHBOARD);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('authToken'));

  // App Data State
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // API request helper with authentication
  const apiRequest = async (endpoint: string, method: string, body?: any) => {
    const isFormData = body instanceof FormData;

    const headers: HeadersInit = {
      ...(authToken && { 'Authorization': `Bearer ${authToken}` })
    };
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const options: RequestInit = {
      method,
      headers,
    };
    if (body) {
      options.body = isFormData ? body : JSON.stringify(body);
    }
    const response = await fetch(`${API_URL}${endpoint}`, options);
    if (!response.ok) {
      if (response.status === 401) { // Unauthorized
        handleLogout();
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Something went wrong');
    }
    if (response.status === 204) return null;
    return response.json();
  };

  // Fetch activity logs
  const fetchActivityLogs = async () => {
    try {
      const logs = await apiRequest('/activity-logs', 'GET');
      setActivityLogs(logs);
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
    }
  };

  // Check for existing token and fetch initial data on app load
  useEffect(() => {
    const initializeApp = async () => {
      if (authToken) {
        try {
          setIsLoading(true);
          // Fetch user profile and all other data
          const [profileData, walletsData, categoriesData, transactionsData, budgetsData, usersData, logsData] = await Promise.all([
            apiRequest('/auth/profile', 'GET'),
            apiRequest('/wallets', 'GET'),
            apiRequest('/categories', 'GET'),
            apiRequest('/transactions', 'GET'),
            apiRequest('/budgets', 'GET'),
            currentUser?.role === UserRole.ADMIN ? apiRequest('/users', 'GET') : Promise.resolve([]),
            apiRequest('/activity-logs', 'GET'),
          ]);

          setCurrentUser(profileData);
          setWallets(walletsData);
          setCategories(categoriesData);
          setTransactions(transactionsData);
          setBudgets(budgetsData);
          setActivityLogs(logsData);
          if (profileData.role === UserRole.ADMIN) {
            setUsers(usersData);
          } else {
            setUsers([profileData]); // Non-admin only sees themselves
          }

        } catch (error) {
          console.error("Initialization failed:", error);
          handleLogout(); // Clear session if token is invalid
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false); // No token, just stop loading
      }
    };
    initializeApp();
  }, [authToken]);

  const incomeCategories = useMemo(() => categories.filter(c => c.type === 'income'), [categories]);
  const expenseCategories = useMemo(() => categories.filter(c => c.type === 'expense'), [categories]);

  const canModifyTransactions = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.INPUT;

  const handleLogin = (user: User, token: string) => {
    localStorage.setItem('authToken', token);
    setAuthToken(token);
    setCurrentUser(user);
    setActivePage(PAGES.DASHBOARD);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setAuthToken(null);
    setCurrentUser(null);
    setWallets([]);
    setTransactions([]);
    setCategories([]);
    setBudgets([]);
    setUsers([]);
    setActivityLogs([]);
  };

  const handleSaveTransaction = useCallback(async (transactionData: Omit<Transaction, 'id'> | Transaction) => {
    const isEditing = 'id' in transactionData;
    const endpoint = isEditing ? `/transactions/${transactionData.id}` : '/transactions';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      // Fix: Explicitly type the destructured response from apiRequest to ensure type safety.
      const { updatedTransaction, updatedWallets }: { updatedTransaction: Transaction, updatedWallets: Wallet[] } = await apiRequest(endpoint, method, transactionData);

      if (isEditing) {
        setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
      } else {
        setTransactions(prev => [updatedTransaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }

      // Create a map of the updated wallets for efficient lookup
      const updatedWalletsMap = new Map(updatedWallets.map((w) => [w.id, w]));

      // Update the wallets state by replacing the ones that have changed
      setWallets(prev => prev.map(w => updatedWalletsMap.get(w.id) || w));

      setModalOpen(false);
      setEditingTransaction(null);

      // Refresh activity logs
      fetchActivityLogs();
    } catch (error) {
      console.error(`Failed to ${isEditing ? 'update' : 'add'} transaction:`, error);
      alert(`Gagal ${isEditing ? 'mengubah' : 'menambah'} transaksi.`);
      throw error;
    }
  }, [apiRequest]);

  const handleDeleteTransaction = useCallback(async (transactionId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return;
    try {
      const { updatedWallets }: { updatedWallets: Wallet[] } = await apiRequest(`/transactions/${transactionId}`, 'DELETE');
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
      const updatedWalletsMap = new Map(updatedWallets.map((w) => [w.id, w]));
      setWallets(prev => prev.map(w => updatedWalletsMap.get(w.id) || w));

      // Refresh activity logs
      fetchActivityLogs();
    } catch (error: any) {
      console.error("Failed to delete transaction:", error);
      alert(`Gagal menghapus transaksi: ${error.message}`);
    }
  }, [apiRequest]);

  const crudHandlers = {
    addWallet: async (name: string) => {
      if (!name) return;
      const newWallet = await apiRequest('/wallets', 'POST', { name });
      setWallets(prev => [...prev, newWallet]);
    },
    updateWallet: async (id: string, name: string) => {
      if (!name) return;
      const updatedWallet = await apiRequest(`/wallets/${id}`, 'PUT', { name });
      setWallets(prev => prev.map(w => w.id === id ? updatedWallet : w));
    },
    deleteWallet: async (id: string) => {
      if (!confirm('Apakah Anda yakin ingin menghapus dompet ini?')) {
        return;
      }
      try {
        await apiRequest(`/wallets/${id}`, 'DELETE');
        setWallets(prev => prev.filter(w => w.id !== id));
      } catch (error: any) {
        console.error("Failed to delete wallet:", error);
        alert(`Gagal menghapus dompet: ${error.message}`);
      }
    },
    addCategory: async (name: string, type: 'income' | 'expense', parentId?: string | null) => {
      if (!name) return;
      const newCategory = await apiRequest('/categories', 'POST', { name, type, parentId });
      setCategories(prev => [...prev, newCategory]);
    },
    updateCategory: async (id: string, name: string) => {
      if (!name) return;
      const updatedCategory = await apiRequest(`/categories/${id}`, 'PUT', { name });
      setCategories(prev => prev.map(c => c.id === id ? updatedCategory : c));
    },
    deleteCategory: async (id: string) => {
      if (!confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
        return;
      }
      try {
        await apiRequest(`/categories/${id}`, 'DELETE');
        setCategories(prev => prev.filter(c => c.id !== id));
      } catch (error: any) {
        console.error("Failed to delete category:", error);
        alert(`Gagal menghapus kategori: ${error.message}`);
      }
    },
    addBudget: async (walletId: string, categoryId: string, amount: number) => {
      const newBudget = await apiRequest('/budgets', 'POST', { walletId, categoryId, amount });
      setBudgets(prev => [...prev, newBudget]);
    },
    updateBudget: async (walletId: string, categoryId: string, amount: number) => {
      const updatedBudget = await apiRequest(`/budgets`, 'PUT', { walletId, categoryId, amount });
      setBudgets(prev => prev.map(b => b.categoryId === categoryId && b.walletId === walletId ? updatedBudget : b));
    },
    deleteBudget: async (walletId: string, categoryId: string) => {
      await apiRequest(`/budgets`, 'DELETE', { walletId, categoryId });
      setBudgets(prev => prev.filter(b => !(b.categoryId === categoryId && b.walletId === walletId)));
    },
    addUser: async (user: Omit<User, 'id'>) => {
      const newUser = await apiRequest('/users', 'POST', user);
      setUsers(prev => [...prev, newUser]);
    },
    updateUser: async (user: User) => {
      const updatedUser = await apiRequest(`/users/${user.id}`, 'PUT', user);
      // If the updated user is the current user, update their state
      if (currentUser?.id === updatedUser.id) {
        setCurrentUser(updatedUser);
      }
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    },
    deleteUser: async (id: string) => {
      await apiRequest(`/users/${id}`, 'DELETE');
      setUsers(prev => prev.filter(u => u.id !== id));
    },
    updateUserPermissions: async (userId: string, accessibleWalletIds: string[]) => {
      const updatedUser = await apiRequest(`/users/${userId}/permissions`, 'PUT', { accessibleWalletIds });
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    },
    logout: handleLogout,
  };

  const handleOpenAddModal = useCallback(() => {
    if (canModifyTransactions) {
      setEditingTransaction(null);
      setModalOpen(true);
    } else {
      alert("Anda tidak memiliki izin untuk menambah transaksi.");
    }
  }, [canModifyTransactions]);

  const handleOpenEditModal = useCallback((transaction: Transaction) => {
    if (canModifyTransactions) {
      setEditingTransaction(transaction);
      setModalOpen(true);
    } else {
      alert("Anda tidak memiliki izin untuk mengubah transaksi.");
    }
  }, [canModifyTransactions]);

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingTransaction(null);
  };


  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-300">Memuat aplikasi...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const userRole = currentUser.role;

  const renderPage = () => {
    const pageProps = { wallets, transactions, categories, userRole };
    switch (activePage.id) {
      case PAGES.DASHBOARD.id:
        return <Dashboard {...pageProps} />;
      case PAGES.TRANSACTIONS.id:
        return <Transactions {...pageProps} onEditTransaction={handleOpenEditModal} onDeleteTransaction={handleDeleteTransaction} activityLogs={activityLogs} />;
      case PAGES.BUDGETING.id:
        return <Budgeting budgets={budgets} transactions={transactions} categories={categories} wallets={wallets} userRole={userRole} budgetHandlers={crudHandlers} />;
      case PAGES.SETTINGS.id:
        return <Settings currentUser={currentUser} users={users} wallets={wallets} categories={categories} settingsHandlers={crudHandlers} />;
      default:
        return <Dashboard {...pageProps} />;
    }
  };

  return (
    <div className="h-full w-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans pb-24 overflow-y-auto">
      <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto bg-white dark:bg-gray-950 min-h-full">
        <main className="p-4">
          {renderPage()}
        </main>

        {isModalOpen && (
          <AddTransactionModal
            onClose={handleCloseModal}
            onSubmit={handleSaveTransaction}
            wallets={wallets}
            incomeCategories={incomeCategories}
            expenseCategories={expenseCategories}
            apiRequest={apiRequest}
            editingTransaction={editingTransaction}
          />
        )}

        <BottomNav
          activePage={activePage}
          setActivePage={setActivePage}
          onAddClick={handleOpenAddModal}
        />
      </div>
    </div>
  );
}