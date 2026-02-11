import React from 'react';
import { Category, TimeSlot } from '../types';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TimeGridProps {
    currentDate: Date;
    categories: Category[];
    timeSlots: TimeSlot[];
    selectedCategoryId: number | null;
    onSlotClick: (hour: number, minute: number, isDrag?: boolean) => void;
    onHourClick: (hour: number) => void;
}

export const TimeGrid: React.FC<TimeGridProps> = ({
    currentDate,
    categories,
    timeSlots,
    selectedCategoryId,
    onSlotClick,
    onHourClick,
}) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    React.useEffect(() => {
        const handleGlobalMouseUp = () => setIsDragging(false);
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, []);

    const getSlotForHour = (hour: number) => {
        const hourStart = hour * 60;
        const hourEnd = hourStart + 60;

        return timeSlots.filter((s) => {
            const slotEnd = s.startTime + s.duration;
            return s.startTime < hourEnd && slotEnd > hourStart;
        });
    };

    const getDayLabel = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const target = new Date(currentDate);
        target.setHours(0, 0, 0, 0);

        if (target.getTime() === today.getTime()) return 'Hoy';
        if (target.getTime() === tomorrow.getTime()) return 'Mañana';
        return format(currentDate, "EEEE, d 'de' MMMM", { locale: es });
    };

    return (
        <div className="flex flex-col gap-6 select-none">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-primary uppercase tracking-widest">{getDayLabel()}</span>
                    <h1 className="text-3xl font-bold text-white tracking-tight first-letter:uppercase">
                        {format(currentDate, "d 'de' MMMM", { locale: es })}
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {hours.map((hour) => {
                    const slots = getSlotForHour(hour);
                    const segments = [0, 15, 30, 45].map((m) => {
                        const startTime = hour * 60 + m;
                        return slots.find((s) => s.startTime <= startTime && (s.startTime + s.duration) > startTime);
                    });

                    return (
                        <motion.div
                            key={hour}
                            className="relative h-28 rounded-2xl glass-card border border-white/5 flex flex-col group overflow-hidden cursor-pointer"
                            whileHover={{ scale: 1.01 }}
                            onClick={() => !isDragging && onHourClick(hour)}
                        >
                            <div className="p-3 pb-1 flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400">
                                    {hour.toString().padStart(2, '0')}:00
                                </span>
                                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">
                                    1 hora / click
                                </span>
                            </div>

                            <div className="flex-1 px-3 pb-3 flex gap-1.5">
                                {[0, 1, 2, 3].map((i) => {
                                    const minute = i * 15;
                                    const slot = segments[i];
                                    const category = slot ? categories.find((c) => c.id === slot.categoryId) : null;

                                    return (
                                        <motion.button
                                            key={i}
                                            whileHover={{ scale: 1.05, y: -2 }}
                                            whileTap={{ scale: 0.95 }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                setIsDragging(true);
                                                onSlotClick(hour, minute);
                                            }}
                                            onMouseEnter={(e) => {
                                                if (isDragging) {
                                                    onSlotClick(hour, minute, true);
                                                }
                                            }}
                                            className="flex-1 rounded-lg relative overflow-hidden transition-all border border-white/5 hover:border-white/10"
                                            style={{
                                                backgroundColor: category ? `${category.color}40` : 'rgba(255,255,255,0.02)',
                                                boxShadow: category ? `0 0 10px ${category.color}20` : 'none',
                                            }}
                                            title={`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`}
                                        >
                                            {category && (
                                                <div
                                                    className="absolute inset-x-0 bottom-0 h-1"
                                                    style={{ backgroundColor: category.color }}
                                                />
                                            )}

                                            {/* Active category indicator */}
                                            {category && (
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: category.color }} />
                                                </div>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};
