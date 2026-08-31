import { create } from 'zustand';

interface RoleState {
  activeRoleId: number | null;
  setActiveRoleId: (roleId: number) => void;
  initialize: (defaultRoleId?: number | null, allowedRoles?: number[]) => void;
  resetRole: () => void;
}

const getInitialActiveRoleId = (): number | null => {
  if (typeof window !== 'undefined') {
    const match = document.cookie.match(/(?:^|; )active_role_id=([^;]*)/);
    if (match) {
      const cookieRoleId = parseInt(match[1], 10);
      if (!isNaN(cookieRoleId)) return cookieRoleId;
    }
    const localRole = localStorage.getItem('last_accessed_role_id');
    if (localRole) {
      const parsedLocal = parseInt(localRole, 10);
      if (!isNaN(parsedLocal)) return parsedLocal;
    }
  }
  return null;
};

export const useRoleStore = create<RoleState>((set) => ({
  activeRoleId: getInitialActiveRoleId(),
  setActiveRoleId: (roleId) => {
    set({ activeRoleId: roleId });
    if (typeof window !== 'undefined') {
      // Sinkronisasi cookie & localStorage ke backend untuk request selanjutnya
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
  initialize: (defaultRoleId, allowedRoles = []) => {
    let candidateRoleId: number | null = null;

    if (typeof window !== 'undefined') {
      const match = document.cookie.match(/(?:^|; )active_role_id=([^;]*)/);
      if (match) {
        const cookieRoleId = parseInt(match[1], 10);
        if (!isNaN(cookieRoleId) && allowedRoles.includes(cookieRoleId)) {
          candidateRoleId = cookieRoleId;
        }
      }

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

    if (candidateRoleId === null && allowedRoles.length > 0) {
      if (defaultRoleId && allowedRoles.includes(defaultRoleId)) {
        candidateRoleId = defaultRoleId;
      } else {
        candidateRoleId = allowedRoles[0];
      }
    }

    set({ activeRoleId: candidateRoleId });

    if (typeof window !== 'undefined') {
      if (candidateRoleId !== null) {
        document.cookie = `active_role_id=${candidateRoleId}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        try {
          localStorage.setItem('last_accessed_role_id', String(candidateRoleId));
        } catch {
          // Ignore localStorage quota errors
        }
      } else {
        document.cookie = 'active_role_id=; path=/; max-age=0; SameSite=Lax';
        try {
          localStorage.removeItem('last_accessed_role_id');
        } catch {
          // Ignore localStorage quota errors
        }
      }
    }
  },
}));





