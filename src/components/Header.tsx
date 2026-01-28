import { Bell, Search } from 'lucide-react';

export function Header() {
    return (
        <header className="h-16 bg-white border-b border-gray-100 px-8 flex items-center justify-between shadow-sm sticky top-0 z-10">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold text-gray-800">Visão Geral</h1>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde-500/20 focus:border-verde-500 transition-all text-sm w-64"
                    />
                </div>

                <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                </button>
            </div>
        </header>
    );
}
