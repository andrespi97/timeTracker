export interface Category {
  id?: number;
  name: string;
  color: string;
  icon?: string;
}

export interface TimeSlot {
  id?: number;
  date: string; // ISO string YYYY-MM-DD
  startTime: number; // Minutes from midnight (0 - 1439)
  duration: number; // Duration in minutes
  categoryId: number;
  note?: string;
}
