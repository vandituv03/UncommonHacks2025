import React from 'react';

export const Card = ({ children, className = '' }) => {
  return (
    <div className={`bg-[#1e1e2f] rounded-xl shadow-lg ${className}`}>
      {children}
    </div>
  );
};
