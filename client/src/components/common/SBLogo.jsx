import React from 'react'
import { cn } from '@/utils/cn'
import { BRANDING } from '@/constants/branding'

/**
 * Concept 2: Elegant "SB" Monogram SVG Component
 * Precision vector interlocking monogram featuring fluid geometric curves
 * and harmonious luxury brand aesthetics.
 */
export function SBMonogram({
  size = 32,
  className = '',
  variant = 'primary', // 'primary' | 'white' | 'dark' | 'outline'
  badge = true, // Whether wrapped in premium squircle badge
}) {
  const dimension = typeof size === 'number' ? size : 32

  if (!badge) {
    // Standalone vector monogram (unbadged)
    const strokeColor =
      variant === 'white'
        ? '#FFFFFF'
        : variant === 'dark'
          ? '#1E1B4B'
          : '#635BFF'

    return (
      <svg
        width={dimension}
        height={dimension}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('shrink-0 select-none transition-transform', className)}
        aria-label="SB Monogram"
      >
        <defs>
          <linearGradient id="sb-mono-grad-s" x1="8" y1="8" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="50%" stopColor="#635BFF" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>
          <linearGradient id="sb-mono-grad-b" x1="12" y1="8" x2="34" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#A5B4FC" />
            <stop offset="60%" stopColor="#635BFF" />
            <stop offset="100%" stopColor="#4338CA" />
          </linearGradient>
        </defs>

        {/* Vertical Spine of B */}
        <rect
          x="12"
          y="9"
          width="4"
          height="26"
          rx="2"
          fill={variant === 'white' ? '#FFFFFF' : 'url(#sb-mono-grad-b)'}
        />

        {/* Dual Loops of B */}
        <path
          d="M14 9.5 H25 C29.5 9.5 32.5 12.2 32.5 16 C32.5 19.8 29.5 22 25 22 H14"
          fill="none"
          stroke={variant === 'white' ? '#FFFFFF' : 'url(#sb-mono-grad-b)'}
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 22 H26.5 C31.5 22 34.5 24.5 34.5 28.5 C34.5 32.5 31.5 34.5 26.5 34.5 H14"
          fill="none"
          stroke={variant === 'white' ? '#FFFFFF' : 'url(#sb-mono-grad-b)'}
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Interlocking S Ribbon with negative cutout depth */}
        <path
          d="M29.5 13.5 C26 10.5 19 10 14.5 13 C12 14.7 11.5 18 13.5 20 C16 22.5 28 23 29.5 26.5 C31 30 27.5 33.5 21 34 C16.5 34.3 12.5 32 10.5 29.5"
          fill="none"
          stroke={strokeColor}
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  // Badged Concept 2 Monogram (standard for avatar / icon / app shell)
  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0 select-none shadow-sm transition-transform', className)}
      aria-label="SB Monogram"
    >
      <defs>
        {/* Rich Radial/Linear Background Gradient */}
        <linearGradient id="sb-badge-grad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#635BFF" />
          <stop offset="45%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#3730A3" />
        </linearGradient>

        {/* Shimmer Edge Highlight */}
        <linearGradient id="sb-edge-shine" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.2" />
        </linearGradient>

        {/* Monogram Stroke Gradient */}
        <linearGradient id="sb-gold-shine" x1="12" y1="10" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#EEF2FF" />
          <stop offset="100%" stopColor="#C7D2FE" />
        </linearGradient>

        {/* Subtle Drop Shadow */}
        <filter id="sb-shadow" x="-2" y="2" width="52" height="52" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#1E1B4B" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Squircle Badge Container */}
      <rect
        x="2.5"
        y="2.5"
        width="43"
        height="43"
        rx="12"
        fill="url(#sb-badge-grad)"
        stroke="url(#sb-edge-shine)"
        strokeWidth="1.2"
        filter="url(#sb-shadow)"
      />

      {/* Decorative ambient glow */}
      <circle cx="14" cy="14" r="10" fill="#FFFFFF" fillOpacity="0.12" />

      {/* ========================================================
          CONCEPT 2 MONOGRAM LETTERFORMS (S & B)
          ======================================================== */}

      {/* B Vertical Stem */}
      <rect
        x="13.5"
        y="11.5"
        width="4.2"
        height="25"
        rx="2.1"
        fill="url(#sb-gold-shine)"
      />

      {/* B Upper Bowl */}
      <path
        d="M15.5 12 H26 C30 12 32.5 14.2 32.5 17.5 C32.5 20.8 30 22.8 26 22.8 H15.5"
        fill="none"
        stroke="url(#sb-gold-shine)"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* B Lower Bowl */}
      <path
        d="M15.5 22.8 H27.5 C32 22.8 34.5 25 34.5 28.6 C34.5 32.4 31.8 34.5 27 34.5 H15.5"
        fill="none"
        stroke="url(#sb-gold-shine)"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* S Dynamic Luxury Ribbon Weave */}
      <path
        d="M29 14.5 C25 11.5 19.5 11.5 16 14 C13.2 16 13 19.5 15.5 21.5 C18.5 23.8 29.5 24.2 30.5 28 C31.5 31.8 28 34.5 22 35 C17.5 35.4 13.5 33 11 30.5"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Intersecting Accent Node */}
      <circle cx="21" cy="22.8" r="1.2" fill="#818CF8" />
    </svg>
  )
}

