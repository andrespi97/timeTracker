import React, { useMemo } from 'react';
import { Category, TimeSlot } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Target, Calendar } from 'lucide-react';

interface SummaryProps {
    categories: Category[];
    timeSlots: TimeSlot[];
}

export const Summary: React.FC<SummaryProps> = ({ categories, timeSlots }) => {
    const data = useMemo(() => {
        const hCounts: Record<number, number> = {};
        timeSlots.forEach((slot) => {
            hCounts[slot.categoryId] = (hCounts[slot.categoryId] || 0) + (slot.duration / 60);
        });

        return categories
            .map((cat) => ({
                name: cat.name,
                value: Number((hCounts[cat.id!] || 0).toFixed(1)),
                color: cat.color,
            }))
            .filter((item) => item.value > 0);
    }, [categories, timeSlots]);

    const totalHours = Number(timeSlots.reduce((acc, s) => acc + (s.duration / 60), 0).toFixed(1));
    const topCategory = [...data].sort((a, b) => b.value - a.value)[0];

    const stats = [
        { label: 'Horas Totales', value: totalHours, icon: Clock, color: 'text-blue-400' },
        { label: 'Categoría Top', value: topCategory?.name || 'N/A', icon: TrendingUp, color: 'text-emerald-400' },
        { label: 'Eficiencia', value: totalHours > 0 ? `${Math.round((data.find(d => d.name === 'Trabajo')?.value || 0) / totalHours * 100)}%` : '0%', icon: Target, color: 'text-purple-400' },
        { label: 'Días Activos', value: new Set(timeSlots.map(s => s.date)).size, icon: Calendar, color: 'text-amber-400' },
    ];

    if (timeSlots.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 glass-card rounded-3xl text-center">
                <TrendingUp size={48} className="text-slate-700 mb-4" />
                <h3 className="text-xl font-bold text-slate-400">No hay datos suficientes</h3>
                <p className="text-slate-500 max-w-xs mt-2">Empieza a registrar tus horas para ver estadísticas detalladas aquí.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white tracking-tight">Análisis de Tiempo</h1>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="glass-card p-6 rounded-2xl border border-white/5 flex items-center gap-4"
                    >
                        <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-400">{stat.label}</p>
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pie Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-8 rounded-3xl border border-white/5 h-[400px] flex flex-col"
                >
                    <h3 className="text-lg font-bold text-slate-200 mb-6 font-display">Distribución por Categoría</h3>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    itemStyle={{ color: '#f1f5f9' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Bar Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-8 rounded-3xl border border-white/5 h-[400px] flex flex-col"
                >
                    <h3 className="text-lg font-bold text-slate-200 mb-6 font-display">Horas Acumuladas</h3>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* Advice Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5"
            >
                <h4 className="text-emerald-400 font-bold mb-2 flex items-center gap-2">
                    <Target size={18} />
                    Consejo para hoy
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                    {totalHours > 0
                        ? `Has dedicado el ${Math.round((data.find(d => d.name === 'Trabajo')?.value || 0) / totalHours * 100)}% de tu tiempo al Trabajo. Considera si estás equilibrando bien tus metas personales y el descanso para mantener un ritmo sostenible.`
                        : "Todavía no has registrado datos suficientes para generar recomendaciones. ¡Empieza a trackear tu tiempo!"
                    }
                </p>
            </motion.div>
        </div>
    );
};
