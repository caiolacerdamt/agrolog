import { DollarSign, Calendar, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function FinancePage() {
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [summary, setSummary] = useState({
        totalRevenue: 0,
        totalReceipts: 0,
        totalPending: 0,
        profitMargin: 0,
        dailyStats: [] as { day: number, value: number, count: number }[],
        maxDailyValue: 1,
        bestDay: { day: 0, value: 0, count: 0 },
        totalTrucks: 0
    });

    useEffect(() => {
        fetchFinanceData();
    }, []);

    const fetchFinanceData = async () => {
        try {
            // @ts-ignore
            const { data, error } = await supabase
                .from('freights')
                .select('id, weight_loaded, status, date, product, origin, destination, drivers(name)')
                .order('date', { ascending: false });

            if (error) throw error;

            if (data) {
                const freights = data as any[];

                // Calculate Total Weight in Tons
                const totalWeight = freights.reduce((acc, curr) => acc + (curr.weight_loaded || 0), 0);

                // Commission: R$ 5,00 per Ton
                const totalCommission = totalWeight * 5;

                // --- Daily Chart Calculations ---
                const today = new Date();
                const currentMonth = today.getMonth();
                const currentYear = today.getFullYear();
                const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

                // Initialize array for all days in month
                const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
                    day: i + 1,
                    value: 0,
                    count: 0
                }));

                // Aggregate commissions by day (using 'date' - Loading Date)
                freights.forEach(freight => {
                    const fDate = new Date(freight.date + 'T12:00:00');
                    // Filter for current month only
                    if (fDate.getMonth() === currentMonth && fDate.getFullYear() === currentYear) {
                        const dayIndex = fDate.getDate() - 1;
                        if (dailyData[dayIndex]) {
                            const commission = (freight.weight_loaded || 0) * 5;
                            dailyData[dayIndex].value += commission;
                            dailyData[dayIndex].count += 1;
                        }
                    }
                });

                // Find max value for scaling
                const maxDailyValue = Math.max(...dailyData.map(d => d.value), 1); // Avoid div by 0
                const bestDay = dailyData.reduce((prev, current) => (prev.value > current.value) ? prev : current, { day: 0, value: 0, count: 0 });

                setSummary({
                    totalRevenue: totalCommission,
                    totalReceipts: 0,
                    totalPending: 0,
                    profitMargin: 0,
                    dailyStats: dailyData,
                    maxDailyValue: maxDailyValue,
                    bestDay: bestDay,
                    totalTrucks: freights.length
                });

                setTransactions(freights.slice(0, 5));
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
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-3">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-verde-100 rounded-lg flex items-center justify-center text-verde-600">
                                <DollarSign size={24} />
                            </div>
                            <span className="text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                                R$ 5,00 / Ton
                            </span>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium">Faturamento Total (Comissão)</h3>
                        <p className="text-4xl font-bold text-gray-800 mt-2">
                            {summary.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                            Baseado no volume total transportado.
                        </p>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Resumo Mensal</h3>
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Daily List Section - Replaces Broken Chart */}
                    <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-500 uppercase mb-4">Detalhamento Diário (Mês Atual)</h4>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {summary.dailyStats.filter(s => s.value > 0).length === 0 ? (
                                <p className="text-gray-400 text-sm">Nenhuma atividade registrada neste mês.</p>
                            ) : (
                                summary.dailyStats
                                    .filter(stat => stat.value > 0)
                                    .sort((a, b) => b.day - a.day) // Sort by most recent day
                                    .map((stat) => (
                                        <div key={stat.day} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-green-50 transition-colors border border-transparent hover:border-green-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-green-600 font-bold text-xs shadow-sm">
                                                    {stat.day}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-700">Dia {stat.day}</span>
                                                    <span className="text-xs text-gray-400">{stat.count} viagens</span>
                                                </div>
                                            </div>
                                            <span className="font-bold text-gray-800">
                                                {stat.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>

                    {/* Stats Side Panel */}
                    <div className="w-full md:w-64 space-y-4 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                        <div className="space-y-1">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase">Cargas Realizadas</h4>
                            <div className="text-2xl font-bold text-gray-800 flex items-baseline gap-2">
                                {summary.totalTrucks} <span className="text-xs text-gray-400 font-normal">viagens</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase">Melhor Dia</h4>
                            <div className="text-lg font-bold text-green-600">
                                Dia {summary.bestDay.day}
                            </div>
                            <div className="text-xs text-gray-400">
                                {summary.bestDay.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase">Média Diária</h4>
                            <div className="text-lg font-bold text-gray-700">
                                {(summary.totalRevenue / new Date().getDate()).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                        </div>
                    </div>
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
                                        <p className="font-semibold text-gray-800">
                                            {tx.product}
                                            <span className="mx-2 text-gray-300">|</span>
                                            <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase">
                                                {(tx.status || '').replace('_', ' ')}
                                            </span>
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {tx.drivers?.name || 'Motorista N/A'} • {tx.origin} ➝ {tx.destination}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-verde-600">
                                        {((tx.weight_loaded || 0) * 5).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                    <div className="flex flex-col items-end">
                                        <p className="text-xs text-gray-400">
                                            {(tx.weight_loaded || 0).toLocaleString('pt-BR')} Ton
                                        </p>
                                        <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                            <Calendar size={10} /> {new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
