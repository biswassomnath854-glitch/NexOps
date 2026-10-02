import React from 'react'
import { cn } from '@/utils/cn'
import { BRANDING } from '@/constants/branding'

/**
 * Compact SB Monogram Image Component
 * Renders the official monogram mark cropped directly from the provided SB Pvt. Ltd. logo asset.
 * Used in compact areas such as collapsed sidebar, favicon, and mobile drawers.
 */
export function SBMonogram({
  size = 32,
  className = '',
  variant = 'auto',
  badge = true,
  alt = `${BRANDING.name} Logo`,
}) {
  const dimension = typeof size === 'number' ? size : 32
  const isLight =
    variant === 'light' ||
    variant === 'white' ||
    className?.includes('text-white')

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center shrink-0 select-none transition-transform',
        badge && (isLight ? 'bg-white rounded-xl shadow-xs p-1' : 'bg-white/80 rounded-xl shadow-xs p-1'),
        className
      )}
      style={{ width: dimension, height: dimension }}
    >
      <img
        src="/sb-pvt-ltd-icon.png"
        alt={alt}
        className="w-full h-full object-contain"
        loading="eager"
        decoding="async"
      />
    </div>
  )
}

/**
 * Reusable SBLogo Component
 * Renders the official provided SB Pvt. Ltd. brand logo image asset.
 * Preserves exact aspect ratio, typography, and color palette without duplicate text.
 */
export function SBLogo({
  size = 'md',
  showText = true,
  showTagline = false,
  tagline = BRANDING.tagline,
  variant = 'auto', // 'auto' | 'light' | 'dark'
  className = '',
  imageClassName = '',
  textClassName = '',
  badge = true,
  alt = BRANDING.name,
}) {
  const sizeMap = {
    xs: { h: 24, iconSize: 22, text: 'text-[9px]' },
    sm: { h: 30, iconSize: 26, text: 'text-[10px]' },
    md: { h: 38, iconSize: 32, text: 'text-[11px]' },
    lg: { h: 48, iconSize: 40, text: 'text-xs' },
    xl: { h: 64, iconSize: 52, text: 'text-sm' },
  }

  const current = sizeMap[size] || sizeMap.md
  const isLight =
    variant === 'light' ||
    className?.includes('text-white') ||
    textClassName?.includes('text-white')

  if (!showText) {
    return (
      <SBMonogram
        size={current.iconSize}
        variant={variant}
        badge={badge}
        className={className}
        alt={alt}
      />
    )
  }

  return (
    <div
      className={cn(
        'inline-flex flex-col select-none tracking-tight group',
        className
      )}
    >
      <div
        className={cn(
          'inline-flex items-center justify-center rounded-xl transition-all',
          isLight ? 'bg-white rounded-xl px-2 py-1 shadow-xs border border-white/20' : ''
        )}
      >
        <img
          src="/sb-pvt-ltd-logo.png"
          alt={alt}
          style={{ height: `${current.h}px`, width: 'auto' }}
          className={cn('object-contain max-w-full', imageClassName)}
          loading="eager"
          decoding="async"
        />
      </div>

      {showTagline && (
        <span
          className={cn(
            'tracking-widest font-semibold uppercase mt-1',
            current.text,
            isLight ? 'text-indigo-200/90' : 'text-slate-400'
          )}
        >
          {tagline}
        </span>
      )}
    </div>
  )
}

/**
 * Pre-configured Light SB Logo (for dark backgrounds)
 */
export function SBLightLogo(props) {
  return <SBLogo variant="light" {...props} />
}

export function SBDarkLogo(props) {
  return <SBLogo variant="dark" {...props} />
}

export default SBLogo
