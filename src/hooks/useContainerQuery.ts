import React, { useEffect, useRef, useState } from 'react';

/**
 * 容器查詢工具類型定義
 */
export interface ContainerQueryOptions {
  containerName?: string;
  containerType?: 'inline-size' | 'block-size' | 'size' | 'style';
  fallbackBreakpoint?: number;
}

/**
 * 容器查詢 Hook
 * 提供容器查詢功能的 React Hook
 */
export const useContainerQuery = (
  breakpoint: number,
  options: ContainerQueryOptions = {}
) => {
  const containerRef = useRef<HTMLElement>(null);
  const [isMatched, setIsMatched] = useState(false);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // 檢查瀏覽器是否支持容器查詢
    if (!CSS.supports('container-type', 'inline-size')) {
      // 降級到 ResizeObserver
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { inlineSize } = entry.borderBoxSize[0];
          setIsMatched(inlineSize >= breakpoint);
        }
      });
      
      resizeObserver.observe(container);
      
      return () => {
        resizeObserver.disconnect();
      };
    }
    
    // 使用原生容器查詢
    const { containerName = 'component', containerType = 'inline-size' } = options;
    
    // 設置容器屬性
    container.style.containerType = containerType;
    container.style.containerName = containerName;
    
    // 監聽容器大小變化
    const mediaQuery = `(min-width: ${breakpoint}px)`;
    const containerQuery = window.matchMedia(`@container ${containerName} ${mediaQuery}`);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMatched(e.matches);
    };
    
    // 初始化匹配状态
    const initialMatch = containerQuery.matches;
    
    containerQuery.addEventListener('change', handleChange);
    
    // 使用 setTimeout 避免同步设置状态
    setTimeout(() => {
      setIsMatched(initialMatch);
    }, 0);
    
    return () => {
      containerQuery.removeEventListener('change', handleChange);
    };
  }, [breakpoint, options]);
  
  return { containerRef, isMatched };
};

/**
 * 容器查詢工具函數
 */
export const containerQueryUtils = {
  /**
   * 檢查瀏覽器是否支持容器查詢
   */
  isSupported: (): boolean => {
    return CSS.supports('container-type', 'inline-size');
  },
  
  /**
   * 為元素設置容器查詢屬性
   */
  setupContainer: (
    element: HTMLElement,
    options: ContainerQueryOptions = {}
  ): void => {
    const { containerName = 'component', containerType = 'inline-size' } = options;
    element.style.containerType = containerType;
    element.style.containerName = containerName;
  },
  
  /**
   * 創建容器查詢媒體查詢字符串
   */
  createQuery: (
    containerName: string,
    condition: string
  ): string => {
    return `@container ${containerName} (${condition})`;
  },
  
  /**
   * 獲取容器查詢斷點配置
   */
  getBreakpoints: () => ({
    xs: 280,
    sm: 320,
    md: 480,
    lg: 640,
    xl: 800,
    '2xl': 1024
  }),
  
  /**
   * 生成容器查詢 CSS 類名
   */
  generateClassName: (
    baseClass: string,
    breakpoint: string,
    condition: string
  ): string => {
    return `${baseClass}-cq-${breakpoint}-${condition}`;
  }
};

/**
 * 容器查詢組件包裝器
 */
interface ContainerQueryWrapperProps {
  children: React.ReactNode;
  containerName?: string;
  containerType?: 'inline-size' | 'block-size' | 'size';
  className?: string;
}

export const ContainerQueryWrapper = React.forwardRef<HTMLDivElement, ContainerQueryWrapperProps>(
  function ContainerQueryWrapper({ children, containerName = 'component', containerType = 'inline-size', className = '' }, ref) {
    const internalRef = useRef<HTMLDivElement>(null);
    
    // 合并外部 ref 和内部 ref
    const setRef = React.useCallback((node: HTMLDivElement | null) => {
      // 设置内部 ref
      internalRef.current = node;
      
      // 设置外部 ref（如果存在）
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
      
      // 设置容器查询
      if (node) {
        containerQueryUtils.setupContainer(node, {
          containerName,
          containerType
        });
      }
    }, [ref, containerName, containerType]);
    
    /* eslint-disable react-hooks/refs */
    return React.createElement(
      'div',
      {
        ref: setRef,
        className: `container-query-${containerName} ${className}`,
        style: {
          containerType,
          containerName
        } as React.CSSProperties
      },
      children
    );
    /* eslint-enable react-hooks/refs */
  }
);

const containerQueryExports = {
  useContainerQuery,
  containerQueryUtils,
  ContainerQueryWrapper
};

export default containerQueryExports;