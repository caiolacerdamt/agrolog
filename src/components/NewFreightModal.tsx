import { X, Save, Calculator, Calendar, User, MapPin, Truck, Package, DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../types/supabase';

type Driver = Database['public']['Tables']['drivers']['Row'];

interface NewFreightModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

export function NewFreightModal({ isOpen, onClose, onSave }: NewFreightModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [drivers, setDrivers] = useState<Driver[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        product: 'SOJA',
        driver_id: '',
        destination: '',
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
        }
    }, [isOpen, user]);

    const fetchDrivers = async () => {
        const { data } = await supabase.from('drivers').select('*').order('name');
        if (data) setDrivers(data);
    };

    // Auto-calculate whenever weight or price changes
    useEffect(() => {
        const sacks = formData.weightLoaded / 60;
        const total = sacks * formData.unitPrice;

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
            const { error } = await supabase.from('freights').insert({
                user_id: user.id,
                date: formData.date,
                product: formData.product,
                driver_id: formData.driver_id || null,
                destination: formData.destination,
                weight_loaded: formData.weightLoaded,
                unit_price: formData.unitPrice,
                total_value: calculations.totalValue,
                sacks_amount: calculations.sacksAmount,
                weight_sack: 60,
                status: 'EM_TRANSITO',
            });

            if (error) throw error;

            // Sync Driver Status
            if (formData.driver_id) {
                await (supabase
                    .from('drivers') as any)
                    .update({ status: 'Em Viagem' })
                    .eq('id', formData.driver_id);
            }

            if (error) throw error;
            onSave();
            onClose();
            // Reset form
            setFormData({
                date: new Date().toISOString().split('T')[0],
                product: 'SOJA',
                driver_id: '',
                destination: '',
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
                        Novo Frete
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
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                <Calendar size={14} /> Data
                            </label>
                            <input
                                type="date"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-500 focus:border-verde-500"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                <Package size={14} /> Produto
                            </label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-500"
                                value={formData.product}
                                onChange={e => setFormData({ ...formData, product: e.target.value })}
                            >
                                <option value="SOJA">Soja</option>
                                <option value="MILHO">Milho</option>
                                <option value="SORGO">Sorgo</option>
                            </select>
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
                                                            driver.status === 'Em Viagem' ? 'text-blue-600' : 'text-orange-600'
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
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <MapPin size={14} /> Destino
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Cidade / Armazém"
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
                                <label className="text-sm font-medium text-gray-700">Peso Carregamento (Kg)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="10"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-500"
                                    value={formData.weightLoaded || ''}
                                    onChange={e => setFormData({ ...formData, weightLoaded: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                    <DollarSign size={14} /> Valor Por Saca (Unitário)
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
                                    <p className="text-xs text-gray-500">Valor pago por cada saca de 60kg.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="bg-white p-3 rounded-lg border border-verde-200">
                            <span className="text-xs text-gray-500 uppercase font-semibold">Qtd. Sacas (60kg)</span>
                            <div className="text-xl font-bold text-gray-800">
                                {calculations.sacksAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <span className="text-[10px] text-gray-400">Peso / 60</span>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-verde-200">
                            <span className="text-xs text-gray-500 uppercase font-semibold">Valor Total Frete</span>
                            <div className="text-xl font-bold text-verde-700">
                                {calculations.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
            </div>
        </div>
    );
}
