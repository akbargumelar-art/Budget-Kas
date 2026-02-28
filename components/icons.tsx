import React from 'react';

// Fix: Made children prop optional to resolve type inference issue with JSX children.
const IconWrapper = ({ children, className = "w-6 h-6" }: { children?: React.ReactNode, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {children}
    </svg>
);

export const DashboardIcon = ({ className }: { className?: string }) => (
    <IconWrapper className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></IconWrapper>
);

export const TransactionIcon = ({ className }: { className?: string }) => (
    <IconWrapper className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></IconWrapper>
);

export const BudgetIcon = ({ className }: { className?: string }) => (
    <IconWrapper className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5a.5.5 0 11-1 0 .5.5 0 011 0zM15.5 9.5a.5.5 0 11-1 0 .5.5 0 011 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></IconWrapper>
);

export const SettingsIcon = ({ className }: { className?: string }) => (
    <IconWrapper className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></IconWrapper>
);

export const PlusIcon = ({ className }: { className?: string }) => (
    <IconWrapper className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></IconWrapper>
);

export const ChevronDownIcon = ({ className }: { className?: string }) => (
    <IconWrapper className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></IconWrapper>
);

export const CloseIcon = ({ className }: { className?: string }) => (
    <IconWrapper className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></IconWrapper>
);

export const PencilIcon = ({ className }: { className?: string }) => (
    <IconWrapper className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></IconWrapper>
);

export const TrashIcon = ({ className }: { className?: string }) => (
    <IconWrapper className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></IconWrapper>
);

export const UserPlusIcon = ({ className }: { className?: string }) => (
    <IconWrapper className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></IconWrapper>
);

export const ArrowUpTrayIcon = ({ className }: { className?: string }) => (
    <IconWrapper className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></IconWrapper>
);

export const EyeIcon = ({ className }: { className?: string }) => (
    <IconWrapper className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></IconWrapper>
);

export const EyeSlashIcon = ({ className }: { className?: string }) => (
    <IconWrapper className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19 12 19c.996 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 2.662 10.065 6.838a10.523 10.523 0 01-4.293 5.57M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L6.228 6.228" /></IconWrapper>
);

export const ArrowUpRightIcon = ({ className }: { className?: string }) => (
    <IconWrapper className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></IconWrapper>
);

export const ArrowDownLeftIcon = ({ className }: { className?: string }) => (
    <IconWrapper className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" /></IconWrapper>
);

export const BanknotesIcon = ({ className }: { className?: string }) => (
    <IconWrapper className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-15c-.621 0-1.125-.504-1.125-1.125v-9.75c0-.621.504-1.125 1.125-1.125h1.5" /></IconWrapper>
);

export const CreditCardIcon = ({ className }: { className?: string }) => (
    <IconWrapper className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h6m3-5.25H21m-2.25 5.25H21m-2.25 2.25H21M4.5 16.5h.75" /></IconWrapper>
);

export const WalletIcon = ({ className }: { className?: string }) => (
    <IconWrapper className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" /></IconWrapper>
);