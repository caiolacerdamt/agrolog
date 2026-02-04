import { X, Save, Calculator, User, MapPin, Truck, Package, DollarSign } from 'lucide-react';
import { DatePicker } from './DatePicker';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../types/supabase';

type Driver = Database['public']['Tables']['drivers']['Row'];

interface NewFreightModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    freightToEdit?: any;
}

export function NewFreightModal({ isOpen, onClose, onSave, freightToEdit }: NewFreightModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [drivers, setDrivers] = useState<Driver[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        // Initialize with Local Date (not UTC) to avoid "tomorrow" bug late at night
        date: new Date().toLocaleDateString('pt-BR').split('/').reverse().join('-'),
        dischargeDate: new Date().toLocaleDateString('pt-BR').split('/').reverse().join('-'),
        product: 'SOJA',
        driver_id: '',
        origin: '',
        destination: '',
        invoiceNumber: '',
        weightLoaded: 0,
        unitPrice: 0,
    });

    const [calculations, setCalculations] = useState({
        sacksAmount: 0,
        totalValue: 0,
    });

    useEffect(() => {
        if (isOpen && user) {
            fetchDrivers();
            if (freightToEdit) {
                setFormData({
                    date: freightToEdit.date,
                    dischargeDate: freightToEdit.discharge_date || '',
                    product: freightToEdit.product,
                    driver_id: freightToEdit.driver_id || '',
                    origin: freightToEdit.origin || '',
                    destination: freightToEdit.destination || '',
                    invoiceNumber: freightToEdit.invoice_number || '',
                    weightLoaded: freightToEdit.weight_loaded,
                    unitPrice: freightToEdit.unit_price,
                });
            } else {
                // Check for draft
                const savedDraft = localStorage.getItem('new_freight_draft');
                if (savedDraft) {
                    try {
                        const parsedDraft = JSON.parse(savedDraft);
                        setFormData(parsedDraft);
                    } catch (e) {
                        console.error("Error parsing draft", e);
                        // Fallback to default
                        setFormData({
                            date: new Date().toLocaleDateString('pt-BR').split('/').reverse().join('-'),
                            dischargeDate: new Date().toLocaleDateString('pt-BR').split('/').reverse().join('-'),
                            product: 'SOJA',
                            driver_id: '',
                            origin: '',
                            destination: '',
                            invoiceNumber: '',
                            weightLoaded: 0,
                            unitPrice: 0,
                        });
                    }
                } else {
                    // Reset form when opening in create mode (no draft)
                    setFormData({
                        date: new Date().toLocaleDateString('pt-BR').split('/').reverse().join('-'),
                        dischargeDate: new Date().toLocaleDateString('pt-BR').split('/').reverse().join('-'),
                        product: 'SOJA',
                        driver_id: '',
                        origin: '',
                        destination: '',
                        invoiceNumber: '',
                        weightLoaded: 0,
                        unitPrice: 0,
                    });
                }
            }
        }
    }, [isOpen, user, freightToEdit]);

    // Save draft on change (only if not editing)
    useEffect(() => {
        if (!freightToEdit && isOpen) {
            localStorage.setItem('new_freight_draft', JSON.stringify(formData));
        }
    }, [formData, freightToEdit, isOpen]);

    const fetchDrivers = async () => {
        const { data } = await supabase.from('drivers').select('*').order('name');
        if (data) setDrivers(data);
    };

    // Auto-calculate whenever weight or price changes
    useEffect(() => {
        // Weight is now in Tons
        const uniquePrice = formData.unitPrice;
        const total = formData.weightLoaded * uniquePrice;

        // Sacks calculation: (Tons * 1000) / 60
        const sacks = (formData.weightLoaded * 1000) / 60;

        setCalculations({
            sacksAmount: sacks,
            totalValue: total,
        });
    }, [formData.weightLoaded, formData.unitPrice]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!user) return;

            // Find selected driver to get their info if needed (though we rely on ID)
            // Save to Supabase
            // @ts-ignore - Supabase type definition mismatch for insert
            let error;

            if (freightToEdit) {
                const { error: updateError } = await (supabase
                    .from('freights') as any)
                    .update({
                        date: formData.date,
                        discharge_date: formData.dischargeDate || null,
                        product: formData.product,
                        driver_id: formData.driver_id || null,
                        origin: formData.origin,
                        destination: formData.destination,
                        invoice_number: formData.invoiceNumber,
                        weight_loaded: formData.weightLoaded,
                        unit_price: formData.unitPrice,
                        total_value: calculations.totalValue,
                        sacks_amount: calculations.sacksAmount,
                        weight_sack: 60,
                    })
                    .eq('id', freightToEdit.id);
                error = updateError;
            } else {
                const { error: insertError } = await (supabase.from('freights') as any).insert({
                    user_id: user.id,
                    date: formData.date,
                    discharge_date: formData.dischargeDate || null,
                    product: formData.product,
                    driver_id: formData.driver_id || null,
                    origin: formData.origin,
                    destination: formData.destination,
                    invoice_number: formData.invoiceNumber,
                    weight_loaded: formData.weightLoaded,
                    unit_price: formData.unitPrice,
                    total_value: calculations.totalValue,
                    sacks_amount: calculations.sacksAmount,
                    weight_sack: 60,
                    status: formData.date > new Date().toISOString().split('T')[0] ? 'AGENDADO' : 'EM_TRANSITO',
                });
                error = insertError;
            }

            if (error) throw error;

            // Sync Driver Status
            const today = new Date().toLocaleDateString('pt-BR').split('/').reverse().join('-');
            const isFuture = formData.date > today;

            // Helper to determine new driver status
            const getNewDriverStatus = (currentDriverStatus: string | null | undefined) => {
                if (!isFuture) return 'Em Viagem'; // If freight is today/past, always Busy

                // If freight is future
                if (currentDriverStatus === 'Em Viagem') return 'Em Viagem'; // Keep busy if already busy
                return 'Reservado'; // Else reserve
            };

            if (formData.driver_id && !freightToEdit) {
                // New Freight
                const selectedDriver = drivers.find(d => d.id === formData.driver_id);
                const newStatus = getNewDriverStatus(selectedDriver?.status);

                await (supabase
                    .from('drivers') as any)
                    .update({ status: newStatus })
                    .eq('id', formData.driver_id);
            } else if (freightToEdit && formData.driver_id !== freightToEdit.driver_id) {
                // Edit Freight: Swap Drivers
                // 1. Release old driver
                if (freightToEdit.driver_id) {
                    await (supabase
                        .from('drivers') as any)
                        .update({ status: 'Disponível' })
                        .eq('id', freightToEdit.driver_id);
                }

                // 2. Occupy new driver
                if (formData.driver_id) {
                    const selectedDriver = drivers.find(d => d.id === formData.driver_id);
                    const newStatus = getNewDriverStatus(selectedDriver?.status);

                    await (supabase
                        .from('drivers') as any)
                        .update({ status: newStatus })
                        .eq('id', formData.driver_id);
                }
            }
            // If editing and changing driver, we might need logic to free up independent driver, but skipping for now for simplicity

            if (error) throw error;
            onSave();
            onClose();
            // Clear draft on success
            localStorage.removeItem('new_freight_draft');

            // Reset form
            setFormData({
                date: new Date().toISOString().split('T')[0],
                dischargeDate: new Date().toISOString().split('T')[0],
                product: 'SOJA',
                driver_id: '',
                origin: '',
                destination: '',
                invoiceNumber: '',
                weightLoaded: 0,
                unitPrice: 0,
            });
        } catch (error) {
            console.error('Error saving freight:', error);
            alert('Erro ao salvar frete');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-verde-900 px-6 py-4 flex items-center justify-between text-white">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Truck className="text-verde-400" />
                        {freightToEdit ? 'Editar Frete' : 'Novo Frete'}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-verde-800 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">

                    {/* Row 1: Basics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <DatePicker
                                label="Data Carregamento"
                                value={formData.date}
                                onChange={(date) => setFormData({ ...formData, date })}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <DatePicker
                                label="Data Descarga"
                                value={formData.dischargeDate}
                                onChange={(date) => setFormData({ ...formData, dischargeDate: date })}
                            />
                        </div>
                    </div>

                    {/* Row 2: Invoice & Product */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Nº Nota</label>
                            <input
                                type="text"
                                placeholder="12345"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-500"
                                value={formData.invoiceNumber}
                                onChange={e => setFormData({ ...formData, invoiceNumber: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                <Package size={14} /> Produto
                            </label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const dropdown = document.getElementById('product-dropdown');
                                        if (dropdown) dropdown.classList.toggle('hidden');
                                        document.getElementById('driver-dropdown')?.classList.add('hidden'); // Close other dropdown
                                    }}
                                    className="w-full text-left pl-3 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-verde-500 focus:border-verde-500 bg-white text-gray-800 font-medium shadow-sm transition-all hover:border-verde-300 flex items-center justify-between"
                                >
                                    <span>
                                        {formData.product ? formData.product.charAt(0).toUpperCase() + formData.product.slice(1).toLowerCase() : 'Selecione...'}
                                    </span>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </button>

                                {/* Dropdown Menu */}
                                <div id="product-dropdown" className="hidden absolute z-50 mt-2 w-full bg-white rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 overflow-hidden left-0 right-0">
                                    <div className="p-1">
                                        {['SOJA', 'MILHO', 'SORGO'].map((prod) => (
                                            <button
                                                key={prod}
                                                type="button"
                                                onClick={() => {
                                                    setFormData({ ...formData, product: prod });
                                                    document.getElementById('product-dropdown')?.classList.add('hidden');
                                                }}
                                                className={`
                                                    w-full text-left flex items-center justify-between px-4 py-3 rounded-lg text-sm mb-1
                                                    ${formData.product === prod ? 'bg-verde-50 border border-verde-200' : 'hover:bg-gray-50 border border-transparent'}
                                                `}
                                            >
                                                <span className="font-bold text-gray-800">
                                                    {prod.charAt(0).toUpperCase() + prod.slice(1).toLowerCase()}
                                                </span>
                                                {formData.product === prod && <div className="w-2 h-2 rounded-full bg-verde-500"></div>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Driver */}
                    <div className="space-y-1 relative">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <User size={14} /> Motorista
                        </label>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    const dropdown = document.getElementById('driver-dropdown');
                                    if (dropdown) dropdown.classList.toggle('hidden');
                                }}
                                className="w-full text-left pl-3 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-verde-500 focus:border-verde-500 bg-white text-gray-800 font-medium shadow-sm transition-all hover:border-verde-300 flex items-center justify-between"
                            >
                                <span className={!formData.driver_id ? 'text-gray-400' : ''}>
                                    {formData.driver_id
                                        ? drivers.find(d => d.id === formData.driver_id)?.name
                                        : 'Selecione um motorista...'}
                                </span>
                                <Truck size={18} className="text-gray-400" />
                            </button>

                            {/* Dropdown Menu */}
                            <div id="driver-dropdown" className="hidden absolute z-50 mt-2 w-fullbg-white rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 max-h-60 overflow-y-auto bg-white left-0 right-0">
                                <div className="p-1">
                                    {drivers.map(driver => (
                                        <button
                                            key={driver.id}
                                            type="button"
                                            onClick={() => {
                                                setFormData({ ...formData, driver_id: driver.id });
                                                document.getElementById('driver-dropdown')?.classList.add('hidden');
                                            }}
                                            className={`
                                                w-full text-left flex items-center justify-between px-4 py-3 rounded-lg text-sm mb-1
                                                ${formData.driver_id === driver.id ? 'bg-verde-50 border border-verde-200' : 'hover:bg-gray-50 border border-transparent'}
                                            `}
                                        >
                                            <div>
                                                <div className="font-bold text-gray-800">{driver.name}</div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                                    <span>{driver.license_plate || 'S/ Placa'}</span>
                                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                    <span className={
                                                        driver.status === 'Disponível' ? 'text-green-600' :
                                                            driver.status === 'Em Viagem' ? 'text-blue-600' :
                                                                driver.status === 'Reservado' ? 'text-amber-600' : 'text-orange-600'
                                                    }>{driver.status}</span>
                                                </div>
                                            </div>
                                            {formData.driver_id === driver.id && <div className="w-2 h-2 rounded-full bg-verde-500"></div>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 pt-1 px-1">Selecione o motorista responsável pela carga.</p>
                    </div>

                    {/* Row 3: Destination */}
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <MapPin size={14} /> Origem / Destino
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            type="text"
                            required
                            placeholder="Origem"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-500"
                            value={formData.origin}
                            onChange={e => setFormData({ ...formData, origin: e.target.value })}
                        />
                        <input
                            type="text"
                            required
                            placeholder="Destino"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-500"
                            value={formData.destination}
                            onChange={e => setFormData({ ...formData, destination: e.target.value })}
                        />
                    </div>


                    <div className="h-px bg-gray-200" />

                    {/* Section: Values */}
                    <div className="bg-verde-50 p-4 rounded-xl border border-verde-100 space-y-4">
                        <div className="flex items-center gap-2 text-verde-800 font-semibold mb-2">
                            <Calculator size={18} />
                            Cálculo do Frete
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Peso Carregamento (Toneladas)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.001"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-500"
                                    value={formData.weightLoaded || ''}
                                    onChange={e => setFormData({ ...formData, weightLoaded: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                    <DollarSign size={14} /> Valor Por Tonelada
                                </label>
                                <div className="space-y-1">
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-500"
                                        value={formData.unitPrice || ''}
                                        onChange={e => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                                    />
                                    <p className="text-xs text-gray-500">Valor pago por tonelada.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-3 rounded-lg border border-verde-200">
                                <span className="text-xs text-gray-500 uppercase font-semibold">Qtd. Sacas (60kg)</span>
                                <div className="text-xl font-bold text-gray-800">
                                    {calculations.sacksAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-verde-200">
                                <span className="text-xs text-gray-500 uppercase font-semibold">Valor Total Frete</span>
                                <div className="text-xl font-bold text-verde-700">
                                    {calculations.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </div>
                            </div>
                        </div>

                        {/* Payment Breakdown */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <span className="text-xs text-blue-600 uppercase font-semibold">Adiantamento (70%)</span>
                                <div className="text-lg font-bold text-blue-800">
                                    {(calculations.totalValue * 0.70).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </div>
                            </div>
                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                                <span className="text-xs text-orange-600 uppercase font-semibold">Restante (30%)</span>
                                <div className="text-lg font-bold text-orange-800">
                                    {(calculations.totalValue * 0.30).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 bg-verde-600 hover:bg-verde-700 text-white rounded-lg transition-colors shadow-lg shadow-verde-200 font-bold disabled:opacity-50"
                        >
                            <Save size={18} />
                            {loading ? 'Salvando...' : 'Salvar Frete'}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
}
