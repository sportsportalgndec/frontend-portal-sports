import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ size = 'default', className = '' }) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    default: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={`${sizeClasses[size]} border-4 border-orange-500 border-dashed rounded-full animate-spin`}
      />
    </div>
  );
};

const LoadingPage = ({ message = "Loading..." }) => {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <LoadingSpinner size="large" />
        <p className="mt-4 text-muted-foreground dark:text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

const LoadingCard = ({ message = "Loading..." }) => {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-muted-foreground dark:text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

export { LoadingSpinner, LoadingPage, LoadingCard };
