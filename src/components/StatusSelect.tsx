import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, Clock, Truck, PackageCheck, CalendarClock } from 'lucide-react';
import type { FreightStatus } from '../types';

interface StatusSelectProps {
    currentStatus: FreightStatus;
    onChange: (status: FreightStatus) => void;
}

const statusConfig: Record<FreightStatus, { label: string; bg: string; text: string; icon: any }> = {
    'EM_TRANSITO': { label: 'Em Trânsito', bg: 'bg-amber-100', text: 'text-amber-800', icon: Truck },
    'DESCARREGADO': { label: 'Descarregado', bg: 'bg-blue-100', text: 'text-blue-800', icon: PackageCheck },
    'PAGO': { label: 'Pago', bg: 'bg-emerald-100', text: 'text-emerald-800', icon: Check },
    'ATRASADO': { label: 'Atrasado', bg: 'bg-rose-100', text: 'text-rose-800', icon: Clock },
    'AGENDADO': { label: 'Agendado', bg: 'bg-purple-100', text: 'text-purple-800', icon: CalendarClock },
};

export function StatusSelect({ currentStatus, onChange }: StatusSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0, align: 'left' as 'left' | 'right' });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const currentConfig = statusConfig[currentStatus] || statusConfig['EM_TRANSITO'];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                // Check if click is inside the portal content (which is not in buttonRef)
                // We'll rely on the portal backdrop or precise logic, but simply closing on window click works for now
                // if the dropdown is open. 
                // However, since portal is attached to body, we need a way to detect clicks inside it.
                // Simpler approach: Check if target is NOT closest to the dropdown class.
                const target = event.target as HTMLElement;
                if (!target.closest('.status-dropdown-portal')) {
                    setIsOpen(false);
                }
            }
        }

        if (isOpen) {
            // Calculate position
            if (buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                const viewportWidth = window.innerWidth;

                // If the button is on the right half of the screen, align dropdown directly to its right edge
                const isRightSide = rect.left > (viewportWidth / 2);

                if (isRightSide) {
                    setPosition({
                        top: rect.bottom + window.scrollY + 8,
                        left: rect.right + window.scrollX, // Reference point is the right edge of button
                        align: 'right'
                    });
                } else {
                    setPosition({
                        top: rect.bottom + window.scrollY + 8,
                        left: rect.left + window.scrollX,
                        align: 'left'
                    });
                }
            }
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center justify-center gap-2 w-[140px] px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm
                    ${currentConfig.bg} ${currentConfig.text}
                    hover:opacity-90 transition-all border border-black/5
                `}
            >
                <span>{currentConfig.label.toUpperCase()}</span>
            </button>

            {isOpen && createPortal(
                <div
                    className="status-dropdown-portal absolute z-[9999] min-w-[180px] rounded-xl bg-white shadow-xl ring-1 ring-black ring-opacity-5 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                    style={{
                        top: position.top,
                        left: position.left,
                        transform: position.align === 'right' ? 'translateX(-100%)' : 'none'
                    }}
                >
                    <div className="p-1">
                        {Object.entries(statusConfig).map(([status, config]) => {
                            const Icon = config.icon;
                            return (
                                <button
                                    key={status}
                                    onClick={() => {
                                        onChange(status as FreightStatus);
                                        setIsOpen(false);
                                    }}
                                    className={`
                                        group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm
                                        ${currentStatus === status ? 'bg-gray-50 text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-50'}
                                        transition-colors
                                    `}
                                >
                                    <div className={`p-1.5 rounded-md ${config.bg} ${config.text}`}>
                                        <Icon size={14} />
                                    </div>
                                    <span>{config.label}</span>
                                    {currentStatus === status && (
                                        <Check size={14} className="ml-auto text-verde-600" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
