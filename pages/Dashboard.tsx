import React, { useMemo, useState } from 'react';
import { Wallet, Transaction, Category } from '../types.ts';
import { ArrowUpRightIcon, ArrowDownLeftIcon, BanknotesIcon, CreditCardIcon, WalletIcon } from '../components/icons.tsx';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const formatDate = (dateString: string) => {
    const dateToParse = dateString.includes('T') ? dateString : `${dateString}T00:00:00`;
    return new Date(dateToParse).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getWalletVisuals = (walletName: string) => {
    const name = walletName.toLowerCase();
    
    // Cash
    if (['cash', 'tunai', 'kas'].some(keyword => name.includes(keyword))) {
        return {
            Icon: BanknotesIcon,
            bgColor: 'bg-green-100 dark:bg-green-500/20',
            iconColor: 'text-green-600 dark:text-green-400',
        };
    }
    // Telkomsel
    if (['telkomsel'].some(keyword => name.includes(keyword))) {
        return {
            Icon: CreditCardIcon,
            bgColor: 'bg-red-100 dark:bg-red-500/20',
            iconColor: 'text-red-600 dark:text-red-400',
        };
    }
    // Bank
    if (['bca', 'bri', 'bni', 'mandiri', 'bank', 'btn'].some(keyword => name.includes(keyword))) {
        return {
            Icon: CreditCardIcon,
            bgColor: 'bg-blue-100 dark:bg-blue-500/20',
            iconColor: 'text-blue-600 dark:text-blue-400',
        };
    }
    // E-Wallet
    if (['gopay', 'ovo', 'dana', 'shopee', 'e-wallet'].some(keyword => name.includes(keyword))) {
        return {
            Icon: CreditCardIcon,
            bgColor: 'bg-purple-100 dark:bg-purple-500/20',
            iconColor: 'text-purple-600 dark:text-purple-400',
        };
    }
    // Default
    return {
        Icon: WalletIcon,
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        iconColor: 'text-gray-600 dark:text-gray-400',
    };
};


// FIX: Made children prop optional to resolve typing errors.
const Card = ({ children, className = '' }: { children?: React.ReactNode, className?: string }) => (
    <div className={`bg-white dark:bg-gray-950 p-4 sm:p-6 rounded-2xl shadow-sm ${className}`}>
        {children}
    </div>
);

const ProgressBar = ({ value, max, colorClass = 'bg-red-500' }: { value: number, max: number, colorClass?: string }) => {
    const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div className={`${colorClass} h-1.5 rounded-full`} style={{ width: `${percentage}%` }} />
        </div>
    );
};