/**
 * Reusable SBLogo Component
 * Full Logo: [SB Monogram] SB Pvt. Ltd.
 */
export function SBLogo({
  size = 'md',
  showText = true,
  showTagline = false,
  tagline = BRANDING.tagline,
  variant = 'auto', // 'auto' | 'light' | 'dark'
  className = '',
  textClassName = '',
  badge = true,
}) {
  const sizeMap = {
    xs: { iconSize: 22, text: 'text-sm', badge: 'rounded-md', gap: 'gap-1.5' },
    sm: { iconSize: 28, text: 'text-base', badge: 'rounded-lg', gap: 'gap-2' },
    md: { iconSize: 34, text: 'text-lg', badge: 'rounded-xl', gap: 'gap-2.5' },
    lg: { iconSize: 42, text: 'text-xl', badge: 'rounded-xl', gap: 'gap-3' },
    xl: { iconSize: 52, text: 'text-2xl', badge: 'rounded-2xl', gap: 'gap-3.5' },
  }

  const current = sizeMap[size] || sizeMap.md

  // Determine text color based on variant and class hints
  const isLight =
    variant === 'light' ||
    className?.includes('text-white') ||
    textClassName?.includes('text-white')

  return (
    <div
      className={cn(
        'inline-flex items-center select-none font-bold tracking-tight group',
        current.gap,
        className
      )}
    >
      <SBMonogram
        size={current.iconSize}
        badge={badge}
        variant={isLight ? 'white' : 'primary'}
      />

      {showText && (
        <div className="flex flex-col leading-tight">
          <span
            className={cn(
              'font-extrabold tracking-tight flex items-center gap-1.5',
              isLight ? 'text-white' : 'text-slate-900',
              current.text,
              textClassName
            )}
          >
            <span className={isLight ? 'text-white' : 'text-slate-900'}>
              SB
            </span>
            <span
              className={cn(
                'font-medium text-xs tracking-wider uppercase px-1.5 py-0.5 rounded border',
                isLight
                  ? 'bg-white/10 text-indigo-200 border-white/20'
                  : 'bg-indigo-50 text-[#635BFF] border-indigo-100'
              )}
            >
              Pvt. Ltd.
            </span>
          </span>

          {showTagline && (
            <span
              className={cn(
                'text-[10px] tracking-widest font-semibold uppercase',
                isLight ? 'text-indigo-200/80' : 'text-slate-400'
              )}
            >
              {tagline}
            </span>
          )}
        </div>
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

