import { useState, FormEvent, useEffect, useMemo } from 'react';
import { Wallet, Category, Transaction } from './types.ts';
import { CloseIcon, ArrowUpTrayIcon } from './components/icons.tsx';

interface AddTransactionModalProps {
    onClose: () => void;
    onSubmit: (transaction: Omit<Transaction, 'id'> | Transaction) => Promise<void>;
    wallets: Wallet[];
    incomeCategories: Category[];
    expenseCategories: Category[];
    apiRequest: (endpoint: string, method: string, body?: any) => Promise<any>;
    editingTransaction: Transaction | null;
}

export default function AddTransactionModal({ onClose, onSubmit, wallets, incomeCategories, expenseCategories, apiRequest, editingTransaction }: AddTransactionModalProps) {
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [amount, setAmount] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [walletId, setWalletId] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [invoice, setInvoice] = useState<File | null>(null);
    const [existingInvoiceUrl, setExistingInvoiceUrl] = useState<string | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const isEditing = editingTransaction !== null;

    useEffect(() => {
        if (isEditing) {
            setType(editingTransaction.type);
            setAmount(editingTransaction.amount.toString());
            setCategoryId(editingTransaction.categoryId);
            setWalletId(editingTransaction.walletId);
            setDescription(editingTransaction.description);
            // Ensure the date is in YYYY-MM-DD format for the date input
            setDate(editingTransaction.date.split('T')[0]);
            setExistingInvoiceUrl(editingTransaction.invoiceUrl);
        }
    }, [isEditing, editingTransaction]);


    const categories = type === 'income' ? incomeCategories : expenseCategories;

    const groupedCategories = useMemo(() => {
        const main = categories.filter(c => !c.parentId);
        const subsByParent = categories.filter(c => c.parentId).reduce((acc, sub) => {
            const parentId = sub.parentId!;
            if (!acc[parentId]) acc[parentId] = [];
            acc[parentId].push(sub);
            return acc;
        }, {} as Record<string, Category[]>);

        return main.map(m => ({
            ...m,
            subCategories: subsByParent[m.id] || []
        }));
    }, [categories]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        if (!amount || !categoryId || !walletId || !date) {
            alert('Please fill all required fields.');
            return;
        }

        setIsSubmitting(true);
        let finalInvoiceUrl = existingInvoiceUrl;

        if (invoice) {
            try {
                const formData = new FormData();
                formData.append('invoice', invoice);
                const uploadResponse = await apiRequest('/upload', 'POST', formData);
                finalInvoiceUrl = uploadResponse.url;
            } catch (error) {
                console.error("File upload failed:", error);
                alert("Gagal mengunggah bukti transaksi.");
                setIsSubmitting(false);
                return;
            }
        }

        const transactionData = {
            amount: parseFloat(amount),
            type,
            categoryId,
            walletId,
            description,
            date,
            invoiceUrl: finalInvoiceUrl,
        };

        try {
            if (isEditing) {
                await onSubmit({ ...transactionData, id: editingTransaction.id });
            } else {
                await onSubmit(transactionData);
            }
        } catch (error) {
            setIsSubmitting(false);
        }
    };
    
    const inputClasses = "w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-md border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500";
    const labelClasses = "block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1";
    const modalTitle = isEditing ? 'Ubah Transaksi' : 'Tambah Transaksi';
    const submitButtonText = isEditing ? 'Simpan Perubahan' : 'Simpan';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-end" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-t-2xl h-[90vh] flex flex-col">
                <header className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-800">
                    <h2 id="modal-title" className="text-xl font-bold">{modalTitle}</h2>
                    <button onClick={onClose} aria-label="Close" className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                <form id="transaction-form" onSubmit={handleSubmit} className="flex-grow p-4 overflow-y-auto space-y-4">
                    <div>
                        <div className="flex bg-gray-200 dark:bg-gray-800 rounded-lg p-1">
                            <button type="button" onClick={() => setType('expense')} className={`w-1/2 p-2 rounded-md font-semibold transition-colors ${type === 'expense' ? 'bg-red-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}>Keluar</button>
                            <button type="button" onClick={() => setType('income')} className={`w-1/2 p-2 rounded-md font-semibold transition-colors ${type === 'income' ? 'bg-green-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}>Masuk</button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="amount" className={labelClasses}>Jumlah</label>
                        <input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className={inputClasses} required />
                    </div>
                    <div>
                        <label htmlFor="category" className={labelClasses}>Kategori</label>
                        <select id="category" value={categoryId} onChange={e => setCategoryId(e.target.value)} className={inputClasses} required>
                            <option value="" disabled>Pilih Kategori</option>
                            {groupedCategories.map(cat => 
                                cat.subCategories.length === 0 ? (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ) : (
                                    <optgroup key={cat.id} label={cat.name}>
                                        <option value={cat.id}>{cat.name} (Utama)</option>
                                        {cat.subCategories.map(sub => (
                                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                                        ))}
                                    </optgroup>
                                )
                            )}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="wallet" className={labelClasses}>Dompet</label>
                        <select id="wallet" value={walletId} onChange={e => setWalletId(e.target.value)} className={inputClasses} required>
                            <option value="" disabled>Pilih Dompet</option>
                            {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="date" className={labelClasses}>Tanggal</label>
                        <input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClasses} required />
                    </div>
                    <div>
                        <label htmlFor="description" className={labelClasses}>Deskripsi (Opsional)</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Contoh: Makan siang bareng teman" rows={2} className={inputClasses}></textarea>
                    </div>
                    <div>
                        <label htmlFor="invoice-upload" className={labelClasses}>Bukti Transaksi (Opsional)</label>
                        <label htmlFor="invoice-upload" className="w-full p-4 bg-gray-100 dark:bg-gray-800 rounded-md border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700">
                            <ArrowUpTrayIcon className="w-8 h-8 text-gray-500 dark:text-gray-400 mb-2" />
                            <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-full px-2">
                                {invoice ? invoice.name : (existingInvoiceUrl ? 'Ganti bukti yang ada' : 'Klik untuk unggah file')}
                            </span>
                            <input id="invoice-upload" type="file" className="hidden" onChange={e => setInvoice(e.target.files ? e.target.files[0] : null)} />
                        </label>
                         {existingInvoiceUrl && !invoice && (
                            <p className="text-xs text-center text-gray-500 mt-2">Bukti saat ini: <a href={existingInvoiceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Lihat</a></p>
                        )}
                    </div>
                </form>
                <footer className="p-4 border-t border-gray-200 dark:border-gray-800">
                    <button 
                        type="submit" 
                        form="transaction-form" 
                        disabled={isSubmitting}
                        className="w-full p-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Menyimpan...' : submitButtonText}
                    </button>
                </footer>
            </div>
        </div>
    );
}