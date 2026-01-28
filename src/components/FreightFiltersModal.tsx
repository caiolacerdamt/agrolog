
import { X, Calendar, User, Truck, Package, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DatePicker } from './DatePicker';

interface FreightFiltersModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: FilterState) => void;
    activeFilters: FilterState;
}

export interface FilterState {
    startDate: string;
    endDate: string;
    status: string[];
    driverId: string;
    product: string;
}

export const initialFilters: FilterState = {
    startDate: '',
    endDate: '',
    status: [],
    driverId: '',
    product: '',
};

export function FreightFiltersModal({ isOpen, onClose, onApply, activeFilters }: FreightFiltersModalProps) {
    const [filters, setFilters] = useState<FilterState>(activeFilters);
    const [drivers, setDrivers] = useState<{ id: string; name: string }[]>([]);
    const [openDropdown, setOpenDropdown] = useState<'product' | 'driver' | null>(null);

    useEffect(() => {
        setFilters(activeFilters);
    }, [activeFilters, isOpen]);

    useEffect(() => {
        if (isOpen) {
            fetchDrivers();
        }
    }, [isOpen]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openDropdown && !(event.target as Element).closest('button[data-dropdown-trigger]')) {
                setOpenDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openDropdown]);


    const fetchDrivers = async () => {
        const { data } = await supabase.from('drivers').select('id, name').order('name');
        if (data) setDrivers(data);
    };

    const handleStatusToggle = (status: string) => {
        setFilters(prev => {
            const isActive = prev.status.includes(status);
            return {
                ...prev,
                status: isActive
                    ? prev.status.filter(s => s !== status)
                    : [...prev.status, status]
            };
        });
    };

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    const handleClear = () => {
        const reset = initialFilters;
        setFilters(reset);
        onApply(reset);
        onClose();
    };

    const getStatusColor = (status: string, isSelected: boolean) => {
        if (!isSelected) return 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50';

        switch (status) {
            case 'AGENDADO': return 'bg-purple-100 border-purple-200 text-purple-800';
            case 'EM_TRANSITO': return 'bg-amber-100 border-amber-200 text-amber-800';
            case 'DESCARREGADO': return 'bg-blue-100 border-blue-200 text-blue-800';
            case 'PAGO': return 'bg-emerald-100 border-emerald-200 text-emerald-800';
            case 'ATRASADO': return 'bg-rose-100 border-rose-200 text-rose-800';
            default: return 'bg-gray-50 border-gray-200 text-gray-700';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            {/* Modal Wrapper - Removed overflow-hidden and max-w-md, added max-w-2xl */}
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl relative my-8">
                {/* Header - Added rounded-t-2xl */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between rounded-t-2xl bg-white">
                    <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                        <Calendar size={20} className="text-verde-600" />
                        Filtrar Fretes
                    </h3>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content - Removed overflow-y-auto to allow dropdowns to overflow */}
                <div className="p-6 space-y-6">
                    {/* Date Range */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <Calendar size={16} /> Período
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <DatePicker
                                value={filters.startDate}
                                onChange={(date) => setFilters({ ...filters, startDate: date })}
                                label="De"
                            />
                            <DatePicker
                                value={filters.endDate}
                                onChange={(date) => setFilters({ ...filters, endDate: date })}
                                label="Até"
                            />
                        </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <Check size={16} /> Status
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {['AGENDADO', 'EM_TRANSITO', 'DESCARREGADO', 'PAGO', 'ATRASADO'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => handleStatusToggle(status)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shadow-sm ${getStatusColor(status, filters.status.includes(status))}`}
                                >
                                    {status.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product */}
                    <div className="space-y-1 relative">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <Package size={16} /> Produto
                        </label>
                        <div className="relative">
                            <button
                                type="button"
                                data-dropdown-trigger
                                onClick={() => setOpenDropdown(openDropdown === 'product' ? null : 'product')}
                                className="w-full text-left pl-3 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-verde-500 focus:border-verde-500 bg-white text-gray-800 font-medium shadow-sm transition-all hover:border-verde-300 flex items-center justify-between"
                            >
                                <span>
                                    {filters.product ? filters.product.charAt(0).toUpperCase() + filters.product.slice(1).toLowerCase() : 'Todos os produtos'}
                                </span>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </button>

                            {openDropdown === 'product' && (
                                <div className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 overflow-hidden left-0 right-0 animate-in fade-in zoom-in duration-200">
                                    <div className="p-1">
                                        <button
                                            type="button"
                                            onClick={() => { setFilters({ ...filters, product: '' }); setOpenDropdown(null); }}
                                            className={`w-full text-left px-4 py-3 rounded-lg text-sm mb-1 hover:bg-gray-50 text-gray-600`}
                                        >
                                            Todos os produtos
                                        </button>
                                        {['SOJA', 'MILHO', 'SORGO'].map((prod) => (
                                            <button
                                                key={prod}
                                                type="button"
                                                onClick={() => {
                                                    setFilters({ ...filters, product: prod });
                                                    setOpenDropdown(null);
                                                }}
                                                className={`
                                                    w-full text-left flex items-center justify-between px-4 py-3 rounded-lg text-sm mb-1
                                                    ${filters.product === prod ? 'bg-verde-50 border border-verde-200' : 'hover:bg-gray-50 border border-transparent'}
                                                `}
                                            >
                                                <span className="font-bold text-gray-800">
                                                    {prod.charAt(0).toUpperCase() + prod.slice(1).toLowerCase()}
                                                </span>
                                                {filters.product === prod && <div className="w-2 h-2 rounded-full bg-verde-500"></div>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Driver */}
                    <div className="space-y-1 relative">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <User size={16} /> Motorista
                        </label>
                        <div className="relative">
                            <button
                                type="button"
                                data-dropdown-trigger
                                onClick={() => setOpenDropdown(openDropdown === 'driver' ? null : 'driver')}
                                className="w-full text-left pl-3 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-verde-500 focus:border-verde-500 bg-white text-gray-800 font-medium shadow-sm transition-all hover:border-verde-300 flex items-center justify-between"
                            >
                                <span className={!filters.driverId ? 'text-gray-500' : ''}>
                                    {filters.driverId
                                        ? drivers.find(d => d.id === filters.driverId)?.name
                                        : 'Todos os motoristas'}
                                </span>
                                <Truck size={18} className="text-gray-400" />
                            </button>

                            {openDropdown === 'driver' && (
                                <div className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 max-h-60 overflow-y-auto bg-white left-0 right-0 animate-in fade-in zoom-in duration-200">
                                    <div className="p-1">
                                        <button
                                            type="button"
                                            onClick={() => { setFilters({ ...filters, driverId: '' }); setOpenDropdown(null); }}
                                            className="w-full text-left px-4 py-3 rounded-lg text-sm mb-1 hover:bg-gray-50 text-gray-600"
                                        >
                                            Todos os motoristas
                                        </button>
                                        {drivers.map(driver => (
                                            <button
                                                key={driver.id}
                                                type="button"
                                                onClick={() => {
                                                    setFilters({ ...filters, driverId: driver.id });
                                                    setOpenDropdown(null);
                                                }}
                                                className={`
                                                    w-full text-left flex items-center justify-between px-4 py-3 rounded-lg text-sm mb-1
                                                    ${filters.driverId === driver.id ? 'bg-verde-50 border border-verde-200' : 'hover:bg-gray-50 border border-transparent'}
                                                `}
                                            >
                                                <span className="font-bold text-gray-800">{driver.name}</span>
                                                {filters.driverId === driver.id && <div className="w-2 h-2 rounded-full bg-verde-500"></div>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer - Added rounded-b-2xl */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between rounded-b-2xl">
                    <button
                        onClick={handleClear}
                        className="text-gray-500 hover:text-gray-700 text-sm font-medium px-4 py-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Limpar
                    </button>
                    <button
                        onClick={handleApply}
                        className="bg-verde-600 hover:bg-verde-700 text-white text-sm font-bold px-6 py-2 rounded-lg shadow-sm shadow-verde-200 transition-colors"
                    >
                        Aplicar Filtros
                    </button>
                </div>
            </div>
        </div>
    );
}
