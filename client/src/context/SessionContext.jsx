import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api.js';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [me, setMe] = useState(null); // null = still loading
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setMe(await api('/me'));
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const value = {
    me,
    error,
    refresh,
    async beCustomer(payload) {
      await api('/session/customer', { method: 'POST', body: payload });
      await refresh();
    },
    async setRole(role) {
      await api('/session/role', { method: 'POST', body: { role } });
      await refresh();
    },
    async resetVisit() {
      await api('/session/switch', { method: 'POST' });
      await refresh();
    },
    setCurrentOrder(id) {
      setMe((m) => (m ? { ...m, currentOrderId: id } : m));
    },
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
