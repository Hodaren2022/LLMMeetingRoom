import { useState, useEffect, useCallback } from 'react';

interface SwipeDirection {
  x: number;
  y: number;
}

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinchStart?: (distance: number) => void;
  onPinchMove?: (distance: number, scale: number) => void;
  onPinchEnd?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
}

interface UseSwipeOptions {
  threshold?: number; // 最小滑動距離
  preventDefaultTouchmoveEvent?: boolean;
  trackMouse?: boolean; // 是否追蹤滑鼠事件（用於桌面測試）
  longPressDelay?: number; // 長按延遲時間（毫秒）
  doubleTapDelay?: number; // 雙擊延遲時間（毫秒）
  pinchThreshold?: number; // 捏合手勢閾值
}

export const useSwipe = (
  handlers: SwipeHandlers,
  options: UseSwipeOptions = {}
) => {
  const {
    threshold = 50,
    preventDefaultTouchmoveEvent = false,
    trackMouse = false,
    longPressDelay = 500,
    doubleTapDelay = 300,
    // pinchThreshold: _pinchThreshold = 10
  } = options;

  const [startPos, setStartPos] = useState<SwipeDirection>({ x: 0, y: 0 });
  const [endPos, setEndPos] = useState<SwipeDirection>({ x: 0, y: 0 });
  const [isSwiping, setIsSwiping] = useState(false);
  const [isPinching, setIsPinching] = useState(false);
  const [initialPinchDistance, setInitialPinchDistance] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [touchStartTime, setTouchStartTime] = useState(0);

  // 計算兩點間距離（用於捏合手勢）
  const getDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    setStartPos({ x: clientX, y: clientY });
    setEndPos({ x: clientX, y: clientY });
    setIsSwiping(true);
    setTouchStartTime(Date.now());

    // 設置長按計時器
    const timer = setTimeout(() => {
      handlers.onLongPress?.();
      setIsSwiping(false);
    }, longPressDelay);
    setLongPressTimer(timer);
  }, [handlers, longPressDelay]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isSwiping) return;
    setEndPos({ x: clientX, y: clientY });
  }, [isSwiping]);

  const handleEnd = useCallback(() => {
    // 清除長按計時器
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    if (!isSwiping && !isPinching) return;
    
    const deltaX = endPos.x - startPos.x;
    const deltaY = endPos.y - startPos.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    const touchDuration = Date.now() - touchStartTime;

    // 處理捏合手勢結束
    if (isPinching) {
      handlers.onPinchEnd?.();
      setIsPinching(false);
      setInitialPinchDistance(0);
      return;
    }

    // 判斷是否為點擊（短時間且移動距離小）
    if (touchDuration < 200 && Math.max(absDeltaX, absDeltaY) < 10) {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTime;
      
      if (timeSinceLastTap < doubleTapDelay) {
        // 雙擊
        handlers.onDoubleTap?.();
      } else {
        // 單擊
        handlers.onTap?.();
      }
      
      setLastTapTime(now);
      setIsSwiping(false);
      return;
    }

    // 判斷是否達到滑動閾值
    if (Math.max(absDeltaX, absDeltaY) < threshold) {
      setIsSwiping(false);
      return;
    }

    // 判斷滑動方向（優先處理較大的軸向移動）
    if (absDeltaX > absDeltaY) {
      // 水平滑動
      if (deltaX > 0) {
        handlers.onSwipeRight?.();
      } else {
        handlers.onSwipeLeft?.();
      }
    } else {
      // 垂直滑動
      if (deltaY > 0) {
        handlers.onSwipeDown?.();
      } else {
        handlers.onSwipeUp?.();
      }
    }

    setIsSwiping(false);
  }, [startPos, endPos, threshold, handlers, isSwiping, isPinching, longPressTimer, touchStartTime, lastTapTime, doubleTapDelay]);

  // 觸摸事件處理
  const onTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      // 單指觸摸
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    } else if (e.touches.length === 2) {
      // 雙指觸摸（捏合手勢）
      const distance = getDistance(e.touches[0], e.touches[1]);
      setInitialPinchDistance(distance);
      setIsPinching(true);
      setIsSwiping(false);
      handlers.onPinchStart?.(distance);
      
      // 清除長按計時器
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
    }
  }, [handleStart, getDistance, handlers, longPressTimer]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (preventDefaultTouchmoveEvent) {
      e.preventDefault();
    }

    if (e.touches.length === 1 && isSwiping) {
      // 單指滑動
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    } else if (e.touches.length === 2 && isPinching) {
      // 雙指捏合
      const distance = getDistance(e.touches[0], e.touches[1]);
      const scale = distance / initialPinchDistance;
      handlers.onPinchMove?.(distance, scale);
    }
  }, [handleMove, preventDefaultTouchmoveEvent, isSwiping, isPinching, getDistance, initialPinchDistance, handlers]);

  const onTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // 滑鼠事件處理（用於桌面測試）
  const onMouseDown = useCallback((e: MouseEvent) => {
    if (!trackMouse) return;
    handleStart(e.clientX, e.clientY);
  }, [handleStart, trackMouse]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!trackMouse) return;
    handleMove(e.clientX, e.clientY);
  }, [handleMove, trackMouse]);

  const onMouseUp = useCallback(() => {
    if (!trackMouse) return;
    handleEnd();
  }, [handleEnd, trackMouse]);

  // 綁定事件監聽器
  useEffect(() => {
    const element = document;

    // 觸摸事件
    element.addEventListener('touchstart', onTouchStart, { passive: true });
    element.addEventListener('touchmove', onTouchMove, { passive: !preventDefaultTouchmoveEvent });
    element.addEventListener('touchend', onTouchEnd, { passive: true });

    // 滑鼠事件（可選）
    if (trackMouse) {
      element.addEventListener('mousedown', onMouseDown);
      element.addEventListener('mousemove', onMouseMove);
      element.addEventListener('mouseup', onMouseUp);
    }

    return () => {
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('touchend', onTouchEnd);
      
      if (trackMouse) {
        element.removeEventListener('mousedown', onMouseDown);
        element.removeEventListener('mousemove', onMouseMove);
        element.removeEventListener('mouseup', onMouseUp);
      }
    };
  }, [
    onTouchStart, onTouchMove, onTouchEnd,
    onMouseDown, onMouseMove, onMouseUp,
    trackMouse, preventDefaultTouchmoveEvent
  ]);

  return {
    isSwiping,
    isPinching,
    swipeDirection: {
      x: endPos.x - startPos.x,
      y: endPos.y - startPos.y
    },
    // 觸摸事件處理器（用於手動綁定）
    touchHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd
    },
    // 滑鼠事件處理器（用於手動綁定）
    mouseHandlers: trackMouse ? {
      onMouseDown,
      onMouseMove,
      onMouseUp
    } : undefined
  };
};

export default useSwipe;