import Dexie, { type Table } from 'dexie';
import { Category, TimeSlot } from '../types';

export class WiseTimeDatabase extends Dexie {
    categories!: Table<Category>;
    timeSlots!: Table<TimeSlot>;

    constructor() {
        super('WiseTimeDB');

        // We update to version 4 to ensure a clean state.
        // We REMOVE the unique constraint '&name' temporarily to allow the DB to open 
        // even if duplicates exist, so we can clean them in initializeDb.
        this.version(4).stores({
            categories: '++id, name',
            timeSlots: '++id, date, categoryId'
        });
    }
}

export const db = new WiseTimeDatabase();

// Initial categories
export const defaultCategories = [
    { name: 'Trabajo', color: '#10b981', icon: 'Briefcase' },
    { name: 'Personal', color: '#0ea5e9', icon: 'User' },
    { name: 'Sueño', color: '#6366f1', icon: 'Moon' },
    { name: 'Ejercicio', color: '#f43f5e', icon: 'Dumbbell' },
    { name: 'Aprendizaje', color: '#f59e0b', icon: 'BookOpen' }
];

export async function initializeDb() {
    try {
        // Ensure DB is open
        if (!db.isOpen()) await db.open();

        const existingCategories = await db.categories.toArray();

        if (existingCategories.length === 0) {
            await db.categories.bulkAdd(defaultCategories);
            console.log('Default categories added');
            return;
        }

        // Translation Map
        const translationMap: Record<string, string> = {
            'Work': 'Trabajo',
            'Personal': 'Personal',
            'Sleep': 'Sueño',
            'Exercise': 'Ejercicio',
            'Learning': 'Aprendizaje'
        };

        const nameToId: Record<string, number> = {};

        for (const cat of existingCategories) {
            const translatedName = translationMap[cat.name] || cat.name;
            const lookupKey = translatedName.toLowerCase().trim();

            if (nameToId[lookupKey]) {
                const targetId = nameToId[lookupKey];
                // Move all slots from this duplicate to the target
                await db.timeSlots.where('categoryId').equals(cat.id!).modify({ categoryId: targetId });
                // Delete the duplicate category
                await db.categories.delete(cat.id!);
                console.log(`Merged: ${cat.name} -> ${translatedName}`);
            } else {
                // Update name if translated
                if (cat.name !== translatedName) {
                    await db.categories.update(cat.id!, { name: translatedName });
                }
                nameToId[lookupKey] = cat.id!;
            }
        }
    } catch (error) {
        console.error('Failed to initialize DB:', error);
    }
}
