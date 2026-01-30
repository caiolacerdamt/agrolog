import { Plus, Search, Filter, FileSpreadsheet, Trash, Pencil } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { NewFreightModal } from '../components/NewFreightModal';
import { FreightFiltersModal, initialFilters, type FilterState } from '../components/FreightFiltersModal';
import { StatusSelect } from '../components/StatusSelect';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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
    const [editingFreight, setEditingFreight] = useState<FreightWithDriver | null>(null);

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        freightId: null as string | null
    });

    // Filters & Sorting
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [filters, setFilters] = useState<FilterState>(initialFilters);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown size={14} className="opacity-30" />;
        return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-verde-600" /> : <ArrowDown size={14} className="text-verde-600" />;
    };

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

    const handlePaymentToggle = async (freightId: string, field: 'advance_paid' | 'balance_paid', currentValue: boolean) => {
        try {
            // @ts-ignore
            const { error } = await supabase
                .from('freights')
                // @ts-ignore
                .update({ [field]: !currentValue } as any)
                .eq('id', freightId);

            if (error) throw error;

            setFreights(freights.map(f => f.id === freightId ? { ...f, [field]: !currentValue } : f));
        } catch (error) {
            console.error('Error updating payment status:', error);
            alert('Erro ao atualizar pagamento');
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

    const processedFreights = freights.filter(freight => {
        // Search Term
        const matchesSearch =
            freight.drivers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            freight.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
            freight.drivers?.license_plate?.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        // Strict Filters
        if (filters.startDate && freight.date < filters.startDate) return false;
        if (filters.endDate && freight.date > filters.endDate) return false;
        if (filters.status.length > 0 && !filters.status.includes(freight.status || '')) return false;
        if (filters.product && freight.product !== filters.product) return false;
        if (filters.driverId && freight.driver_id !== filters.driverId) return false;

        return true;
    }).sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;

        let aValue: any = a[key as keyof FreightWithDriver];
        let bValue: any = b[key as keyof FreightWithDriver];

        // Handle nested or special keys
        if (key === 'drivers.name') {
            aValue = a.drivers?.name || '';
            bValue = b.drivers?.name || '';
        } else if (key === 'drivers.license_plate') {
            aValue = a.drivers?.license_plate || '';
            bValue = b.drivers?.license_plate || '';
        }

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <div className="space-y-6">
            <NewFreightModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingFreight(null);
                }}
                onSave={fetchFreights}
                freightToEdit={editingFreight}
            />

            <FreightFiltersModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                onApply={setFilters}
                activeFilters={filters}
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
                        onClick={() => {
                            setEditingFreight(null);
                            setIsModalOpen(true);
                        }}
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
                <button
                    onClick={() => setIsFilterModalOpen(true)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${JSON.stringify(filters) !== JSON.stringify(initialFilters)
                        ? 'bg-verde-50 border-verde-200 text-verde-700'
                        : 'text-gray-600 hover:bg-gray-100 border-transparent hover:border-gray-200'
                        }`}
                >
                    <Filter size={18} />
                    <span>Filtros</span>
                    {JSON.stringify(filters) !== JSON.stringify(initialFilters) && (
                        <span className="w-2 h-2 rounded-full bg-verde-500"></span>
                    )}
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-w-[calc(100vw-6rem)] md:max-w-full">
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase text-gray-500 font-medium whitespace-nowrap">
                                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('date')}>
                                    <div className="flex items-center gap-1">Dia {getSortIcon('date')}</div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('product')}>
                                    <div className="flex items-center gap-1">Produto {getSortIcon('product')}</div>
                                </th>
                                <th className="px-6 py-4">Nota</th>
                                <th className="px-6 py-4">Placa</th>
                                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('drivers.name')}>
                                    <div className="flex items-center gap-1">Motorista {getSortIcon('drivers.name')}</div>
                                </th>
                                <th className="px-6 py-4">Origem / Destino</th>
                                <th className="px-6 py-4 text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('weight_loaded')}>
                                    <div className="flex items-center justify-end gap-1">Peso (Ton) {getSortIcon('weight_loaded')}</div>
                                </th>
                                <th className="px-6 py-4 text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('sacks_amount')}>
                                    <div className="flex items-center justify-end gap-1">Qtd. Sacas {getSortIcon('sacks_amount')}</div>
                                </th>
                                <th className="px-6 py-4 text-right">Peso p/ Saca</th>
                                <th className="px-6 py-4 text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('unit_price')}>
                                    <div className="flex items-center justify-end gap-1">Valor p/ Ton {getSortIcon('unit_price')}</div>
                                </th>
                                <th className="px-6 py-4">Data Descarga</th>
                                <th className="px-6 py-4 text-right text-blue-600">70% (Adiant.)</th>
                                <th className="px-6 py-4 text-right text-orange-600">30% (Saldo)</th>
                                <th className="px-6 py-4 text-right text-purple-600">Comissão (5/ton)</th>
                                <th className="px-6 py-4 text-right">Valor Total</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={13} className="px-6 py-8 text-center text-gray-500">
                                        Carregando fretes...
                                    </td>
                                </tr>
                            ) : processedFreights.length === 0 ? (
                                <tr>
                                    <td colSpan={13} className="px-6 py-8 text-center text-gray-500">
                                        Nenhum frete encontrado.
                                    </td>
                                </tr>
                            ) : (
                                processedFreights.map((freight) => (
                                    <tr key={freight.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer group text-sm">
                                        <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                                            {freight.date ? new Date(freight.date + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-800">
                                            {freight.product}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                            {freight.invoice_number || '-'}
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
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="font-medium text-gray-800">{freight.origin}</span>
                                                <span className="text-gray-400">➝</span>
                                                <span>{freight.destination}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-700">
                                            {freight.weight_loaded.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-600 font-medium">
                                            {freight.sacks_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-600">
                                            {freight.weight_sack?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-verde-700 whitespace-nowrap">
                                            {freight.unit_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                            {freight.discharge_date ? new Date(freight.discharge_date + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                                        </td>

                                        {/* Advance 70% */}
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <span className="font-medium text-blue-700">
                                                    {(freight.total_value * 0.70).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePaymentToggle(freight.id, 'advance_paid', freight.advance_paid || false);
                                                    }}
                                                    className={`
                                                        flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all border shadow-sm
                                                        ${freight.advance_paid
                                                            ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                                                            : 'bg-white text-gray-400 border-gray-200 hover:border-blue-300 hover:text-blue-500'
                                                        }
                                                    `}
                                                >
                                                    {freight.advance_paid ? (
                                                        <>
                                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                            PAGO
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                                            PENDENTE
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </td>

                                        {/* Balance 30% */}
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <span className="font-medium text-orange-700">
                                                    {(freight.total_value * 0.30).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePaymentToggle(freight.id, 'balance_paid', freight.balance_paid || false);
                                                    }}
                                                    className={`
                                                        flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all border shadow-sm
                                                        ${freight.balance_paid
                                                            ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                                                            : 'bg-white text-gray-400 border-gray-200 hover:border-orange-300 hover:text-orange-500'
                                                        }
                                                    `}
                                                >
                                                    {freight.balance_paid ? (
                                                        <>
                                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                            PAGO
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                                            PENDENTE
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </td>

                                        {/* Commission (R$ 5,00 per Ton) */}
                                        <td className="px-6 py-4 text-right font-medium text-purple-700 bg-purple-50/30 whitespace-nowrap">
                                            {((freight.weight_loaded || 0) * 5).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </td>

                                        <td className="px-6 py-4 text-right font-medium text-gray-800 whitespace-nowrap">
                                            {freight.total_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <StatusSelect
                                                    currentStatus={(freight.status || 'EM_TRANSITO') as any}
                                                    onChange={(newStatus) => handleStatusChange(freight.id, newStatus)}
                                                />
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingFreight(freight);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Editar Frete"
                                                >
                                                    <Pencil size={16} />
                                                </button>
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
                        <tfoot className="bg-gray-50 border-t-2 border-gray-200 font-bold text-gray-700 text-sm">
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-right uppercase text-xs tracking-wider text-gray-500">
                                    Totais da Página
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {processedFreights.reduce((acc, curr) => acc + (curr.weight_loaded || 0), 0)
                                        .toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {processedFreights.reduce((acc, curr) => acc + (curr.sacks_amount || 0), 0)
                                        .toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td></td> {/* Peso Saca */}
                                <td></td> {/* Valor Ton */}
                                <td></td> {/* Data Descarga */}
                                <td></td> {/* Adiantamento - Empty */}
                                <td></td> {/* Saldo - Empty */}
                                <td className="px-6 py-4 text-right text-purple-700 bg-purple-50/50">
                                    {processedFreights.reduce((acc, curr) => acc + ((curr.weight_loaded || 0) * 5), 0)
                                        .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </td>
                                <td className="px-6 py-4 text-right text-gray-900 border-l border-gray-200">
                                    {processedFreights.reduce((acc, curr) => acc + (curr.total_value || 0), 0)
                                        .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </td>
                                <td></td> {/* Status */}
                            </tr>
                        </tfoot>
                    </table>
                </div>
                {!loading && (
                    <div className="p-4 border-t border-gray-100 text-sm text-gray-500 flex justify-between items-center">
                        <span>Mostrando {processedFreights.length} resultados</span>
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


