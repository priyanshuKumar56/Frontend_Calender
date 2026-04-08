import { create } from 'zustand';
import {
  addMonths, subMonths, isSameDay, isWithinInterval,
  isBefore, format, isToday as checkIsToday
} from 'date-fns';

/* ── localStorage helpers ── */
const STORAGE_KEY = 'wall-calendar-notes-v1';

const loadNotes = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const persistNotes = (notes) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    console.warn('Failed to persist notes:', e);
  }
};

/* ── Store ── */
export const useCalendarStore = create((set, get) => ({
  // ─── Current View ───
  currentDate: new Date(),
  flipDirection: 0, // 1 = forward, -1 = backward

  // ─── Range Selection ───
  selectedRange: { start: null, end: null },
  hoverDate: null,
  isDragging: false,

  // ─── Undo History ───
  selectionHistory: [],

  // ─── Notes (key → text) ───
  notes: loadNotes(),

  // ─── Dynamic Theme ───
  themeColors: null,

  // ─── Navigation ───
  navigateMonth: (direction) =>
    set((state) => ({
      currentDate:
        direction > 0
          ? addMonths(state.currentDate, 1)
          : subMonths(state.currentDate, 1),
      flipDirection: direction,
      hoverDate: null,
    })),

  goToToday: () =>
    set({ currentDate: new Date(), flipDirection: 0, hoverDate: null }),

  // ─── Drag-based Selection ───
  startDragSelection: (date) =>
    set((state) => ({
      isDragging: true,
      selectionHistory: [
        ...state.selectionHistory,
        { ...state.selectedRange },
      ],
      selectedRange: { start: date, end: null },
      hoverDate: null,
    })),

  updateDragSelection: (date) =>
    set((state) => {
      if (!state.isDragging || !state.selectedRange.start) return {};
      const anchor = state.selectedRange.start;
      if (isSameDay(date, anchor)) return { selectedRange: { start: anchor, end: null } };
      return {
        selectedRange: isBefore(date, anchor)
          ? { start: date, end: anchor }
          : { start: anchor, end: date },
      };
    }),

  endDragSelection: () => set({ isDragging: false }),

  // ─── Click-based Selection ───
  selectDate: (date) =>
    set((state) => {
      const { start, end } = state.selectedRange;

      // No start yet, or full range already → start fresh
      if (!start || (start && end)) {
        return {
          selectionHistory: [
            ...state.selectionHistory,
            { ...state.selectedRange },
          ],
          selectedRange: { start: date, end: null },
        };
      }

      // Have start, no end → set end
      const range = isBefore(date, start)
        ? { start: date, end: start }
        : { start, end: date };

      return { selectedRange: range };
    }),

  setHoverDate: (date) => set({ hoverDate: date }),

  clearSelection: () =>
    set((state) => ({
      selectionHistory: [
        ...state.selectionHistory,
        { ...state.selectedRange },
      ],
      selectedRange: { start: null, end: null },
      hoverDate: null,
    })),

  undoSelection: () =>
    set((state) => {
      if (state.selectionHistory.length === 0) return {};
      const history = [...state.selectionHistory];
      const previous = history.pop();
      return { selectedRange: previous, selectionHistory: history };
    }),

  // ─── Notes CRUD ───
  addNote: (key, text) =>
    set((state) => {
      const notes = { ...state.notes, [key]: text };
      persistNotes(notes);
      return { notes };
    }),

  deleteNote: (key) =>
    set((state) => {
      const notes = { ...state.notes };
      delete notes[key];
      persistNotes(notes);
      return { notes };
    }),

  // ─── Theme ───
  setThemeColors: (colors) => set({ themeColors: colors }),

  // ─── Computed Helpers ───
  getSelectionState: (date) => {
    const { selectedRange, hoverDate } = get();
    const { start, end } = selectedRange;

    if (!start) return 'none';
    if (isSameDay(date, start)) return 'start';

    if (end) {
      if (isSameDay(date, end)) return 'end';
      try {
        if (isWithinInterval(date, { start, end })) return 'in-range';
      } catch {
        return 'none';
      }
    }

    // Preview when hovering with only start selected
    if (!end && hoverDate && !isSameDay(hoverDate, start)) {
      const pStart = isBefore(hoverDate, start) ? hoverDate : start;
      const pEnd = isBefore(hoverDate, start) ? start : hoverDate;
      if (isSameDay(date, hoverDate)) return 'preview-end';
      try {
        if (isWithinInterval(date, { start: pStart, end: pEnd }))
          return 'preview-range';
      } catch {
        return 'none';
      }
    }

    return 'none';
  },

  getRangeKey: () => {
    const { start, end } = get().selectedRange;
    if (!start) return null;
    const s = format(start, 'yyyy-MM-dd');
    return end ? `${s}_to_${format(end, 'yyyy-MM-dd')}` : s;
  },

  getRangeLabel: () => {
    const { start, end } = get().selectedRange;
    if (!start) return null;
    const s = format(start, 'MMM d, yyyy');
    return end ? `${s} → ${format(end, 'MMM d, yyyy')}` : s;
  },

  isToday: (date) => checkIsToday(date),
}));
