import { Search, Truck, Star, Plus, Trash, Pencil } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { NewDriverModal } from '../components/NewDriverModal';
import { DriverDetailsModal } from '../components/DriverDetailsModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { clsx } from 'clsx';
import type { Database } from '../types/supabase';

type Driver = Database['public']['Tables']['drivers']['Row'] & {
    trips?: number;
    rating?: number;
};

export function DriversPage() {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal States
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        driverId: null as string | null,
        driverName: ''
    });
    const [errorModal, setErrorModal] = useState({
        isOpen: false,
        message: ''
    });
    const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

    const handleEdit = (driver: Driver) => {
        setEditingDriver(driver);
        setIsModalOpen(true);
    };

    const fetchDrivers = async () => {
        try {
            // @ts-ignore
            const { data, error } = await supabase
                .from('drivers')
                .select('*, freights(count)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Map the result to include trip count and rating
            const driversWithStats = data?.map((d: any) => ({
                ...d,
                trips: d.freights?.[0]?.count || 0
            })) || [];

            setDrivers(driversWithStats);
        } catch (error) {
            console.error('Error fetching drivers:', error);
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = (id: string, name: string) => {
        setDeleteModal({ isOpen: true, driverId: id, driverName: name });
    };

    const handleDelete = async () => {
        if (!deleteModal.driverId) return;

        try {
            // @ts-ignore
            const { error } = await supabase.from('drivers').delete().eq('id', deleteModal.driverId);
            if (error) throw error;
            setDrivers(drivers.filter(d => d.id !== deleteModal.driverId));
            setDeleteModal({ isOpen: false, driverId: null, driverName: '' });
        } catch (error) {
            console.error('Error deleting driver:', error);
            // Close delete modal and open error modal
            setDeleteModal({ isOpen: false, driverId: null, driverName: '' });
            setErrorModal({
                isOpen: true,
                message: 'Não é possível excluir este motorista pois ele possui fretes vinculados. Exclua os fretes primeiro.'
            });
        }
    };

    useEffect(() => {
        fetchDrivers();
    }, []);

    const filteredDrivers = drivers.filter(driver =>
        driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.license_plate?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <NewDriverModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingDriver(null);
                }}
                onSave={fetchDrivers}
                driverToEdit={editingDriver}
            />

            <DriverDetailsModal
                isOpen={!!selectedDriver}
                onClose={() => { setSelectedDriver(null); fetchDrivers(); }}
                driver={selectedDriver}
            />

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={handleDelete}
                title="Excluir Motorista"
                message={`Tem certeza que deseja excluir o motorista ${deleteModal.driverName}? Todos os dados associados serão perdidos.`}
                confirmText="Excluir"
                variant="danger"
            />

            <ConfirmationModal
                isOpen={errorModal.isOpen}
                onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
                onConfirm={() => setErrorModal({ ...errorModal, isOpen: false })}
                title="Erro ao Excluir"
                message={errorModal.message}
                confirmText="Entendi"
                cancelText="Fechar"
                variant="warning"
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Motoristas</h1>
                    <p className="text-gray-500">Gerencie a frota e os motoristas parceiros.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-verde-600 text-white rounded-lg hover:bg-verde-700 transition-colors shadow-sm shadow-verde-200"
                >
                    <Plus size={20} />
                    <span>Novo Motorista</span>
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar motorista..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-500/20 focus:border-verde-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-500">Carregando motoristas...</div>
            ) : drivers.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                    <Truck className="mx-auto text-gray-300 mb-2" size={48} />
                    <p className="text-gray-500">Nenhum motorista cadastrado.</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="mt-2 text-verde-600 font-bold hover:underline"
                    >
                        Cadastre o primeiro
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDrivers.map((driver) => (
                        <div key={driver.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow relative group">
                            <div className="flex items-start justify-between">
                                <div className="flex max-w-[70%] items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-verde-100 text-verde-700 flex items-center justify-center font-bold text-lg uppercase flex-shrink-0">
                                        {driver.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-gray-800 truncate">{driver.name}</h3>
                                        {driver.license_plate && (
                                            <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full w-fit mt-1">
                                                <Truck size={12} />
                                                {driver.license_plate}
                                            </div>
                                        )}
                                        <div className={clsx(
                                            "mt-1 text-xs font-medium w-fit px-2 py-0.5 rounded",
                                            driver.status === 'Disponível' ? 'bg-green-100 text-green-700' :
                                                driver.status === 'Em Viagem' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-orange-100 text-orange-700'
                                        )}>
                                            {driver.status || 'Indefinido'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleEdit(driver)}
                                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Editar Motorista"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => confirmDelete(driver.id, driver.name)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Excluir Motorista"
                                    >
                                        <Trash size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 py-3 border-y border-gray-50 mt-2">
                                <div className="text-center">
                                    <span className="block text-2xl font-bold text-gray-800">{driver.trips || 0}</span>
                                    <span className="text-xs text-gray-400 uppercase">Viagens</span>
                                </div>
                                <div className="text-center border-l border-gray-50">
                                    <div className="flex items-center justify-center gap-1 text-yellow-500">
                                        <span className="text-2xl font-bold text-gray-800">{driver.rating?.toFixed(1) || '5.0'}</span>
                                        <Star size={16} fill="currentColor" />
                                    </div>
                                    <span className="text-xs text-gray-400 uppercase">Avaliação</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-end pt-2">
                                <button
                                    onClick={() => setSelectedDriver(driver)}
                                    className="text-verde-600 hover:text-verde-700 text-sm font-medium px-4 py-2 hover:bg-verde-50 rounded-lg transition-colors"
                                >
                                    Ver Perfil Completo
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
