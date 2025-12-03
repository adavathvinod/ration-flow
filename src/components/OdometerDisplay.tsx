import { useEffect, useState, useRef } from "react";

interface OdometerDisplayProps {
  value: number;
  size?: "sm" | "md" | "lg";
}

const OdometerDisplay = ({ value, size = "lg" }: OdometerDisplayProps) => {
  const [digits, setDigits] = useState<string[]>([]);
  const [animatingDigits, setAnimatingDigits] = useState<Set<number>>(new Set());
  const prevValueRef = useRef<number>(value);

  const sizeClasses = {
    sm: "text-4xl w-12 h-16",
    md: "text-6xl w-16 h-24",
    lg: "text-7xl md:text-8xl w-20 md:w-24 h-28 md:h-36",
  };

  useEffect(() => {
    const valueStr = value.toString();
    const prevValueStr = prevValueRef.current.toString();
    
    // Pad with leading zeros if needed for animation effect
    const maxLength = Math.max(valueStr.length, prevValueStr.length);
    const paddedValue = valueStr.padStart(maxLength, '0');
    const paddedPrev = prevValueStr.padStart(maxLength, '0');
    
    // Find which digits changed
    const changedIndices = new Set<number>();
    for (let i = 0; i < maxLength; i++) {
      if (paddedValue[i] !== paddedPrev[i]) {
        changedIndices.add(i);
      }
    }
    
    setAnimatingDigits(changedIndices);
    setDigits(paddedValue.split(''));
    prevValueRef.current = value;
    
    // Clear animation after it completes
    const timer = setTimeout(() => {
      setAnimatingDigits(new Set());
    }, 400);
    
    return () => clearTimeout(timer);
  }, [value]);

  // Remove leading zeros for display but keep at least one digit
  const displayDigits = digits.length > 1 
    ? digits.slice(digits.findIndex(d => d !== '0') === -1 ? digits.length - 1 : digits.findIndex(d => d !== '0'))
    : digits;

  return (
    <div className="odometer-container p-4 md:p-6">
      <div className="flex items-center justify-center gap-1 md:gap-2">
        {displayDigits.map((digit, index) => (
          <div
            key={`${index}-${displayDigits.length}`}
            className={`relative overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg border border-slate-700 flex items-center justify-center ${sizeClasses[size]}`}
          >
            {/* Reflection effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            
            {/* Horizontal divider line */}
            <div className="absolute inset-x-0 top-1/2 h-px bg-slate-700/50" />
            
            {/* Digit */}
            <span
              className={`odometer-digit transition-all duration-300 ${
                animatingDigits.has(digits.indexOf(digit)) ? "digit-roll-enter" : ""
              }`}
            >
              {digit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OdometerDisplay;
