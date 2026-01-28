import { Truck, Home, Wallet, Users, LayoutDashboard, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '../contexts/AuthContext';

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const { user, signOut } = useAuth();

    const navItems = [
        { label: 'Dashboard', icon: Home, to: '/' },
        { label: 'Fretes', icon: Truck, to: '/fretes' },
        { label: 'Motoristas', icon: Users, to: '/motoristas' },
        { label: 'Financeiro', icon: Wallet, to: '/financeiro' },
    ];

    return (
        <aside className={clsx(
            "h-screen bg-verde-900 text-white flex flex-col transition-all duration-300 relative z-50",
            collapsed ? "w-20" : "w-64"
        )}>
            <div className={clsx("p-4 flex items-center border-b border-verde-800 transition-all", collapsed ? "justify-center" : "justify-between")}>
                <div className={clsx("flex items-center gap-2", collapsed && "hidden")}>
                    <div className="p-2 bg-verde-500 rounded-lg">
                        <LayoutDashboard size={24} className="text-white" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">AgroLog</span>
                </div>

                {collapsed && (
                    <div className="p-2 bg-verde-500 rounded-lg">
                        <LayoutDashboard size={24} className="text-white" />
                    </div>
                )}

                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className={clsx("p-1 hover:bg-verde-800 rounded-md transition-colors", collapsed && "absolute -right-3 top-6 bg-verde-700 shadow-md border border-verde-600 rounded-full")}
                >
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            <nav className="flex-1 py-6 px-3 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => clsx(
                            "flex items-center gap-3 px-3 py-3 rounded-xl transition-colors group",
                            isActive
                                ? "bg-verde-500 text-white shadow-lg shadow-verde-900/20"
                                : "text-verde-100 hover:bg-verde-800 hover:text-white"
                        )}
                    >
                        <item.icon size={22} strokeWidth={2} />
                        {!collapsed && <span className="font-medium">{item.label}</span>}
                        {collapsed && <span className="absolute left-full ml-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            {!collapsed && (
                <div className="p-4 border-t border-verde-800 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-verde-700 flex items-center justify-center text-white font-bold uppercase">
                            {user?.email?.[0] || 'U'}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{user?.email || 'Usuário'}</p>
                            <p className="text-xs text-verde-300">Online</p>
                        </div>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-verde-200 hover:bg-verde-800 hover:text-white rounded-lg transition-colors"
                    >
                        <LogOut size={18} />
                        Sair
                    </button>
                </div>
            )}
        </aside>
    );
}
