import { Plus, Trash2, Pencil, X } from 'lucide-react';
import React, { useState } from 'react';
import { Category } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface CategorySidebarProps {
    categories: Category[];
    selectedCategoryId: number | null;
    onSelectCategory: (id: number) => void;
    onAddCategory: (name: string, color: string) => void;
    onUpdateCategory: (id: number, name: string, color: string) => void;
    onDeleteCategory: (id: number, replacementId?: number) => void;
}

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
    categories,
    selectedCategoryId,
    onSelectCategory,
    onAddCategory,
    onUpdateCategory,
    onDeleteCategory,
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6');

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');

    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [replacementId, setReplacementId] = useState<number | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const name = newCategoryName.trim();
        if (name) {
            const exists = categories.some(c => c.name.toLowerCase() === name.toLowerCase());
            if (exists) {
                alert('Esta categoría ya existe');
                return;
            }
            onAddCategory(name, newCategoryColor);
            setNewCategoryName('');
            setIsAdding(false);
        }
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId && editName.trim()) {
            onUpdateCategory(editingId, editName.trim(), editColor);
            setEditingId(null);
        }
    };

    const confirmDelete = () => {
        if (deletingId) {
            onDeleteCategory(deletingId, replacementId || undefined);
            setDeletingId(null);
            setReplacementId(null);
        }
    };

    return (
        <div className="w-full md:w-80 glass-card p-6 flex flex-col gap-6 md:h-[calc(100vh-2rem)] md:sticky md:top-4 md:rounded-2xl">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    Categorías
                </h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="p-2 rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                >
                    {isAdding ? <X size={20} /> : <Plus size={20} />}
                </button>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-3 p-4 rounded-xl bg-white/5 border border-white/10"
                    >
                        <input
                            type="text"
                            placeholder="Nueva categoría..."
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            autoFocus
                        />
                        <div className="flex gap-2 items-center">
                            <input
                                type="color"
                                value={newCategoryColor}
                                onChange={(e) => setNewCategoryColor(e.target.value)}
                                className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer"
                            />
                            <button
                                type="submit"
                                className="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                Añadir
                            </button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            <div className="flex flex-col gap-2 overflow-y-auto pr-1">
                {categories.map((category) => (
                    <motion.div
                        layout
                        key={category.id}
                        className={`group p-3 rounded-xl transition-all cursor-pointer ${selectedCategoryId === category.id
                                ? 'bg-white/10 ring-1 ring-white/20 shadow-lg'
                                : 'hover:bg-white/5'
                            }`}
                        onClick={() => category.id && onSelectCategory(category.id)}
                    >
                        {editingId === category.id ? (
                            <form
                                onSubmit={handleEditSubmit}
                                className="flex flex-col gap-2"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="bg-slate-900/50 border border-white/10 rounded-lg px-2 py-1 text-sm focus:outline-none"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={editColor}
                                        onChange={(e) => setEditColor(e.target.value)}
                                        className="w-8 h-8 rounded-lg bg-transparent border-none cursor-pointer"
                                    />
                                    <button
                                        type="submit"
                                        className="flex-1 bg-primary text-black text-xs font-bold rounded-lg py-1"
                                    >
                                        Guardar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditingId(null)}
                                        className="flex-1 text-slate-400 text-xs py-1"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-4 h-4 rounded-full shadow-inner"
                                        style={{ backgroundColor: category.color }}
                                    />
                                    <span className="font-medium text-slate-200">{category.name}</span>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingId(category.id!);
                                            setEditName(category.name);
                                            setEditColor(category.color);
                                        }}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeletingId(category.id!);
                                        }}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {deletingId && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="p-4 rounded-xl bg-slate-900 border border-red-500/20 shadow-2xl flex flex-col gap-4 mt-auto"
                    >
                        <h3 className="text-sm font-bold text-red-400">Eliminar Categoría</h3>
                        <p className="text-xs text-slate-400">
                            ¿A qué categoría quieres mover los registros existentes?
                        </p>

                        <select
                            className="bg-slate-800 border border-white/10 rounded-lg px-2 py-2 text-xs text-slate-200 focus:outline-none"
                            value={replacementId || ''}
                            onChange={(e) => setReplacementId(Number(e.target.value))}
                        >
                            <option value="">Eliminar registros (no recomendado)</option>
                            {categories
                                .filter((c) => c.id !== deletingId)
                                .map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                        </select>

                        <div className="flex gap-2">
                            <button
                                onClick={confirmDelete}
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                            >
                                Confirmar
                            </button>
                            <button
                                onClick={() => setDeletingId(null)}
                                className="flex-1 bg-white/5 hover:bg-white/10 text-slate-400 text-xs py-2 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
