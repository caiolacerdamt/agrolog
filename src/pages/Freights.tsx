import { Plus, Search, Filter, FileSpreadsheet, Trash } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { NewFreightModal } from '../components/NewFreightModal';
import { StatusSelect } from '../components/StatusSelect';
import { ConfirmationModal } from '../components/ConfirmationModal';
import type { Database } from '../types/supabase';

type FreightWithDriver = Database['public']['Tables']['freights']['Row'] & {
    drivers: Database['public']['Tables']['drivers']['Row'] | null;
};

// ... (rest of imports)

export function FreightsPage() {
    // user removed as it was unused
    const [freights, setFreights] = useState<FreightWithDriver[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        freightId: null as string | null
    });

    const fetchFreights = async () => {
        try {
            const { data, error } = await supabase
                .from('freights')
                .select('*, drivers(*)')
                .order('date', { ascending: false });

            if (error) throw error;
            setFreights((data as any) || []);
        } catch (error) {
            console.error('Error fetching freights:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFreights();
    }, []);

    const handleStatusChange = async (freightId: string, newStatus: string) => {
        try {
            // @ts-ignore
            const { error } = await supabase
                .from('freights')
                // @ts-ignore
                .update({ status: newStatus } as any)
                .eq('id', freightId);

            if (error) throw error;

            // Sync driver status
            const freight = freights.find(f => f.id === freightId);
            if (freight?.driver_id) {
                const driverStatus = (newStatus === 'PAGO' || newStatus === 'DESCARREGADO')
                    ? 'Disponível'
                    : 'Em Viagem';

                await supabase
                    .from('drivers')
                    // @ts-ignore
                    .update({ status: driverStatus } as any)
                    .eq('id', freight.driver_id);
            }

            setFreights(freights.map(f => f.id === freightId ? { ...f, status: newStatus } : f));
        } catch (error) {
            console.error('Error updating status:', error);
            // Could replace this with a toast but generic error alert is okay for system failure
            alert('Erro ao atualizar status');
        }
    };

    const confirmDelete = (id: string) => {
        setDeleteModal({ isOpen: true, freightId: id });
    };

    const handleDelete = async () => {
        if (!deleteModal.freightId) return;

        try {
            // Find the freight first to check if it has a driver
            const freightToDelete = freights.find(f => f.id === deleteModal.freightId);

            // If it has a driver, revert their status to "Disponível"
            if (freightToDelete && freightToDelete.driver_id) {
                // @ts-ignore
                await supabase
                    .from('drivers')
                    // @ts-ignore
                    .update({ status: 'Disponível' } as any)
                    .eq('id', freightToDelete.driver_id);
            }

            // @ts-ignore
            const { error } = await supabase.from('freights').delete().eq('id', deleteModal.freightId);
            if (error) throw error;

            // Re-fetch or update local state for drivers might be needed if we want to reflect status change immediately there too, 
            // but for now Freights page update is primary. 
            // Better: update the local state correctly even if we don't refetch drivers page (which is separate).

            setFreights(freights.filter(f => f.id !== deleteModal.freightId));
            setDeleteModal({ isOpen: false, freightId: null });
        } catch (error) {
            console.error('Error deleting freight:', error);
            alert('Erro ao excluir frete');
        }
    };

    const filteredFreights = freights.filter(freight =>
        freight.drivers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        freight.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        freight.drivers?.license_plate?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <NewFreightModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={fetchFreights}
            />

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={handleDelete}
                title="Excluir Frete"
                message="Tem certeza que deseja excluir este frete? Esta ação não pode ser desfeita."
                confirmText="Excluir"
                variant="danger"
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Gestão de Fretes</h1>
                    <p className="text-gray-500">Gerencie todas as viagens, carregamentos e descargas.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                        <FileSpreadsheet size={18} />
                        <span>Exportar</span>
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-verde-600 text-white rounded-lg hover:bg-verde-700 transition-colors shadow-sm shadow-verde-200"
                    >
                        <Plus size={20} />
                        <span>Novo Frete</span>
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por motorista, placa ou destino..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-500/20 focus:border-verde-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-transparent hover:border-gray-200 transition-all">
                    <Filter size={18} />
                    <span>Filtros</span>
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-w-[calc(100vw-6rem)] md:max-w-full">
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase text-gray-500 font-medium whitespace-nowrap">
                                <th className="px-6 py-4">Dia</th>
                                <th className="px-6 py-4">Produto</th>
                                <th className="px-6 py-4">Placa</th>
                                <th className="px-6 py-4">Motorista</th>
                                <th className="px-6 py-4">Destino</th>
                                <th className="px-6 py-4 text-right">Peso Carreg.</th>
                                <th className="px-6 py-4 text-right">Peso p/ Saca</th>
                                <th className="px-6 py-4 text-right">Valor p/ Saca</th>
                                <th className="px-6 py-4">Data Descarga</th>
                                <th className="px-6 py-4 text-right">Recebimentos</th>
                                <th className="px-6 py-4 text-right">A Receber</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={12} className="px-6 py-8 text-center text-gray-500">
                                        Carregando fretes...
                                    </td>
                                </tr>
                            ) : filteredFreights.length === 0 ? (
                                <tr>
                                    <td colSpan={12} className="px-6 py-8 text-center text-gray-500">
                                        Nenhum frete encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredFreights.map((freight) => (
                                    <tr key={freight.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer group text-sm">
                                        <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                                            {new Date(freight.date).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-800">
                                            {freight.product}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-600">
                                                {freight.drivers?.license_plate || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-700 whitespace-nowrap">
                                            {freight.drivers?.name || 'Sem Motorista'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {freight.destination}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-700">
                                            {freight.weight_loaded.toLocaleString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-600">
                                            {freight.weight_sack?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-verde-700 whitespace-nowrap">
                                            {freight.unit_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                            -
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-600 whitespace-nowrap">
                                            {freight.receipts ? freight.receipts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-red-600 whitespace-nowrap">
                                            {freight.total_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <StatusSelect
                                                    currentStatus={(freight.status || 'EM_TRANSITO') as any}
                                                    onChange={(newStatus) => handleStatusChange(freight.id, newStatus)}
                                                />
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); confirmDelete(freight.id); }}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Excluir Frete"
                                                >
                                                    <Trash size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {!loading && (
                    <div className="p-4 border-t border-gray-100 text-sm text-gray-500 flex justify-between items-center">
                        <span>Mostrando {filteredFreights.length} resultados</span>
                        <div className="flex gap-2">
                            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50">Anterior</button>
                            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50">Próximo</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


