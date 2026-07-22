import { create } from 'zustand';

interface RoleState {
  activeRoleId: number | null;
  setActiveRoleId: (roleId: number) => void;
  initialize: (defaultRoleId: number, allowedRoles: number[]) => void;
  resetRole: () => void;
}

export const useRoleStore = create<RoleState>((set) => ({
  activeRoleId: null,
  setActiveRoleId: (roleId) => {
    set({ activeRoleId: roleId });
    if (typeof window !== 'undefined') {
      document.cookie = `active_role_id=${roleId}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    }
  },
  resetRole: () => {
    set({ activeRoleId: null });
    if (typeof window !== 'undefined') {
      document.cookie = 'active_role_id=; path=/; max-age=0; SameSite=Lax';
    }
  },
  initialize: (defaultRoleId, allowedRoles) => {
    set((state) => {
      // If already initialized and still in allowed list, keep it
      if (state.activeRoleId !== null && allowedRoles.includes(state.activeRoleId)) {
        return state;
      }

      // Try to read from cookie
      if (typeof window !== 'undefined') {
        const match = document.cookie.match(/(?:^|; )active_role_id=([^;]*)/);
        if (match) {
          const cookieRoleId = parseInt(match[1], 10);
          if (!isNaN(cookieRoleId) && allowedRoles.includes(cookieRoleId)) {
            return { activeRoleId: cookieRoleId };
          }
        }
      }

      // Fallback to default role
      return { activeRoleId: defaultRoleId };
    });
  },
}));

