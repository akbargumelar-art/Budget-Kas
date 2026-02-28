import React, { useState, FormEvent } from 'react';
import { UserRole, Wallet, Category, User } from '../types.ts';
import { PencilIcon, TrashIcon, PlusIcon, CloseIcon, EyeIcon, EyeSlashIcon } from '../components/icons.tsx';

interface SettingsProps {
    currentUser: User;
    users: User[];
    wallets: Wallet[];
    categories: Category[];
    settingsHandlers: any;
}

// Reusable Modal for simple name-based items (Wallets)
const WalletModal = ({ item, onClose, onSave }: { item: { id: string, name: string } | null, onClose: () => void, onSave: (id: string | null, name: string) => void }) => {
    const [name, setName] = useState(item?.name || '');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!name) return;
        onSave(item?.id || null, name);
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm">
                <h3 className="text-lg font-bold mb-4">{item ? 'Ubah' : 'Tambah'} Dompet</h3>
                <input type="text" placeholder="Nama Dompet" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded mb-4" />
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600">Batal</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Simpan</button>
                </div>
            </form>
        </div>
    );
};

// Modal for Category management
const CategoryModal = ({ item, type, onClose, onSave, parentCategories = [] }: { item: Partial<Category> | null, type: string, onClose: () => void, onSave: (id: string | null, name: string, parentId?: string | null) => void, parentCategories?: Category[] }) => {
    const [name, setName] = useState(item?.name || '');
    const [parentId, setParentId] = useState(item?.parentId || '');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!name) return;
        onSave(item?.id || null, name, parentId);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm space-y-4">
                <h3 className="text-lg font-bold mb-4">{item?.id ? 'Ubah' : 'Tambah'} {type}</h3>

                {!item?.id && (
                    <select value={parentId} onChange={e => setParentId(e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded">
                        <option value="">-- Jadikan Kategori Utama --</option>
                        {parentCategories.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                )}

                <input type="text" placeholder={`Nama ${type}`} value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded" required />

                <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600">Batal</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Simpan</button>
                </div>
            </form>
        </div>
    );
};


// Reusable Modal for User management
const UserModal = ({ user, currentUser, onClose, onSave }: { user: User | null, currentUser: User, onClose: () => void, onSave: (userData: User) => void }) => {
    const [userData, setUserData] = useState<User>(user || { id: '', fullName: '', username: '', phone: '', role: UserRole.VIEWER, password: '' });
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (field: keyof User, value: string) => {
        setUserData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!userData.fullName || !userData.username || (!user && !userData.password)) {
            alert('Harap isi semua kolom yang wajib diisi.');
            return;
        }
        onSave(userData);
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm space-y-4">
                <h3 className="text-lg font-bold">{user ? 'Ubah' : 'Tambah'} Pengguna</h3>
                <input type="text" placeholder="Nama Lengkap" value={userData.fullName} onChange={e => handleChange('fullName', e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded" required />
                <input type="text" placeholder="Username" value={userData.username} onChange={e => handleChange('username', e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded" required />
                <input type="tel" placeholder="Nomor HP" value={userData.phone} onChange={e => handleChange('phone', e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded" />
                <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} placeholder={user ? 'Password baru (opsional)' : 'Password'} onChange={e => handleChange('password', e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded pr-12" required={!user} />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 dark:text-gray-400"
                        aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                        {showPassword ? <EyeSlashIcon className="w-6 h-6" /> : <EyeIcon className="w-6 h-6" />}
                    </button>
                </div>
                <select
                    value={userData.role}
                    onChange={e => handleChange('role', e.target.value)}
                    className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={currentUser.role !== UserRole.ADMIN}
                >
                    <option value={UserRole.VIEWER}>Viewer</option>
                    <option value={UserRole.INPUT}>Input</option>
                    <option value={UserRole.ADMIN}>Admin</option>
                </select>
                <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600">Batal</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Simpan</button>
                </div>
            </form>
        </div>
    );
};


const UserPermissionsModal = ({ user, allWallets, onClose, onSave }: { user: User, allWallets: Wallet[], onClose: () => void, onSave: (userId: string, walletIds: string[]) => void }) => {
    const [selectedWalletIds, setSelectedWalletIds] = useState<Set<string>>(
        new Set(user.accessibleWalletIds || [])
    );

    const handleToggleWallet = (walletId: string) => {
        setSelectedWalletIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(walletId)) {
                newSet.delete(walletId);
            } else {
                newSet.add(walletId);
            }
            return newSet;
        });
    };

    const handleSave = () => {
        onSave(user.id, Array.from(selectedWalletIds));
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Atur Akses Dompet</h3>
                    <button onClick={onClose} aria-label="Close"><CloseIcon className="w-5 h-5" /></button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Pilih dompet yang dapat diakses oleh <span className="font-semibold">{user.fullName}</span>.</p>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {allWallets.map(wallet => (
                        <label key={wallet.id} className="flex items-center p-3 bg-gray-100 dark:bg-gray-700 rounded-md cursor-pointer">
                            <input
                                type="checkbox"
                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={selectedWalletIds.has(wallet.id)}
                                onChange={() => handleToggleWallet(wallet.id)}
                            />
                            <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">{wallet.name}</span>
                        </label>
                    ))}
                    {allWallets.length === 0 && <p className="text-sm text-center text-gray-500">Tidak ada dompet.</p>}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600">Batal</button>
                    <button type="button" onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">Simpan</button>
                </div>
            </div>
        </div>
    );
};

const SettingsCard = ({ title, children, action }: { title: string, children?: React.ReactNode, action?: React.ReactNode }) => (
    <section className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold">{title}</h2>
            {action}
        </div>
        <div className="space-y-1">
            {children}
        </div>
    </section>
);

// FIX: Refactor CategoryItem to be a React.FC with a props interface to solve `key` prop type errors.
interface CategoryItemProps {
    category: Category & { children: any[] };
    level?: number;
    onEdit: (cat: Category) => void;
    onDelete: (id: string) => void;
    onAddSub: (parentId: string) => void;
}

const CategoryItem: React.FC<CategoryItemProps> = ({ category, level = 0, onEdit, onDelete, onAddSub }) => (
    <div className="flex flex-col">
        <div style={{ marginLeft: `${level * 20}px` }} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 group">
            <span className="text-gray-700 dark:text-gray-300">{category.name}</span>
            <div className="flex gap-3">
                <button onClick={() => onAddSub(category.id)} className="text-gray-500 hover:text-green-500" title="Tambah Sub-kategori">
                    <PlusIcon className="w-4 h-4" />
                </button>
                <button onClick={() => onEdit(category)} className="text-gray-500 hover:text-blue-500" title="Ubah">
                    <PencilIcon className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(category.id)} className="text-gray-500 hover:text-red-500" title="Hapus">
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
        {category.children.map(child => (
            <CategoryItem key={child.id} category={child} level={level + 1} onEdit={onEdit} onDelete={onDelete} onAddSub={onAddSub} />
        ))}
    </div>
);


export default function Settings({ currentUser, users, wallets, categories, settingsHandlers }: SettingsProps) {
    const userRole = currentUser.role;

    const [modal, setModal] = useState<{ type: string | null, item: any }>({ type: null, item: null });
    const [editingUserPermissions, setEditingUserPermissions] = useState<User | null>(null);

    const handleSaveUser = (userData: User) => {
        if (userData.id) { // Editing existing user
            settingsHandlers.updateUser(userData);
        } else { // Adding new user
            const { id, ...newUser } = userData;
            settingsHandlers.addUser(newUser);
        }
        setModal({ type: null, item: null });
    };

    const handleSaveCategory = (id: string | null, name: string, parentId?: string | null) => {
        const { type } = modal;
        const categoryType = type === 'Kategori Pemasukan' ? 'income' : 'expense';

        if (id) {
            settingsHandlers.updateCategory(id, name);
        } else {
            settingsHandlers.addCategory(name, categoryType, parentId);
        }
        setModal({ type: null, item: null });
    };

    const handleSaveWallet = (id: string | null, name: string) => {
        id ? settingsHandlers.updateWallet(id, name) : settingsHandlers.addWallet(name);
        setModal({ type: null, item: null });
    };


    const incomeCategories = categories.filter(c => c.type === 'income');
    const expenseCategories = categories.filter(c => c.type === 'expense');

    type CategoryTreeNode = Category & { children: CategoryTreeNode[] };

    const buildCategoryTree = (allCategories: Category[]): CategoryTreeNode[] => {
        const categoriesById = new Map<string, CategoryTreeNode>(
            allCategories.map(c => [c.id, { ...c, children: [] }])
        );
        const rootCategories: CategoryTreeNode[] = [];

        for (const category of categoriesById.values()) {
            if (category.parentId && categoriesById.has(category.parentId)) {
                categoriesById.get(category.parentId)!.children.push(category);
            } else {
                rootCategories.push(category);
            }
        }
        return rootCategories;
    };

    const incomeCategoryTree = buildCategoryTree(incomeCategories);
    const expenseCategoryTree = buildCategoryTree(expenseCategories);

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Pengaturan</h1>
            </header>

            <SettingsCard title="Profil Akun">
                <div className="flex justify-between items-center p-2">
                    <span className="text-gray-700 dark:text-gray-300">{currentUser.fullName}</span>
                    <button onClick={() => setModal({ type: 'user', item: currentUser })} className="text-gray-500 hover:text-blue-500"><PencilIcon className="w-4 h-4" /></button>
                </div>
            </SettingsCard>

            {userRole === UserRole.ADMIN && (
                <div className="space-y-6">
                    <SettingsCard title="Pengguna" action={<button onClick={() => setModal({ type: 'user', item: null })} className="text-blue-500"><PlusIcon className="w-5 h-5" /></button>}>
                        {users.map(u => (
                            <div key={u.id} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700 dark:text-gray-300">{u.fullName} ({u.role})</span>
                                    <div className="flex items-center gap-3">
                                        {(u.role === UserRole.VIEWER || u.role === UserRole.INPUT) && (
                                            <button onClick={() => setEditingUserPermissions(u)} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">Akses Dompet</button>
                                        )}
                                        <button onClick={() => setModal({ type: 'user', item: u })} className="text-gray-500 hover:text-blue-500"><PencilIcon className="w-4 h-4" /></button>
                                        {u.id !== currentUser.id && (
                                            <button onClick={() => settingsHandlers.deleteUser(u.id)} className="text-gray-500 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                        )}
                                    </div>
                                </div>
                                {(u.role === UserRole.VIEWER || u.role === UserRole.INPUT) && (
                                    <div className="pl-1 mt-2 flex flex-wrap gap-1">
                                        {(u.accessibleWalletIds && u.accessibleWalletIds.length > 0) ? (
                                            u.accessibleWalletIds.map(walletId => {
                                                const wallet = wallets.find(w => w.id === walletId);
                                                return wallet ? (
                                                    <span key={walletId} className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-2 py-0.5 rounded-full">
                                                        {wallet.name}
                                                    </span>
                                                ) : null;
                                            })
                                        ) : (
                                            <span className="text-xs italic text-gray-500">Belum ada akses dompet</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </SettingsCard>
                    <SettingsCard title="Dompet" action={<button onClick={() => setModal({ type: 'Dompet', item: null })} className="text-blue-500"><PlusIcon className="w-5 h-5" /></button>}>
                        {wallets.map(w => (
                            <div key={w.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 group">
                                <span className="text-gray-700 dark:text-gray-300">{w.name}</span>
                                <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setModal({ type: 'Dompet', item: w })} className="text-gray-500 hover:text-blue-500"><PencilIcon className="w-4 h-4" /></button>
                                    <button onClick={() => settingsHandlers.deleteWallet(w.id)} className="text-gray-500 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </SettingsCard>
                    <SettingsCard title="Kategori Pemasukan" action={<button onClick={() => setModal({ type: 'Kategori Pemasukan', item: null })} className="text-blue-500"><PlusIcon className="w-5 h-5" /></button>}>
                        {incomeCategoryTree.map(cat => (
                            <CategoryItem
                                key={cat.id}
                                category={cat}
                                onEdit={item => setModal({ type: 'Kategori Pemasukan', item })}
                                onDelete={id => settingsHandlers.deleteCategory(id)}
                                onAddSub={parentId => setModal({ type: 'Kategori Pemasukan', item: { parentId } })}
                            />
                        ))}
                    </SettingsCard>
                    <SettingsCard title="Kategori Pengeluaran" action={<button onClick={() => setModal({ type: 'Kategori Pengeluaran', item: null })} className="text-blue-500"><PlusIcon className="w-5 h-5" /></button>}>
                        {expenseCategoryTree.map(cat => (
                            <CategoryItem
                                key={cat.id}
                                category={cat}
                                onEdit={item => setModal({ type: 'Kategori Pengeluaran', item })}
                                onDelete={id => settingsHandlers.deleteCategory(id)}
                                onAddSub={parentId => setModal({ type: 'Kategori Pengeluaran', item: { parentId } })}
                            />
                        ))}
                    </SettingsCard>
                </div>
            )}

            {/* Render Modals */}
            {modal.type === 'user' && <UserModal user={modal.item} currentUser={currentUser} onClose={() => setModal({ type: null, item: null })} onSave={handleSaveUser} />}
            {modal.type === 'Dompet' && (
                <WalletModal item={modal.item} onClose={() => setModal({ type: null, item: null })} onSave={handleSaveWallet} />
            )}
            {['Kategori Pemasukan', 'Kategori Pengeluaran'].includes(modal.type || '') && (
                <CategoryModal
                    item={modal.item}
                    type={modal.type!}
                    onClose={() => setModal({ type: null, item: null })}
                    onSave={handleSaveCategory}
                    parentCategories={modal.type === 'Kategori Pemasukan' ? incomeCategories.filter(c => !c.parentId) : expenseCategories.filter(c => !c.parentId)}
                />
            )}
            {editingUserPermissions && (
                <UserPermissionsModal
                    user={editingUserPermissions}
                    allWallets={wallets}
                    onClose={() => setEditingUserPermissions(null)}
                    onSave={settingsHandlers.updateUserPermissions}
                />
            )}

            <div className="mt-6">
                <button
                    onClick={settingsHandlers.logout}
                    className="w-full p-3 bg-red-500/90 text-white rounded-lg font-semibold hover:bg-red-500 transition-colors flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                    </svg>
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
}