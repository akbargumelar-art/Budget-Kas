import { useState, FormEvent } from 'react';
import { User } from '../types.ts';
import { DashboardIcon, EyeIcon, EyeSlashIcon } from '../components/icons.tsx';

interface LoginScreenProps {
    onLogin: (user: User, token: string) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }
            onLogin(data.user, data.token);
        } catch (err: any) {
            setError(err.message || 'Gagal terhubung ke server.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen w-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center font-sans">
            <div className="max-w-md w-full mx-auto p-8 space-y-8">
                <div className="text-center">
                    <div className="flex justify-center text-blue-600 dark:text-blue-400 mb-4">
                        <DashboardIcon className="w-16 h-16" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Catatan Keuangan</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Silakan masuk untuk melanjutkan.</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="username" className="sr-only">Username</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-4 bg-gray-200 dark:bg-gray-800 rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                            placeholder="Username"
                        />
                    </div>
                    <div className="relative">
                        <label htmlFor="password" className="sr-only">Password</label>
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-4 bg-gray-200 dark:bg-gray-800 rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white pr-12"
                            placeholder="Password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 dark:text-gray-400"
                          aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                        >
                          {showPassword ? <EyeSlashIcon className="w-6 h-6" /> : <EyeIcon className="w-6 h-6" />}
                        </button>
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full p-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Memproses...' : 'Masuk'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}