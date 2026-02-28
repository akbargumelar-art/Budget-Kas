import { useMemo, useState, FormEvent } from 'react';
import { Budget, Transaction, Category, UserRole, Wallet } from '../types.ts';
import { PlusIcon, PencilIcon, TrashIcon } from '../components/icons.tsx';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const ProgressBar = ({ value, max }: { value: number, max: number }) => {
    const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    let colorClass = 'bg-green-500';
    if (percentage > 50) colorClass = 'bg-yellow-500';
    if (percentage > 80) colorClass = 'bg-red-500';

    return (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div className={`${colorClass} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
        </div>
    );
};

// Modal for Adding/Editing Budgets
const BudgetModal = ({ budget, onClose, onSave, categories, wallets }: { budget: Budget | null, onClose: () => void, onSave: (walletId: string, categoryId: string, amount: number) => void, categories: Category[], wallets: Wallet[] }) => {
    const [walletId, setWalletId] = useState(budget?.walletId || '');
    const [categoryId, setCategoryId] = useState(budget?.categoryId || '');
    const [amount, setAmount] = useState(budget?.amount.toString() || '');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!walletId || !categoryId || !amount) return;
        onSave(walletId, categoryId, parseFloat(amount));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-11/12 max-w-sm">
                <h3 className="text-lg font-bold mb-4">{budget ? 'Ubah' : 'Tambah'} Anggaran</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <select value={walletId} onChange={e => setWalletId(e.target.value)} disabled={!!budget} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded disabled:opacity-50">
                        <option value="">Pilih Dompet</option>
                        {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                    <select value={categoryId} onChange={e => setCategoryId(e.target.value)} disabled={!!budget} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded disabled:opacity-50">
                        <option value="">Pilih Kategori</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input type="number" placeholder="Jumlah Anggaran" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded" />
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default function Budgeting({ budgets, transactions, categories, wallets, userRole, budgetHandlers }: { budgets: Budget[], transactions: Transaction[], categories: Category[], wallets: Wallet[], userRole: UserRole, budgetHandlers: any }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
    const [expandedBudgetId, setExpandedBudgetId] = useState<string | null>(null);

    const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);
    const walletMap = useMemo(() => new Map(wallets.map(w => [w.id, w.name])), [wallets]);
    
    const budgetStatus = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyExpenses = transactions.filter(t => t.type === 'expense' && new Date(t.date) >= startOfMonth);

        const subCategoriesByParent = categories
            .filter(c => c.parentId)
            .reduce((acc, sub) => {
                const parentId = sub.parentId!;
                if (!acc[parentId]) acc[parentId] = [];
                acc[parentId].push(sub);
                return acc;
            }, {} as Record<string, Category[]>);
        
        return budgets.map(budget => {
            const childCategoryIds = (subCategoriesByParent[budget.categoryId] || []).map(c => c.id);
            const allCategoryIds = [budget.categoryId, ...childCategoryIds];

            const relatedTransactions = monthlyExpenses.filter(t => 
                allCategoryIds.includes(t.categoryId) && t.walletId === budget.walletId
            );
            const spent = relatedTransactions.reduce((sum, t) => sum + t.amount, 0);
            
            return {
                ...budget,
                spent,
                remaining: budget.amount - spent,
                categoryName: categoryMap.get(budget.categoryId) || 'N/A',
                walletName: walletMap.get(budget.walletId) || 'N/A',
                transactions: relatedTransactions,
            };
        });
    }, [budgets, transactions, categories, categoryMap, walletMap]);
    
    const handleSaveBudget = (walletId: string, categoryId: string, amount: number) => {
        if (editingBudget) {
            budgetHandlers.updateBudget(walletId, categoryId, amount);
        } else {
            budgetHandlers.addBudget(walletId, categoryId, amount);
        }
        setIsModalOpen(false);
        setEditingBudget(null);
    };

    const handleDeleteBudget = (budget: Budget) => {
        budgetHandlers.deleteBudget(budget.walletId, budget.categoryId);
    }

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Anggaran Bulanan</h1>
                    <p className="text-gray-500 dark:text-gray-400">Lacak pengeluaran Anda per dompet.</p>
                </div>
                {userRole === UserRole.ADMIN && (
                    <button onClick={() => { setEditingBudget(null); setIsModalOpen(true); }} className="bg-blue-600 text-white p-2 rounded-full shadow-lg">
                        <PlusIcon />
                    </button>
                )}
            </header>

            <div className="space-y-4">
                {budgetStatus.map(b => (
                    <div key={`${b.walletId}-${b.categoryId}`} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                            <div className="flex-1 cursor-pointer" onClick={() => setExpandedBudgetId(expandedBudgetId === `${b.walletId}-${b.categoryId}` ? null : `${b.walletId}-${b.categoryId}`)}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-semibold">{b.categoryName}</span>
                                    <span className="text-sm font-medium">{formatCurrency(b.spent)} / {formatCurrency(b.amount)}</span>
                                </div>
                                 <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">{b.walletName}</p>
                                <ProgressBar value={b.spent} max={b.amount} />
                                <p className={`text-right text-xs mt-1 ${b.remaining < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                                    Sisa: {formatCurrency(b.remaining)}
                                </p>
                            </div>
                            {userRole === UserRole.ADMIN && (
                                <div className="flex gap-2 ml-2">
                                    <button onClick={() => { setEditingBudget(b); setIsModalOpen(true); }} className="text-gray-500 hover:text-blue-500"><PencilIcon className="w-4 h-4" /></button>
                                    <button onClick={() => handleDeleteBudget(b)} className="text-gray-500 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            )}
                        </div>
                        {expandedBudgetId === `${b.walletId}-${b.categoryId}` && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <h4 className="font-semibold mb-2">Detail Transaksi: {b.categoryName}</h4>
                                {b.transactions.length > 0 ? (
                                    <table className="w-full text-sm">
                                        <tbody>
                                        {b.transactions.map(t => (
                                            <tr key={t.id} className="border-b dark:border-gray-700">
                                                <td className="py-1">{t.description}</td>
                                                <td className="py-1 text-right">{formatCurrency(t.amount)}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                ) : <p className="text-sm text-gray-500">Tidak ada transaksi bulan ini.</p>}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {isModalOpen && <BudgetModal budget={editingBudget} onClose={() => setIsModalOpen(false)} onSave={handleSaveBudget} categories={categories.filter(c => c.type === 'expense')} wallets={wallets} />}
        </div>
    );
}