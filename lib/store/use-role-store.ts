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
      try {
        localStorage.setItem('last_accessed_role_id', String(roleId));
      } catch {
        // Ignore localStorage quota errors
      }
    }
  },
  resetRole: () => {
    set({ activeRoleId: null });
    if (typeof window !== 'undefined') {
      document.cookie = 'active_role_id=; path=/; max-age=0; SameSite=Lax';
      try {
        localStorage.removeItem('last_accessed_role_id');
      } catch {
        // Ignore errors
      }
    }
  },
  initialize: (defaultRoleId, allowedRoles) => {
    set(() => {

      let candidateRoleId: number | null = null;

      // 1. Try to read from cookie
      if (typeof window !== 'undefined') {
        const match = document.cookie.match(/(?:^|; )active_role_id=([^;]*)/);
        if (match) {
          const cookieRoleId = parseInt(match[1], 10);
          if (!isNaN(cookieRoleId) && allowedRoles.includes(cookieRoleId)) {
            candidateRoleId = cookieRoleId;
          }
        }

        // 2. Try to read from localStorage if cookie not found
        if (!candidateRoleId) {
          const localRole = localStorage.getItem('last_accessed_role_id');
          if (localRole) {
            const parsedLocal = parseInt(localRole, 10);
            if (!isNaN(parsedLocal) && allowedRoles.includes(parsedLocal)) {
              candidateRoleId = parsedLocal;
            }
          }
        }
      }

      if (candidateRoleId !== null) {
        return { activeRoleId: candidateRoleId };
      }

      // 3. Fallback ke role utama pengguna (defaultRoleId) atau role terdaftar pertama
      if (allowedRoles.length > 0) {
        const fallback = allowedRoles.includes(defaultRoleId) ? defaultRoleId : allowedRoles[0];
        return { activeRoleId: fallback };
      }

      // 4. Idle State (tidak ada role aktif)
      return { activeRoleId: null };
    });
  },
}));




