import { create } from 'zustand';

export const useUiStore = create<{ toast: { text: string; id: number } | null; notify: (text: string) => void; dismiss: () => void }>(set => ({
  toast: null,
  notify: text => set({ toast: { text, id: Date.now() } }),
  dismiss: () => set({ toast: null }),
}));
