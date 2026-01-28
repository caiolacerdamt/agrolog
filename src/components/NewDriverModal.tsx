import { X, Save, Truck, User, Phone } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface NewDriverModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

export function NewDriverModal({ isOpen, onClose, onSave }: NewDriverModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        license_plate: '',
        phone: '',
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            // @ts-ignore
            const { error } = await supabase.from('drivers').insert({
                user_id: user.id,
                name: formData.name,
                license_plate: formData.license_plate.toUpperCase(),
                phone: formData.phone,
                status: 'Disponível'
            });

            if (error) throw error;
            onSave();
            onClose();
            setFormData({ name: '', license_plate: '', phone: '' });
        } catch (error) {
            console.error('Error saving driver:', error);
            alert('Erro ao salvar motorista');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                <div className="bg-verde-900 px-6 py-4 flex items-center justify-between text-white">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <User className="text-verde-400" />
                        Novo Motorista
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-verde-800 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <User size={14} /> Nome Completo
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-500"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <Truck size={14} /> Placa do Veículo
                        </label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg uppercase focus:ring-2 focus:ring-verde-500"
                            placeholder="ABC-1234"
                            value={formData.license_plate}
                            onChange={e => setFormData({ ...formData, license_plate: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <Phone size={14} /> Telefone
                        </label>
                        <input
                            type="tel"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-500"
                            placeholder="(00) 00000-0000"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

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
                            {loading ? 'Salvando...' : 'Salvar Motorista'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
