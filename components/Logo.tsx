import React from 'react';
import { Layers } from 'lucide-react';

interface LogoProps {
  className?: string;
  variant?: 'dark' | 'light';
  collapsed?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  variant = 'dark',
  collapsed = false
}) => {
  const textColor = variant === 'light' ? 'text-white' : 'text-deepBlue';

  return (
    <div className={`flex items-center gap-2 transition-all duration-300 ${className}`}>
      <div className={`bg-teal p-1.5 rounded-lg flex-shrink-0 transition-all duration-300 ${collapsed ? 'mx-auto' : ''}`}>
        <Layers className="text-white w-6 h-6" />
      </div>
      <div className={`overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
        <span className={`font-bold text-2xl tracking-tight whitespace-nowrap ${textColor}`}>
          Aether<span className="font-light text-teal">:</span>Foundation
        </span>
      </div>
    </div>
  );
};