import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DatePickerProps {
    value?: string | Date; // ISO string (YYYY-MM-DD) or Date object
    onChange: (date: string) => void; // Returns ISO string YYYY-MM-DD
    label?: string;
    required?: boolean;
}

export function DatePicker({ value, onChange, label = "Data" }: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    // Helper to parse YYYY-MM-DD as local date (00:00:00)
    const parseLocalDate = (dateStr: string) => {
        if (!dateStr) return new Date();
        // Check if it's already a full ISO string or just date
        if (dateStr.includes('T')) return new Date(dateStr);

        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    const [selectedDate, setSelectedDate] = useState<Date>(
        value ? parseLocalDate(typeof value === 'string' ? value : (value instanceof Date ? value.toISOString() : '')) : new Date()
    );
    // Current viewed month
    const [currentMonth, setCurrentMonth] = useState<Date>(
        value ? parseLocalDate(typeof value === 'string' ? value : (value instanceof Date ? value.toISOString() : '')) : new Date()
    );

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value) {
            const dateStr = typeof value === 'string' ? value : (value instanceof Date ? value.toISOString() : '');
            if (!dateStr) return; // Should handle if value is invalid object

            const date = parseLocalDate(dateStr);
            setSelectedDate(date);
            // Optionally update current month if the selected date is far
            if (!isSameMonth(date, currentMonth)) {
                setCurrentMonth(date);
            }
        }
    }, [value]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const handleDateClick = (day: Date) => {
        const isoDate = format(day, 'yyyy-MM-dd');
        onChange(isoDate);
        setSelectedDate(day);
        setIsOpen(false);
    };

    // Calendar generation
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

    return (
        <div className="relative" ref={containerRef}>
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-1">
                <CalendarIcon size={14} /> {label}
            </label>

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full px-3 py-2 border rounded-lg flex items-center justify-between
                    bg-white text-left transition-all
                    ${isOpen ? 'ring-2 ring-verde-500 border-verde-500' : 'border-gray-300 hover:border-verde-300'}
                `}
            >
                <span className="text-gray-800">
                    {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
                <CalendarIcon size={18} className="text-gray-400" />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-2 p-4 w-[280px] bg-white rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 left-0">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold text-gray-800 capitalize">
                            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                        </span>
                        <div className="flex items-center gap-1">
                            <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-600">
                                <ChevronLeft size={18} />
                            </button>
                            <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-600">
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Week Days */}
                    <div className="grid grid-cols-7 mb-2">
                        {weekDays.map((day, idx) => (
                            <div key={idx} className="text-center text-xs font-semibold text-gray-400">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days */}
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleDateClick(day)}
                                className={`
                                    w-8 h-8 rounded-full text-sm flex items-center justify-center transition-colors
                                    ${!isSameMonth(day, monthStart) ? 'text-gray-300' : 'text-gray-700'}
                                    ${isSameDay(day, selectedDate) ? 'bg-verde-600 text-white font-bold hover:bg-verde-700 shadow-md' : 'hover:bg-verde-50'}
                                    ${isToday(day) && !isSameDay(day, selectedDate) ? 'text-verde-600 font-bold border border-verde-200' : ''}
                                `}
                            >
                                {format(day, 'd')}
                            </button>
                        ))}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
                        <button
                            onClick={() => {
                                handleDateClick(new Date());
                                setCurrentMonth(new Date());
                            }}
                            className="text-xs font-medium text-verde-600 hover:text-verde-700"
                        >
                            Hoje
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
