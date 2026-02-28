import { useMemo, useState } from 'react';
import { Transaction, Category, Wallet, UserRole, ActivityLog } from '../types.ts';
import { PencilIcon, TrashIcon } from '../components/icons.tsx';

interface TransactionsProps {
    transactions: Transaction[];
    categories: Category[];
    wallets: Wallet[];
    userRole: UserRole;
    onEditTransaction: (transaction: Transaction) => void;
    onDeleteTransaction: (transactionId: string) => void;
    activityLogs: ActivityLog[];
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const formatDate = (dateString: string) => {
    const dateToParse = dateString.includes('T') ? dateString : `${dateString}T00:00:00`;
    return new Date(dateToParse).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
        date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

const actionLabels: Record<string, { text: string; color: string; bg: string }> = {
    add: { text: 'Tambah', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/50' },
    edit: { text: 'Ubah', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/50' },
    delete: { text: 'Hapus', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/50' },
};

export default function Transactions({ transactions, categories, wallets, userRole, onEditTransaction, onDeleteTransaction, activityLogs }: TransactionsProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedWalletId, setSelectedWalletId] = useState('');
    const [activeTab, setActiveTab] = useState<'transactions' | 'logs'>('transactions');
    const [logWalletFilter, setLogWalletFilter] = useState('');

    const canModify = userRole === UserRole.ADMIN || userRole === UserRole.INPUT;

    const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);
    const walletMap = useMemo(() => new Map(wallets.map(w => [w.id, w.name])), [wallets]);

    const filteredTransactions = useMemo(() => {
        return transactions
            .filter(t => {
                const searchLower = searchTerm.toLowerCase();
                const descriptionMatch = t.description.toLowerCase().includes(searchLower);
                const categoryMatch = categoryMap.get(t.categoryId)?.toLowerCase().includes(searchLower);
                const walletMatch = walletMap.get(t.walletId)?.toLowerCase().includes(searchLower);
                const amountMatch = t.amount.toString().includes(searchLower);
                return descriptionMatch || categoryMatch || walletMatch || amountMatch;
            })
            .filter(t => {
                if (!selectedWalletId) return true;
                return t.walletId === selectedWalletId;
            })
            .filter(t => {
                if (!startDate && !endDate) return true;
                const tDate = new Date(`${t.date}T00:00:00`);
                if (startDate && tDate < new Date(`${startDate}T00:00:00`)) return false;
                if (endDate && tDate > new Date(`${endDate}T00:00:00`)) return false;
                return true;
            });
    }, [transactions, searchTerm, startDate, endDate, selectedWalletId, categoryMap, walletMap]);

    const filteredLogs = useMemo(() => {
        if (!logWalletFilter) return activityLogs;
        return activityLogs.filter(log => log.walletId === logWalletFilter);
    }, [activityLogs, logWalletFilter]);

    const summary = useMemo(() => {
        return filteredTransactions.reduce(
            (acc, t) => {
                const amount = Number(t.amount || 0);
                if (t.type === 'income') {
                    acc.income += amount;
                } else {
                    acc.expense += amount;
                }
                return acc;
            },
            { income: 0, expense: 0 }
        );
    }, [filteredTransactions]);

    const netBalance = summary.income - summary.expense;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Riwayat Transaksi</h1>
                <p className="text-gray-500 dark:text-gray-400">Lihat dan kelola semua transaksi Anda.</p>
            </header>

            {/* Tab Switcher */}
            <div className="flex bg-gray-200 dark:bg-gray-800 rounded-lg p-1">
                <button
                    onClick={() => setActiveTab('transactions')}
                    className={`w-1/2 p-2.5 rounded-md font-semibold text-sm transition-colors ${activeTab === 'transactions' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'}`}
                >
                    Transaksi
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`w-1/2 p-2.5 rounded-md font-semibold text-sm transition-colors ${activeTab === 'logs' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'}`}
                >
                    Log Aktivitas
                </button>
            </div>

            {activeTab === 'transactions' && (
                <>
                    <div className="sticky top-0 bg-white dark:bg-gray-950 py-2 z-10 space-y-3">
                        <input
                            type="text"
                            placeholder="Cari (kategori, dompet, deskripsi, jumlah)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-md border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                            value={selectedWalletId}
                            onChange={(e) => setSelectedWalletId(e.target.value)}
                            className="w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-md border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Filter berdasarkan dompet"
                        >
                            <option value="">Semua Dompet</option>
                            {wallets.map(wallet => (
                                <option key={wallet.id} value={wallet.id}>{wallet.name}</option>
                            ))}
                        </select>
                        <div className="flex gap-2">
                            <div className="w-1/2">
                                <label className="text-xs text-gray-500">Tanggal Awal</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full p-2 bg-gray-100 dark:bg-gray-800 rounded-md border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="w-1/2">
                                <label className="text-xs text-gray-500">Tanggal Akhir</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full p-2 bg-gray-100 dark:bg-gray-800 rounded-md border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-950 p-4 rounded-2xl shadow-sm">
                        <h2 className="text-lg font-bold mb-3 text-gray-800 dark:text-white">Summary</h2>
                        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                            <div>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Pemasukan</p>
                                <p className="text-lg sm:text-xl font-bold text-green-500 break-words">{formatCurrency(summary.income)}</p>
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Pengeluaran</p>
                                <p className="text-lg sm:text-xl font-bold text-red-500 break-words">{formatCurrency(summary.expense)}</p>
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Sisa Saldo</p>
                                <p className={`text-lg sm:text-xl font-bold ${netBalance >= 0 ? 'text-blue-500' : 'text-red-500'} break-words`}>
                                    {formatCurrency(netBalance)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Tanggal</th>
                                    <th scope="col" className="px-4 py-3">Kategori</th>
                                    <th scope="col" className="px-4 py-3">Dompet</th>
                                    <th scope="col" className="px-4 py-3">Keterangan</th>
                                    <th scope="col" className="px-4 py-3 text-right">Jumlah</th>
                                    <th scope="col" className="px-4 py-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.length > 0 ? filteredTransactions.map(t => (
                                    <tr key={t.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                        <td className="px-4 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                            {formatDate(t.date)}
                                        </td>
                                        <td className="px-4 py-4 font-semibold text-gray-900 dark:text-white">
                                            {categoryMap.get(t.categoryId)}
                                        </td>
                                        <td className="px-4 py-4">
                                            {walletMap.get(t.walletId)}
                                        </td>
                                        <td className="px-4 py-4 text-gray-600 dark:text-gray-300">
                                            {t.description}
                                        </td>
                                        <td className={`px-4 py-4 font-bold text-right ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex justify-center items-center gap-4">
                                                {t.invoiceUrl && t.invoiceUrl.startsWith('/uploads/') ?
                                                    <a href={t.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs font-semibold">Lihat</a>
                                                    : <span className="text-gray-400 dark:text-gray-500 text-xs">-</span>}

                                                {canModify && (
                                                    <>
                                                        <button onClick={() => onEditTransaction(t)} className="text-gray-400 hover:text-blue-500" aria-label="Ubah Transaksi">
                                                            <PencilIcon className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => onDeleteTransaction(t.id)} className="text-gray-400 hover:text-red-500" aria-label="Hapus Transaksi">
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="text-center py-10">Tidak ada transaksi yang ditemukan.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {activeTab === 'logs' && (
                <div className="space-y-4">
                    <select
                        value={logWalletFilter}
                        onChange={(e) => setLogWalletFilter(e.target.value)}
                        className="w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-md border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Filter log berdasarkan dompet"
                    >
                        <option value="">Semua Dompet</option>
                        {wallets.map(wallet => (
                            <option key={wallet.id} value={wallet.id}>{wallet.name}</option>
                        ))}
                    </select>

                    <div className="space-y-3">
                        {filteredLogs.length > 0 ? filteredLogs.map(log => {
                            const actionInfo = actionLabels[log.action] || { text: log.action, color: 'text-gray-700', bg: 'bg-gray-100' };
                            return (
                                <div key={log.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${actionInfo.bg} ${actionInfo.color}`}>
                                                    {actionInfo.text}
                                                </span>
                                                <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                                    {formatDateTime(log.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-800 dark:text-gray-200 mb-1">{log.details}</p>
                                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                                <span>Oleh: <span className="font-medium text-gray-700 dark:text-gray-300">{log.userName}</span></span>
                                                <span>Dompet: <span className="font-medium text-gray-700 dark:text-gray-300">{log.walletName}</span></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                                Belum ada log aktivitas.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}