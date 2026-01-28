import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Truck, Lock, Mail, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                navigate('/');
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                toast.success('Conta criada com sucesso! Verifique seu email se necessário ou faça login.');
                setIsLogin(true);
            }
        } catch (err: any) {
            console.error(err);
            const msg = err.message === 'Invalid login credentials'
                ? 'Email ou senha incorretos.'
                : err.message || 'Erro ao autenticar';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-verde-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-8 text-center bg-verde-800 text-white">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-verde-700 mb-4">
                        <Truck size={32} />
                    </div>
                    <h1 className="text-2xl font-bold">Gestão de Fretes</h1>
                    <p className="text-verde-200 text-sm mt-1">Acesse sua conta para continuar</p>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-500 focus:border-verde-500"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-500 focus:border-verde-500"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-verde-600 hover:bg-verde-700 text-white rounded-lg font-bold transition-colors shadow-lg shadow-verde-200 disabled:opacity-50"
                        >
                            {loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar Conta'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="ml-1 text-verde-600 font-bold hover:underline"
                        >
                            {isLogin ? 'Cadastre-se' : 'Faça Login'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
