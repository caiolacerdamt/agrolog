import { DollarSign, TrendingUp, Calendar, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Helper icons
function CheckCircle({ size }: { size: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
    );
}

function Clock({ size }: { size: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
    );
}

export function FinancePage() {
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [summary, setSummary] = useState({
        totalRevenue: 0,
        totalReceipts: 0,
        totalPending: 0,
        profitMargin: 0
    });

    useEffect(() => {
        fetchFinanceData();
    }, []);

    const fetchFinanceData = async () => {
        try {
            // @ts-ignore
            const { data, error } = await supabase
                .from('freights')
                .select('id, total_value, receipts, to_receive, status, date, product')
                .order('date', { ascending: false });

            if (error) throw error;

            if (data) {
                const transactions = data as any[];
                const totalRevenue = transactions.reduce((acc, curr) => acc + (curr.total_value || 0), 0);

                // Logic: "Recebido" is the sum of total_value where status is 'PAGO'
                // OR sum of receipts field if using partial payments (keeping simple as requested)
                const totalReceipts = transactions.reduce((acc, curr) => {
                    if (curr.status === 'PAGO') return acc + (curr.total_value || 0);
                    return acc + (curr.receipts || 0); // Fallback if partial receipts used
                }, 0);

                // @ts-ignore
                const totalPending = totalRevenue - totalReceipts;

                setSummary({
                    totalRevenue,
                    totalReceipts,
                    totalPending,
                    profitMargin: totalRevenue > 0 ? (totalReceipts / totalRevenue) * 100 : 0
                });

                setTransactions(data.slice(0, 5));
            }
        } catch (error) {
            console.error('Error fetching finance data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Financeiro</h1>
                    <p className="text-gray-500">Controle de recebíveis e fluxo de caixa.</p>
                </div>
                <div className="flex bg-white p-1 rounded-lg border border-gray-200">
                    <button className="px-4 py-1.5 bg-verde-100 text-verde-700 font-medium rounded-md text-sm">Visão Geral</button>
                    {/* <button className="px-4 py-1.5 text-gray-600 hover:bg-gray-50 font-medium rounded-md text-sm transition-colors">Relatórios</button> */}
                </div>
            </div>

            {loading ? (
                <div className="text-gray-500">Calculando dados financeiros...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                <DollarSign size={24} />
                            </div>
                            <span className="text-sm font-medium text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <TrendingUp size={14} />
                                +12.5%
                            </span>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium">Faturamento Total</h3>
                        <p className="text-2xl font-bold text-gray-800 mt-1">
                            {summary.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                                <CheckCircle size={24} />
                            </div>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium">Recebido</h3>
                        <p className="text-2xl font-bold text-gray-800 mt-1">
                            {summary.totalReceipts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                                <Clock size={24} />
                            </div>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium">A Receber</h3>
                        <p className="text-2xl font-bold text-gray-800 mt-1">
                            {summary.totalPending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Resumo Mensal</h3>
                <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <p>Gráfico de evolução financeira em breve</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 text-lg">Últimas Movimentações</h3>
                </div>
                <div className="divide-y divide-gray-50">
                    {transactions.length === 0 ? (
                        <p className="p-6 text-gray-500 text-center">Nenhuma movimentação registrada.</p>
                    ) : (
                        transactions.map((tx) => (
                            <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-full ${tx.status === 'PAGO' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {tx.status === 'PAGO' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{tx.product} - {tx.status}</p>
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <Calendar size={12} /> {new Date(tx.date).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${tx.status === 'PAGO' ? 'text-green-600' : 'text-gray-800'}`}>
                                        {tx.total_value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                    <p className="text-xs text-gray-400">{tx.status}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
