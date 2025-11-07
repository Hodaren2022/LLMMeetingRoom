import React, { useState, useCallback, useRef, useEffect } from 'react';

/**
 * 觸摸友好按鈕組件屬性
 */
export interface TouchButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  className?: string;
  longPressDelay?: number;
  enableRipple?: boolean;
  enableHaptic?: boolean;
}

/**
 * 觸摸友好按鈕組件
 * 提供觸摸反饋、長按支持和觸覺反饋
 */
export const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  onClick,
  onLongPress,
  disabled = false,
  size = 'md',
  variant = 'primary',
  className = '',
  longPressDelay = 500,
  enableRipple = true,
  enableHaptic = true
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const rippleRef = useRef<HTMLDivElement>(null);

  // 觸覺反饋
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!enableHaptic || !navigator.vibrate) return;
    
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30]
    };
    
    navigator.vibrate(patterns[type]);
  }, [enableHaptic]);

  // 波紋效果
  const createRipple = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (!enableRipple || !buttonRef.current || !rippleRef.current) return;

    const button = buttonRef.current;
    const ripple = rippleRef.current;
    const rect = button.getBoundingClientRect();
    
    let clientX: number, clientY: number;
    
    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.animation = 'none';
    void ripple.offsetHeight; // 觸發重排
    ripple.style.animation = 'touch-ripple 0.6s linear';
  }, [enableRipple]);

  // 處理按下
  const handlePressStart = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    
    setIsPressed(true);
    createRipple(event);
    triggerHaptic('light');
    
    // 設置長按計時器
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        setIsLongPressing(true);
        triggerHaptic('medium');
        onLongPress();
      }, longPressDelay);
    }
  }, [disabled, createRipple, triggerHaptic, onLongPress, longPressDelay]);

  // 處理釋放
  const handlePressEnd = useCallback(() => {
    if (disabled) return;
    
    setIsPressed(false);
    setIsLongPressing(false);
    
    // 清除長按計時器
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, [disabled]);

  // 處理點擊
  const handleClick = useCallback(() => {
    if (disabled || isLongPressing) return;
    
    triggerHaptic('light');
    onClick?.();
  }, [disabled, isLongPressing, triggerHaptic, onClick]);

  // 清理計時器
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  // 樣式類名
  const sizeClasses = {
    sm: 'touch-target-sm text-xs px-2 py-1',
    md: 'touch-target-md text-sm px-3 py-1.5',
    lg: 'touch-target-lg text-base px-4 py-2'
  };
  
  // 桌面端尺寸優化
  const desktopSizeClasses = {
    sm: 'laptop:text-sm laptop:px-3 laptop:py-1.5',
    md: 'laptop:text-base laptop:px-4 laptop:py-2',
    lg: 'laptop:text-lg laptop:px-6 laptop:py-3'
  };

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100',
    ghost: 'text-blue-600 hover:bg-blue-50 active:bg-blue-100'
  };

  const baseClasses = `
    relative overflow-hidden rounded-lg font-medium transition-all duration-150
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    gesture-area no-zoom
    ${sizeClasses[size]}
    ${desktopSizeClasses[size]}
    ${variantClasses[variant]}
    ${isPressed ? 'scale-95' : ''}
    ${isLongPressing ? 'long-pressing' : ''}
    ${className}
  `;

  return (
    <button
      ref={buttonRef}
      className={baseClasses}
      disabled={disabled}
      onClick={handleClick}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onTouchCancel={handlePressEnd}
    >
      {children}
      
      {/* 波紋效果 */}
      {enableRipple && (
        <div
          ref={rippleRef}
          className="absolute w-1 h-1 bg-white/30 rounded-full pointer-events-none"
          style={{ transform: 'scale(0)' }}
        />
      )}
      
      {/* 長按指示器 */}
      {isLongPressing && (
        <div className="absolute inset-0 bg-white/10 rounded-lg animate-pulse" />
      )}
    </button>
  );
};

/**
 * 觸摸友好圖標按鈕組件
 */
export interface TouchIconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  className?: string;
  ariaLabel: string;
}

export const TouchIconButton: React.FC<TouchIconButtonProps> = ({
  icon,
  ariaLabel,
  ...props
}) => {
  return (
    <TouchButton
      {...props}
      className={`!p-0 aspect-square ${props.className || ''}`}
      aria-label={ariaLabel}
    >
      {icon}
    </TouchButton>
  );
};

/**
 * 觸摸友好卡片組件
 */
export interface TouchCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  onLongPress?: () => void;
  className?: string;
  enableHover?: boolean;
  style?: React.CSSProperties;
}

export const TouchCard: React.FC<TouchCardProps> = ({
  children,
  onClick,
  onLongPress,
  className = '',
  enableHover = true,
  style
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handlePressStart = useCallback(() => {
    setIsPressed(true);
    
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        onLongPress();
      }, 500);
    }
  }, [onLongPress]);

  const handlePressEnd = useCallback(() => {
    setIsPressed(false);
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  const baseClasses = `
    relative rounded-lg transition-all duration-200 cursor-pointer
    gesture-area no-zoom touch-feedback
    ${enableHover ? 'hover:shadow-md' : ''}
    ${isPressed ? 'scale-98' : ''}
    ${className}
  `;

  return (
    <div
      className={baseClasses}
      style={style}
      onClick={handleClick}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onTouchCancel={handlePressEnd}
    >
      {children}
    </div>
  );
};

const TouchComponentsExports = {
  TouchButton,
  TouchIconButton,
  TouchCard
};

export default TouchComponentsExports;