export default function Dashboard({ wallets, transactions, categories }: { wallets: Wallet[], transactions: Transaction[], categories: Category[]}) {
    const [selectedDate, setSelectedDate] = useState(new Date());

    const selectedYear = selectedDate.getFullYear();
    const selectedMonth = selectedDate.getMonth();
    
    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newYear = parseInt(e.target.value, 10);
        setSelectedDate(new Date(newYear, selectedMonth, 1));
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newMonth = parseInt(e.target.value, 10);
        setSelectedDate(new Date(selectedYear, newMonth, 1));
    };

    const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);
    const totalBalance = useMemo(() => wallets.reduce((sum, wallet) => sum + Number(wallet.balance || 0), 0), [wallets]);

    const { monthlyReport, topExpenses, topIncomes } = useMemo(() => {
        const startOfMonth = new Date(selectedYear, selectedMonth, 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        const monthlyTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date.includes('T') ? t.date : `${t.date}T00:00:00`);
            return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
        });

        const monthly = { income: 0, expense: 0 };
        const expenseByCategory: { [key: string]: number } = {};
        const incomeByCategory: { [key: string]: number } = {};
        
        const categoryParentMap = new Map(categories.map(c => [c.id, c.parentId]));

        monthlyTransactions.forEach(t => {
            const amount = Number(t.amount || 0); // Defensive check for NaN
            const parentId = categoryParentMap.get(t.categoryId);
            const reportingCategoryId = parentId || t.categoryId;

            if (t.type === 'income') {
                monthly.income += amount;
                incomeByCategory[reportingCategoryId] = (incomeByCategory[reportingCategoryId] || 0) + amount;
            } else {
                monthly.expense += amount;
                expenseByCategory[reportingCategoryId] = (expenseByCategory[reportingCategoryId] || 0) + amount;
            }
        });
        
        const topExpenses = Object.entries(expenseByCategory)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([categoryId, amount]) => ({
                categoryId,
                name: categoryMap.get(categoryId) || 'Lainnya',
                amount,
            }));

        const topIncomes = Object.entries(incomeByCategory)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([categoryId, amount]) => ({
                categoryId,
                name: categoryMap.get(categoryId) || 'Lainnya',
                amount,
            }));
        
        return { monthlyReport: monthly, topExpenses, topIncomes };
    }, [transactions, categories, selectedYear, selectedMonth, categoryMap]);
    
    const last7DaysTransactions = useMemo(() => {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        today.setHours(23, 59, 59, 999);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        return transactions
            .filter(t => {
                const transactionDate = new Date(t.date.includes('T') ? t.date : `${t.date}T00:00:00`);
                return transactionDate >= sevenDaysAgo && transactionDate <= today;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions]);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
    const months = Array.from({ length: 12 }, (_, i) => ({
        value: i,
        name: new Date(0, i).toLocaleString('id-ID', { month: 'long' }),
    }));

    const netIncome = monthlyReport.income - monthlyReport.expense;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400">Selamat datang kembali!</p>
            </header>

            <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg">
                <h2 className="text-lg font-medium opacity-80">Sisa Saldo</h2>
                <p className="text-4xl font-bold tracking-tight mt-1">{formatCurrency(totalBalance)}</p>
            </Card>

            <Card>
                <h2 className="text-xl font-bold mb-4">Dompet</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {wallets.map(wallet => {
                        const { Icon, bgColor, iconColor } = getWalletVisuals(wallet.name);
                        return (
                             <div key={wallet.id} className={`flex items-center gap-4 p-4 rounded-xl ${bgColor}`}>
                                <div className={`p-2 rounded-lg ${iconColor} bg-black/5 dark:bg-white/10`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-gray-700 dark:text-gray-300 font-medium">{wallet.name}</p>
                                    <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(wallet.balance)}</p>
                                </div>
                            </div>
                        )
                    })}
                     {wallets.length === 0 && <p className="text-sm text-center text-gray-500 col-span-full py-4">Tidak ada dompet.</p>}
                </div>
            </Card>
            
            <section className="sticky top-0 bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm py-3 z-10 -mx-4 px-4">
                 <h2 className="text-xl font-bold mb-2">Filter Laporan Bulanan</h2>
                <div className="flex gap-2">
                    <select value={selectedMonth} onChange={handleMonthChange} className="w-full p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold">
                        {months.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
                    </select>
                    <select value={selectedYear} onChange={handleYearChange} className="w-full p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold">
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </section>

            <Card>
                <h2 className="text-xl font-bold mb-4">Laporan Bulanan</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full"><ArrowUpRightIcon className="w-6 h-6 text-green-600 dark:text-green-400"/></div>
                        <div>
                            <p className="text-sm text-gray-500">Pemasukan</p>
                            <p className="font-bold text-lg">{formatCurrency(monthlyReport.income)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-full"><ArrowDownLeftIcon className="w-6 h-6 text-red-600 dark:text-red-400"/></div>
                        <div>
                            <p className="text-sm text-gray-500">Pengeluaran</p>
                            <p className="font-bold text-lg">{formatCurrency(monthlyReport.expense)}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className={`p-2 rounded-full ${netIncome >= 0 ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                           <p className={`font-bold text-xl ${netIncome >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>=</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Sisa Saldo</p>
                            <p className={`font-bold text-lg ${netIncome >= 0 ? 'text-gray-800 dark:text-white' : 'text-red-500'}`}>{formatCurrency(netIncome)}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Top Pengeluaran</h3>
                        <div className="space-y-4">
                            {topExpenses.length > 0 ? topExpenses.map(exp => (
                                <div key={exp.categoryId}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{exp.name}</span>
                                        <span className="font-semibold">{formatCurrency(exp.amount)}</span>
                                    </div>
                                    <ProgressBar value={exp.amount} max={monthlyReport.expense} />
                                </div>
                            )) : <p className="text-center text-sm text-gray-500 py-4">Tidak ada pengeluaran bulan ini.</p>}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Top Pemasukan</h3>
                        <div className="space-y-4">
                            {topIncomes.length > 0 ? topIncomes.map(inc => (
                                <div key={inc.categoryId}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{inc.name}</span>
                                        <span className="font-semibold">{formatCurrency(inc.amount)}</span>
                                    </div>
                                    <ProgressBar value={inc.amount} max={monthlyReport.income} colorClass="bg-green-500" />
                                </div>
                            )) : <p className="text-center text-sm text-gray-500 py-4">Tidak ada pemasukan bulan ini.</p>}
                        </div>
                    </div>
                </div>
            </Card>

            <Card>
                <h2 className="text-xl font-bold mb-4">Transaksi Terakhir (7 Hari)</h2>
                 <div className="max-h-96 overflow-y-auto pr-2">
                    {last7DaysTransactions.length > 0 ? (
                        <table className="w-full text-sm text-left">
                            <tbody>
                                {last7DaysTransactions.map(t => (
                                    <tr key={t.id} className="border-b dark:border-gray-700 last:border-b-0">
                                        <td className="py-3 pr-2">
                                            <p className="font-semibold text-gray-800 dark:text-white truncate">{categoryMap.get(t.categoryId)}</p>
                                            <p className="text-xs text-gray-500 truncate">{t.description || '...'}</p>
                                            <p className="text-xs text-gray-500 mt-1">{formatDate(t.date)}</p>
                                        </td>
                                        <td className={`py-3 pl-2 font-bold text-right whitespace-nowrap ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-center text-sm text-gray-500 py-4">Tidak ada transaksi dalam 7 hari terakhir.</p>
                    )}
                </div>
            </Card>
        </div>
    );
}