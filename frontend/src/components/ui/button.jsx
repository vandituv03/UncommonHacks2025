import React from 'react';
import classNames from 'classnames';

export const Button = ({ children, onClick, className = '', variant = 'default', ...props }) => {
  const baseStyles = 'px-4 py-2 rounded-md font-medium transition-all duration-200 focus:outline-none';

  const variants = {
    default: 'bg-purple-600 text-white hover:bg-purple-700',
    outline: 'border border-purple-400 text-purple-300 hover:bg-purple-700 hover:text-white',
  };

  return (
    <button
      onClick={onClick}
      className={classNames(baseStyles, variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
};
