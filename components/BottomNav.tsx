import React from 'react';
import { Page } from '../types.ts';
import { PAGES } from './constants.ts';
import { DashboardIcon, TransactionIcon, BudgetIcon, SettingsIcon, PlusIcon } from './icons.tsx';

interface BottomNavProps {
    activePage: Page;
    setActivePage: (page: Page) => void;
    onAddClick: () => void;
}

// Fix: Add NavButtonProps interface to solve key prop issue.
interface NavButtonProps {
    isActive: boolean;
    onClick: () => void;
    label: string;
    children?: React.ReactNode;
}

// Fix: Made children prop optional to resolve type inference issue with JSX children.
// FIX: Explicitly type NavButton as a React.FC to correctly handle React-specific props like 'key' and prevent type errors.
const NavButton: React.FC<NavButtonProps> = ({ isActive, onClick, label, children }) => {
    const activeClasses = 'text-blue-500 dark:text-blue-400';
    const inactiveClasses = 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400';
    return (
        <button
            onClick={onClick}
            aria-label={label}
            className={`flex flex-col items-center justify-center space-y-1 transition-colors duration-200 ${isActive ? activeClasses : inactiveClasses}`}
        >
            {children}
            <span className="text-xs font-medium">{label}</span>
        </button>
    );
};

export default function BottomNav({ activePage, setActivePage, onAddClick }: BottomNavProps) {
    const navItems = [
        { page: PAGES.DASHBOARD, icon: <DashboardIcon /> },
        { page: PAGES.TRANSACTIONS, icon: <TransactionIcon /> },
        { page: 'ADD', icon: null },
        { page: PAGES.BUDGETING, icon: <BudgetIcon /> },
        { page: PAGES.SETTINGS, icon: <SettingsIcon /> },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 shadow-[0_-1px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_-1px_10px_rgba(0,0,0,0.2)]">
            <div className="max-w-md mx-auto h-full flex justify-around items-center">
                {navItems.map((item) => {
                    if (item.page === 'ADD') {
                        return (
                            <div key="add-button" className="relative -top-6">
                                <button
                                    onClick={onAddClick}
                                    aria-label="Tambah Transaksi"
                                    className="w-16 h-16 rounded-full bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 transform hover:scale-105"
                                >
                                    <PlusIcon className="w-8 h-8" />
                                </button>
                            </div>
                        );
                    }
                    const page = item.page as Page;
                    return (
                        <NavButton
                            key={page.id}
                            isActive={activePage.id === page.id}
                            onClick={() => setActivePage(page)}
                            label={page.label}
                        >
                            {item.icon}
                        </NavButton>
                    );
                })}
            </div>
        </nav>
    );
}