import React, { createContext, useContext, useState } from 'react';
import { LoadingPage } from '../components/ui/loading';

const LoadingContext = createContext();

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');

  const startLoading = (message = 'Loading...') => {
    setLoadingMessage(message);
    setIsLoading(true);
  };

  const stopLoading = () => {
    setIsLoading(false);
  };

  const withLoading = async (asyncFunction, message = 'Loading...') => {
    try {
      startLoading(message);
      const result = await asyncFunction();
      return result;
    } finally {
      stopLoading();
    }
  };

  const value = {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading,
    withLoading
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <LoadingPage message={loadingMessage} />
        </div>
      )}
    </LoadingContext.Provider>
  );
};
