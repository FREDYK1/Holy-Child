import React from 'react';
import Link from 'next/link';

const ButtonComponent = ({ href = '/uploadpic', children = 'Get Started', variant = 'primary', size = 'default', className = '' }) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold transition-all duration-300 transform";
  
  const variants = {
    primary: "bg-gradient-to-r from-[#7C3F33] to-[#6A352B] text-white shadow-lg shadow-[#7C3F33]/30 hover:shadow-xl hover:shadow-[#7C3F33]/40 hover:-translate-y-0.5 active:translate-y-0",
    secondary: "bg-white text-[#7C3F33] border-2 border-[#7C3F33] hover:bg-[#7C3F33] hover:text-white",
    ghost: "bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
  };
  
  const sizes = {
    small: "px-5 py-2 text-sm rounded-full",
    default: "px-8 py-3 text-base rounded-full",
    large: "px-10 py-4 text-lg rounded-full"
  };

  return (
    <Link 
      href={href} 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
      <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
};

export default ButtonComponent;