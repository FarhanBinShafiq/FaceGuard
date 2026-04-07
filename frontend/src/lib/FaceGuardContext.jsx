import React, { createContext, useContext, useMemo } from 'react';
import { FaceGuardClient } from './api';

const FaceGuardContext = createContext(null);

/**
 * Providing context for FaceGuard SDK.
 * @param {string} baseUrl - Backend URL (default: '/api')
 * @param {object} options - Optional configuration
 */
export const FaceGuardProvider = ({ children, baseUrl = '/api', options = {} }) => {
  const client = useMemo(() => new FaceGuardClient(baseUrl), [baseUrl]);

  const value = {
    client,
    options,
    baseUrl
  };

  return (
    <FaceGuardContext.Provider value={value}>
      {children}
    </FaceGuardContext.Provider>
  );
};

export const useFaceGuard = () => {
  const context = useContext(FaceGuardContext);
  if (!context) {
    throw new Error('useFaceGuard must be used within a FaceGuardProvider');
  }
  return context;
};
