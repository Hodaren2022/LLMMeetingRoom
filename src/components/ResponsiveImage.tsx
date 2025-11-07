import React, { useState, useCallback } from 'react';
import Image from 'next/image';

/**
 * 響應式圖片組件屬性
 */
export interface ResponsiveImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  className?: string;
  style?: React.CSSProperties;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
  loading?: 'lazy' | 'eager';
  unoptimized?: boolean;
}

/**
 * 響應式圖片組件
 * 基於 Next.js Image 組件的增強版本，提供更好的響應式支持
 */
export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  quality = 75,
  placeholder = 'blur',
  blurDataURL,
  className = '',
  style,
  sizes,
  onLoad,
  onError,
  loading = 'lazy',
  unoptimized = false,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // 默認模糊佔位符
  const defaultBlurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

  // 生成響應式 sizes 屬性
  const generateSizes = useCallback((): string => {
    if (sizes) return sizes;
    
    // 根據容器和設備類型生成默認 sizes
    return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
  }, [sizes]);

  // 處理圖片加載完成
  const handleLoad = useCallback(() => {
    setImageLoaded(true);
    onLoad?.();
  }, [onLoad]);

  // 處理圖片加載錯誤
  const handleError = useCallback(() => {
    setImageError(true);
    onError?.();
  }, [onError]);

  // 錯誤狀態顯示
  if (imageError) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={style}
      >
        <span className="text-gray-500 text-sm">圖片加載失敗</span>
      </div>
    );
  }

  // 圖片組件屬性
  const imageProps = {
    src,
    alt,
    quality,
    priority,
    loading: priority ? 'eager' as const : loading,
    placeholder,
    blurDataURL: blurDataURL || defaultBlurDataURL,
    className: `transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'} ${className}`,
    style,
    sizes: generateSizes(),
    onLoad: handleLoad,
    onError: handleError,
    unoptimized,
    ...props
  };

  // 填充模式
  if (fill) {
    return (
      <Image
        {...imageProps}
        fill
        alt={alt || ''}
      />
    );
  }

  // 固定尺寸模式
  if (width && height) {
    return (
      <Image
        {...imageProps}
        width={width}
        height={height}
        alt={alt || ''}
      />
    );
  }

  // 自適應模式（需要容器設置相對定位）
  return (
    <div className="relative w-full h-full">
      <Image
        {...imageProps}
        fill
        style={{ objectFit: 'cover', ...style }}
        alt={alt || ''}
      />
    </div>
  );
};

/**
 * 頭像圖片組件
 * 專門用於用戶頭像的響應式圖片組件
 */
export interface AvatarImageProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackText?: string;
}

export const AvatarImage: React.FC<AvatarImageProps> = ({
  src,
  alt,
  size = 'md',
  className = '',
  fallbackText
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const sizePx = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96
  };

  if (imageError) {
    return (
      <div 
        className={`${sizeClasses[size]} rounded-full bg-gray-300 flex items-center justify-center ${className}`}
      >
        <span className="text-gray-600 font-medium text-sm">
          {fallbackText || alt.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} relative rounded-full overflow-hidden ${className}`}>
      <ResponsiveImage
        src={src}
        alt={alt}
        width={sizePx[size]}
        height={sizePx[size]}
        className="rounded-full"
        quality={85}
        onError={() => setImageError(true)}
        sizes={`${sizePx[size]}px`}
      />
    </div>
  );
};

/**
 * 卡片圖片組件
 * 用於卡片中的響應式圖片
 */
export interface CardImageProps {
  src: string;
  alt: string;
  aspectRatio?: 'square' | 'video' | 'wide' | 'tall';
  className?: string;
  priority?: boolean;
}

export const CardImage: React.FC<CardImageProps> = ({
  src,
  alt,
  aspectRatio = 'video',
  className = '',
  priority = false
}) => {
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[21/9]',
    tall: 'aspect-[3/4]'
  };

  return (
    <div className={`relative ${aspectClasses[aspectRatio]} overflow-hidden ${className}`}>
      <ResponsiveImage
        src={src}
        alt={alt}
        fill
        priority={priority}
        className="object-cover"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
    </div>
  );
};

/**
 * 圖片工具函數
 */
export const imageUtils = {
  /**
   * 生成模糊佔位符
   */
  generateBlurDataURL: (width: number = 10, height: number = 10): string => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, width, height);
    }
    
    return canvas.toDataURL();
  },

  /**
   * 檢查圖片是否可訪問
   */
  checkImageAccessibility: async (src: string): Promise<boolean> => {
    try {
      const response = await fetch(src, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  },

  /**
   * 獲取圖片尺寸
   */
  getImageDimensions: (src: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new (globalThis.Image || window.Image)();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = reject;
      img.src = src;
    });
  },

  /**
   * 生成響應式 sizes 屬性
   */
  generateResponsiveSizes: (breakpoints: Record<string, string>): string => {
    const sizeEntries = Object.entries(breakpoints);
    const sizeStrings = sizeEntries.map(([breakpoint, size]) => {
      if (breakpoint === 'default') {
        return size;
      }
      return `(max-width: ${breakpoint}) ${size}`;
    });
    
    return sizeStrings.join(', ');
  }
};

const ResponsiveImageExports = {
  ResponsiveImage,
  AvatarImage,
  CardImage,
  imageUtils
};

export default ResponsiveImageExports;