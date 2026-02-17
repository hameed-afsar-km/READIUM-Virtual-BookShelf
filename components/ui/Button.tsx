import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  children, 
  ...props 
}) => {
  const baseStyle = "inline-flex items-center justify-center font-display font-bold uppercase tracking-wider border-3 border-black dark:border-white transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-pop-yellow text-black shadow-hard dark:shadow-hard-white hover:bg-yellow-300",
    secondary: "bg-white dark:bg-neutral-800 text-black dark:text-white shadow-hard dark:shadow-hard-white hover:bg-gray-50 dark:hover:bg-neutral-700",
    ghost: "bg-transparent border-transparent shadow-none hover:bg-black/5 dark:hover:bg-white/10 !border-0 text-black dark:text-white",
    icon: "bg-pop-blue text-black shadow-hard dark:shadow-hard-white rounded-none",
    danger: "bg-pop-red text-white shadow-hard dark:shadow-hard-white hover:bg-red-500",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-12 px-6 text-sm",
    lg: "h-16 px-8 text-base",
    icon: "h-12 w-12 p-2",
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};