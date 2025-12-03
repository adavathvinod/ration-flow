import { useState, useRef } from "react";
import { ChevronRight } from "lucide-react";

interface SwipeToIncrementProps {
  onIncrement: () => void;
  disabled?: boolean;
}

const SwipeToIncrement = ({ onIncrement, disabled = false }: SwipeToIncrementProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const THRESHOLD = 200;

  const handleStart = (clientX: number) => {
    if (disabled) return;
    setIsDragging(true);
    startXRef.current = clientX;
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || disabled) return;
    const delta = clientX - startXRef.current;
    const clampedDelta = Math.max(0, Math.min(delta, THRESHOLD));
    setDragX(clampedDelta);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    
    if (dragX >= THRESHOLD * 0.9) {
      onIncrement();
    }
    
    setIsDragging(false);
    setDragX(0);
  };

  const progress = dragX / THRESHOLD;
  const isComplete = progress >= 0.9;

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        ref={trackRef}
        className={`swipe-track relative transition-colors ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        } ${isComplete ? "bg-accent/20" : ""}`}
        style={{ width: "100%" }}
      >
        {/* Track background gradient */}
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 transition-opacity"
          style={{ opacity: progress }}
        />
        
        {/* Label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className={`text-sm font-medium transition-opacity ${
            progress > 0.3 ? "opacity-0" : "opacity-70"
          }`}>
            Swipe to serve next →
          </span>
        </div>

        {/* Success indicator */}
        <div
          className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity ${
            isComplete ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="text-sm font-medium text-accent">Release to confirm</span>
        </div>

        {/* Thumb */}
        <div
          className={`swipe-thumb ${isComplete ? "bg-accent" : ""} ${
            isDragging ? "scale-105" : ""
          }`}
          style={{ transform: `translateX(${dragX}px)` }}
          onMouseDown={(e) => handleStart(e.clientX)}
          onMouseMove={(e) => handleMove(e.clientX)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={(e) => handleStart(e.touches[0].clientX)}
          onTouchMove={(e) => handleMove(e.touches[0].clientX)}
          onTouchEnd={handleEnd}
        >
          <ChevronRight className="w-8 h-8 text-primary-foreground" />
        </div>
      </div>
      
      <p className="text-center text-xs text-muted-foreground mt-3">
        {disabled ? "Token generation closed" : "Drag right to increment serving number"}
      </p>
    </div>
  );
};

export default SwipeToIncrement;
