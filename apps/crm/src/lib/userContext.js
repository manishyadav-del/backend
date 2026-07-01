'use client';

import { createContext, useContext } from 'react';

export const UserContext = createContext(null);

export function useUser() {
  const context = useContext(UserContext);
  return context;
}
