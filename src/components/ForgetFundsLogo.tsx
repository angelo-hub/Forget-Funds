import { PiggyBank } from '@phosphor-icons/react';

interface ForgetFundsLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export function ForgetFundsLogo({ 
  size = 32, 
  className = '', 
  showText = true 
}: ForgetFundsLogoProps) {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Gradient Logo with Piggy Bank */}
      <div 
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 p-2 shadow-lg"
        style={{ width: size + 16, height: size + 16 }}
      >
        <PiggyBank 
          size={size} 
          weight="duotone"
          className="text-white drop-shadow-sm"
        />
        {/* Subtle inner glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent"></div>
      </div>
      
      {/* App Name */}
      {showText && (
        <div className="flex flex-col">
          <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            ForgetFunds
          </h1>
          <p className="text-xs text-muted-foreground -mt-1">
            Budget Smarter
          </p>
        </div>
      )}
    </div>
  );
}

// Icon-only version for smaller spaces
export function ForgetFundsIcon({ 
  size = 24, 
  className = '' 
}: { size?: number; className?: string }) {
  return (
    <div 
      className={`relative flex items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 p-1.5 shadow-md ${className}`}
      style={{ width: size + 12, height: size + 12 }}
    >
      <PiggyBank 
        size={size} 
        weight="duotone"
        className="text-white drop-shadow-sm"
      />
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/20 to-transparent"></div>
    </div>
  );
}
