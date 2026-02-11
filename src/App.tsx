import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, BarChart3, Clock as ClockIcon, Download, Upload } from 'lucide-react';
import { db, initializeDb } from './db/database';
import { Layout } from './components/Layout';
import { CategorySidebar } from './components/CategorySidebar';
import { TimeGrid } from './components/TimeGrid';
import { Summary } from './components/Summary';
import { Category } from './types';

function App() {
    const [view, setView] = useState<'tracker' | 'summary'>('tracker');
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const dateStr = format(currentDate, 'yyyy-MM-dd');

    const goToPreviousDay = () => {
        const prev = new Date(currentDate);
        prev.setDate(prev.getDate() - 1);
        setCurrentDate(prev);
    };

    const goToNextDay = () => {
        const next = new Date(currentDate);
        next.setDate(next.getDate() + 1);
        setCurrentDate(next);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Live Queries for automatic UI updates when DB changes
    const categories = useLiveQuery(() => db.categories.toArray()) || [];
    const timeSlots = useLiveQuery(
        () => db.timeSlots.where('date').equals(dateStr).toArray(),
        [dateStr]
    ) || [];
    const allTimeSlots = useLiveQuery(() => db.timeSlots.toArray()) || [];

    useEffect(() => {
        initializeDb();
    }, []);

    // Set initial selected category once loaded
    useEffect(() => {
        if (categories.length > 0 && selectedCategoryId === null) {
            setSelectedCategoryId(categories[0].id!);
        }
    }, [categories, selectedCategoryId]);

    const handleAddCategory = async (name: string, color: string) => {
        const id = await db.categories.add({ name, color });
        setSelectedCategoryId(id as number);
    };

    const handleUpdateCategory = async (id: number, name: string, color: string) => {
        // Check for duplicates (excluding self)
        const exists = categories.some((c: Category) => c.name.toLowerCase() === name.toLowerCase() && c.id !== id);
        if (exists) {
            alert('Ya existe otra categoría con ese nombre');
            return;
        }
        await db.categories.update(id, { name, color });
    };

    const handleDeleteCategory = async (id: number, replacementId?: number) => {
        if (replacementId) {
            // Migrate all time slots to the replacement category
            await db.timeSlots.where('categoryId').equals(id).modify({ categoryId: replacementId });
        }

        // Delete the category
        await db.categories.delete(id);

        if (selectedCategoryId === id) {
            const remaining = categories.filter((c: Category) => c.id !== id);
            setSelectedCategoryId(remaining.length > 0 ? (remaining[0].id as number) : (replacementId || null));
        }
    };

    const handleSlotClick = async (hour: number, minute: number, isDrag: boolean = false) => {
        if (selectedCategoryId === null) return;

        const startTime = hour * 60 + minute;
        const duration = 15;

        // Check if there's exactly this 15m slot already
        const existingSlot = await db.timeSlots.where({ date: dateStr, startTime, duration }).first();

        if (existingSlot) {
            // If dragging, we only overwrite if it's a DIFFERENT category. 
            // If it's the SAME category, we do nothing during drag (prevents flickering).
            // If it's NOT a drag, we do the usual toggle.
            if (existingSlot.categoryId === selectedCategoryId) {
                if (!isDrag) {
                    await db.timeSlots.delete(existingSlot.id!);
                }
            } else {
                await db.timeSlots.update(existingSlot.id!, { categoryId: selectedCategoryId });
            }
        } else {
            // Add the new slot
            await db.timeSlots.add({
                date: dateStr,
                startTime,
                duration,
                categoryId: selectedCategoryId
            });
        }
    };

    const handleHourClick = async (hour: number) => {
        if (selectedCategoryId === null) return;

        // Fill all 4 segments of the hour
        for (let m = 0; m < 60; m += 15) {
            const startTime = hour * 60 + m;
            const duration = 15;

            // Delete any existing slot at this exact 15m segment
            await db.timeSlots.where({ date: dateStr, startTime, duration }).delete();

            // Add the new slot
            await db.timeSlots.add({
                date: dateStr,
                startTime,
                duration,
                categoryId: selectedCategoryId
            });
        }
    };

    const exportData = async () => {
        const cats = await db.categories.toArray();
        const slots = await db.timeSlots.toArray();
        const data = JSON.stringify({ categories: cats, timeSlots: slots }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `wisetime-backup-${dateStr}.json`;
        link.click();
    };

    const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const { categories: importedCats, timeSlots: importedSlots } = JSON.parse(event.target?.result as string);
                await db.categories.clear();
                await db.timeSlots.clear();
                await db.categories.bulkAdd(importedCats);
                await db.timeSlots.bulkAdd(importedSlots);
                alert('Datos importados con éxito');
            } catch (err) {
                alert('Error al importar datos');
            }
        };
        reader.readAsText(file);
    };

    return (
        <Layout>
            <div className="flex flex-col md:flex-row gap-8 text-slate-100">
                <div className="flex flex-col gap-6">
                    {/* Main Navigation */}
                    <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5 w-full md:w-80">
                        <button
                            onClick={() => setView('tracker')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'tracker' ? 'bg-primary text-black' : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <ClockIcon size={18} />
                            Tracker
                        </button>
                        <button
                            onClick={() => setView('summary')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'summary' ? 'bg-primary text-black' : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <BarChart3 size={18} />
                            Resumen
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={exportData}
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 text-slate-400 hover:text-white border border-white/5 text-xs transition-all"
                        >
                            <Download size={14} />
                            Exportar
                        </button>
                        <label className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 text-slate-400 hover:text-white border border-white/5 text-xs cursor-pointer transition-all">
                            <Upload size={14} />
                            Importar
                            <input type="file" onChange={importData} className="hidden" accept=".json" />
                        </label>
                    </div>

                    {view === 'tracker' && (
                        <CategorySidebar
                            categories={categories}
                            selectedCategoryId={selectedCategoryId}
                            onSelectCategory={setSelectedCategoryId}
                            onAddCategory={handleAddCategory}
                            onUpdateCategory={handleUpdateCategory}
                            onDeleteCategory={handleDeleteCategory}
                        />
                    )}
                </div>

                <div className="flex-1">
                    {view === 'tracker' ? (
                        <>
                            <div className="flex items-center gap-4 mb-8 bg-white/5 p-3 rounded-2xl border border-white/5 w-fit">
                                <button
                                    onClick={goToPreviousDay}
                                    className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all transition-colors"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={goToToday}
                                    className="px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-sm font-bold transition-all"
                                >
                                    Ir a hoy
                                </button>
                                <button
                                    onClick={goToNextDay}
                                    className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all transition-colors"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>

                            <TimeGrid
                                currentDate={currentDate}
                                categories={categories}
                                timeSlots={timeSlots}
                                selectedCategoryId={selectedCategoryId}
                                onSlotClick={handleSlotClick}
                                onHourClick={handleHourClick}
                            />
                        </>
                    ) : (
                        <Summary categories={categories} timeSlots={allTimeSlots} />
                    )}
                </div>
            </div>
        </Layout>
    );
}

export default App;
