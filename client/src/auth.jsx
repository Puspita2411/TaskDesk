import { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken, token } from './api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);
export const homeFor = (u) => (u.role === 'admin' ? '/admin' : '/dashboard');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!token());
  useEffect(() => {
    if (!token()) return;
    api('/auth/me').then(setUser).catch(() => setToken(null)).finally(() => setReady(true));
  }, []);
  const signIn = ({ token: t, user: u }) => { setToken(t); setUser(u); };
  const signOut = () => { setToken(null); setUser(null); };
  return <Ctx.Provider value={{ user, ready, signIn, signOut }}>{children}</Ctx.Provider>;
}
