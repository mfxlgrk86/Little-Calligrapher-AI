import React from 'react';

interface TianZiGeProps {
  size: number;
  className?: string;
  children?: React.ReactNode;
  variant?: 'screen' | 'print';
}

export const TianZiGe: React.FC<TianZiGeProps> = ({ size, className = '', children, variant = 'screen' }) => {
  // Styles logic:
  // If variant is 'print', we force high-contrast colors immediately.
  const isPrint = variant === 'print';
  
  // Explicitly use border-solid for html2canvas compatibility
  // Using !important via inline styles or specific classes to ensure it's picked up
  const containerBase = `relative box-border border-2`;
  
  // For print: Use explicit bg-white instead of transparent to avoid alpha issues in PDF.
  const containerColors = isPrint 
    ? `bg-white border-red-600` 
    : `bg-red-50/50 border-red-500 print:border-red-600 print:bg-transparent`;

  // Grid line styles
  const lineBase = `absolute transform opacity-60`;
  const lineColors = isPrint
    ? `bg-red-600 border-red-600 opacity-100 border-solid` 
    : `bg-red-300 border-red-300 print:opacity-100 print:bg-red-600 print:border-red-600`;

  return (
    <div 
      className={`${containerBase} ${containerColors} ${className}`}
      style={{ 
        width: size, 
        height: size,
        borderStyle: 'solid' // Force solid border style for canvas
      }}
    >
      {/* Background Grid Lines */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Horizontal Center Line */}
        <div 
          className={`top-1/2 left-0 w-full h-px border-t border-dashed -translate-y-1/2 ${lineBase} ${lineColors}`}
          style={{ borderTopStyle: 'dashed', borderTopWidth: '1px' }}
        ></div>
        {/* Vertical Center Line */}
        <div 
          className={`left-1/2 top-0 h-full w-px border-l border-dashed -translate-x-1/2 ${lineBase} ${lineColors}`}
          style={{ borderLeftStyle: 'dashed', borderLeftWidth: '1px' }}
        ></div>
      </div>
      
      {/* Content Layer */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};