import { TrendingUp, Truck, Users, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type FreightWithDriver = Database['public']['Tables']['freights']['Row'] & {
    drivers: Database['public']['Tables']['drivers']['Row'] | null;
};

export function Dashboard() {
    const [stats, setStats] = useState([
        { label: 'Viagens no Mês', value: '0', icon: Truck, color: 'bg-blue-50 text-blue-600', trend: '-' },
        { label: 'Faturamento Bruto', value: 'R$ 0', icon: TrendingUp, color: 'bg-green-50 text-green-600', trend: '-' },
        { label: 'Motoristas Ativos', value: '0', icon: Users, color: 'bg-orange-50 text-orange-600', trend: '-' },
        { label: 'Pendências', value: '0', icon: AlertCircle, color: 'bg-red-50 text-red-600', trend: '-' },
    ]);
    const [recentFreights, setRecentFreights] = useState<FreightWithDriver[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch recent freights
                const { data: freightsData } = await supabase
                    .from('freights')
                    .select('*, drivers(*)')
                    .order('date', { ascending: false })
                    .limit(5);

                // @ts-ignore
                const { data: allFreights } = await supabase
                    .from('freights')
                    .select('total_value, status');

                // @ts-ignore
                const { count: driversCount } = await supabase
                    .from('drivers')
                    .select('*', { count: 'exact', head: true });

                if (freightsData) {
                    setRecentFreights((freightsData as any) || []);
                }

                if (allFreights) {
                    // @ts-ignore
                    const totalRevenue = allFreights.reduce((acc, curr) => acc + (curr.total_value || 0), 0);
                    // @ts-ignore
                    const pendingCount = allFreights.filter(f => f.status !== 'PAGO').length;
                    const tripsCount = allFreights.length;

                    setStats([
                        { label: 'Viagens Totais', value: tripsCount.toString(), icon: Truck, color: 'bg-blue-50 text-blue-600', trend: 'Total' },
                        { label: 'Faturamento Bruto', value: totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }), icon: TrendingUp, color: 'bg-green-50 text-green-600', trend: 'Total' },
                        { label: 'Motoristas', value: driversCount?.toString() || '0', icon: Users, color: 'bg-orange-50 text-orange-600', trend: 'Cadastrados' },
                        { label: 'Pendências', value: pendingCount.toString(), icon: AlertCircle, color: 'bg-red-50 text-red-600', trend: 'Fretes' },
                    ]);
                }

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Painel de Controle</h2>
                <span className="text-sm text-gray-500">Visão Geral</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-lg ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            <span className="text-xs font-medium px-2 py-1 bg-gray-50 rounded-full text-gray-600">
                                {stat.trend}
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                        <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-800">Viagens Recentes</h3>
                        <Link to="/fretes" className="text-verde-600 text-sm font-medium hover:underline flex items-center gap-1">
                            Ver todas <ArrowRight size={16} />
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <p className="text-gray-500 text-center py-4">Carregando...</p>
                        ) : recentFreights.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">Nenhuma viagem registrada.</p>
                        ) : (
                            recentFreights.map((freight) => (
                                <div key={freight.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-gray-700 border border-gray-100 uppercase">
                                            {freight.drivers?.name?.slice(0, 2) || 'NA'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">{freight.drivers?.name || 'Sem Motorista'}</p>
                                            <p className="text-xs text-gray-500">Destino: {freight.destination} • {freight.product}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-800">{freight.total_value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${freight.status === 'EM_TRANSITO' ? 'bg-amber-100 text-amber-800' :
                                                freight.status === 'DESCARREGADO' ? 'bg-blue-100 text-blue-800' :
                                                    freight.status === 'PAGO' ? 'bg-emerald-100 text-emerald-800' :
                                                        freight.status === 'ATRASADO' ? 'bg-rose-100 text-rose-800' :
                                                            'bg-gray-100 text-gray-600'
                                            }`}>
                                            {freight.status?.replace('_', ' ') || 'Registrado'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-verde-900 rounded-xl shadow-sm border border-verde-800 p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-verde-800 rounded-full -mr-16 -mt-16 opacity-50"></div>
                    <div className="relative z-10">
                        <h3 className="font-bold text-lg mb-2">Acesso Rápido</h3>
                        <p className="text-verde-100 text-sm mb-6">Cadastre novos fretes ou motoristas rapidamente.</p>

                        <div className="space-y-3">
                            <Link to="/fretes" className="block w-full text-center py-2 bg-white text-verde-900 font-bold rounded-lg hover:bg-verde-50 transition-colors">
                                Novo Frete
                            </Link>
                            <Link to="/motoristas" className="block w-full text-center py-2 bg-verde-800 text-white font-medium rounded-lg hover:bg-verde-700 transition-colors border border-verde-700">
                                Cadastrar Motorista
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
