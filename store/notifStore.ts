import { create } from 'zustand'

interface NotifState {
  unreadCount: number
  increment: () => void
  reset: () => void
}

export const useNotifStore = create<NotifState>((set) => ({
  unreadCount: 0,
  increment: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  reset: () => set({ unreadCount: 0 }),
}))
