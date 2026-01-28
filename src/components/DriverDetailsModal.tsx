import { X, Phone, Calendar, Truck, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useState } from 'react';
import { ConfirmationModal } from './ConfirmationModal';
import type { Database } from '../types/supabase';

type Driver = Database['public']['Tables']['drivers']['Row'];

interface DriverDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    driver: Driver | null;
}

export function DriverDetailsModal({ isOpen, onClose, driver }: DriverDetailsModalProps) {
    const [ratingModal, setRatingModal] = useState({
        isOpen: false,
        newRating: 0
    });

    if (!isOpen || !driver) return null;

    const handleRatingChange = async () => {
        try {
            const { error } = await (supabase
                .from('drivers') as any)
                .update({ rating: ratingModal.newRating })
                .eq('id', driver.id);

            if (error) throw error;

            setRatingModal({ isOpen: false, newRating: 0 });
            onClose(); // Force close to refresh parent data
        } catch (error) {
            console.error('Error updating rating:', error);
            alert('Erro ao atualizar avaliação');
        }
    };

    const requestRatingChange = (newRating: number) => {
        setRatingModal({ isOpen: true, newRating });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <ConfirmationModal
                isOpen={ratingModal.isOpen}
                onClose={() => setRatingModal({ ...ratingModal, isOpen: false })}
                onConfirm={handleRatingChange}
                title="Avaliar Motorista"
                message={`Deseja alterar a avaliação deste motorista para ${ratingModal.newRating} estrelas?`}
                confirmText="Confirmar"
                variant="info"
            />

            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-verde-900 to-verde-800 px-6 py-6 flex items-start justify-between text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-16 bg-white/5 rounded-full -mr-8 -mt-8"></div>

                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-3xl font-bold backdrop-blur-md">
                            {driver.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{driver.name}</h2>
                            <p className="text-verde-200 text-sm flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${driver.status === 'Disponível' ? 'bg-green-400' :
                                    driver.status === 'Em Viagem' ? 'bg-blue-400' : 'bg-red-400'
                                    }`}></span>
                                {driver.status || 'Sem Status'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors relative z-10"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto">

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium flex items-center gap-1.5 mb-1">
                                <Truck size={12} /> Placa do Veículo
                            </span>
                            <p className="font-mono font-bold text-gray-800 text-lg">
                                {driver.license_plate || '---'}
                            </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium flex items-center gap-1.5 mb-1">
                                <Phone size={12} /> Telefone
                            </span>
                            <p className="font-semibold text-gray-800">
                                {driver.phone || 'Não informado'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Informações Adicionais</h3>

                        <div className="flex items-center gap-3 text-gray-600">
                            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                                <Calendar size={16} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Data de Cadastro</p>
                                <p className="text-sm font-medium">
                                    {driver.created_at ? new Date(driver.created_at).toLocaleDateString('pt-BR', {
                                        day: '2-digit', month: 'long', year: 'numeric'
                                    }) : 'N/A'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-gray-600">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                <CheckCircle size={16} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Status Atual</p>
                                <p className="text-sm font-medium">{driver.status}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-gray-600 pt-2 border-t border-gray-100">
                            <div className="w-full">
                                <p className="text-sm font-bold text-gray-800 mb-2">Avaliação do Motorista</p>
                                <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => requestRatingChange(star)}
                                            className={`p-1 hover:scale-110 transition-transform ${(driver.rating || 5) >= star ? 'text-yellow-400' : 'text-gray-200'
                                                }`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                        </button>
                                    ))}
                                    <span className="text-sm font-bold text-gray-600 ml-2">{driver.rating?.toFixed(1) || '5.0'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-2">
                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors"
                        >
                            Fechar Detalhes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
