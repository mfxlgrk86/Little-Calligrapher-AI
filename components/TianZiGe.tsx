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
  
  // Explicitly use border-solid and !important to force html2canvas to render it
  const containerBase = `relative box-border border-2`;
  
  // For print: Use explicit bg-white instead of transparent.
  // We use inline styles for the border colors to ensure they override any utility class specificity issues in the canvas.
  const containerColors = isPrint 
    ? `bg-white` 
    : `bg-red-50/50 border-red-500`;

  // Grid line styles
  const lineBase = `absolute transform opacity-60`;
  const lineColors = isPrint
    ? `bg-red-600 border-red-600 opacity-100` 
    : `bg-red-300 border-red-300`;

  return (
    <div 
      className={`${containerBase} ${containerColors} ${className}`}
      style={{ 
        width: size, 
        height: size,
        borderStyle: 'solid',
        borderColor: isPrint ? '#dc2626' : undefined // red-600 hex
      }}
    >
      {/* Background Grid Lines */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Horizontal Center Line */}
        <div 
          className={`top-1/2 left-0 w-full h-px border-t border-dashed -translate-y-1/2 ${lineBase} ${lineColors}`}
          style={{ 
              borderTopStyle: 'dashed', 
              borderTopWidth: '1px',
              borderColor: isPrint ? '#dc2626' : undefined
          }}
        ></div>
        {/* Vertical Center Line */}
        <div 
          className={`left-1/2 top-0 h-full w-px border-l border-dashed -translate-x-1/2 ${lineBase} ${lineColors}`}
          style={{ 
              borderLeftStyle: 'dashed', 
              borderLeftWidth: '1px',
              borderColor: isPrint ? '#dc2626' : undefined
          }}
        ></div>
      </div>
      
      {/* Content Layer */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};