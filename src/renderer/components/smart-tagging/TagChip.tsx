import { useState } from 'react'
import type { TagSource } from '../../../shared/types/smart-tagging.types'

export type TagChipVariant = 'default' | 'suggestion' | 'lowConfidence' | 'needsReview'

type TagChipProps = {
  name: string
  section?: string
  confidence?: number | null
  isLocked?: boolean
  source?: TagSource
  variant?: TagChipVariant
  showConfidence?: boolean
  showLock?: boolean
  removable?: boolean
  onRemove?: () => void
  onLock?: () => void
  onUnlock?: () => void
  onClick?: () => void
}

const variantStyles: Record<TagChipVariant, { bg: string; text: string; border: string }> = {
  default: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200'
  },
  suggestion: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200'
  },
  lowConfidence: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200'
  },
  needsReview: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200'
  }
}

const sourceIcons: Record<TagSource, string> = {
  user: 'U',
  suggested: 'S',
  ai_refined: 'AI',
  imported: 'I'
}

export default function TagChip({
  name,
  section,
  confidence,
  isLocked = false,
  source,
  variant = 'default',
  showConfidence = false,
  showLock = true,
  removable = false,
  onRemove,
  onLock,
  onUnlock,
  onClick
}: TagChipProps): JSX.Element {
  const [isHovered, setIsHovered] = useState(false)
  const styles = variantStyles[variant]

  const confidencePercent = confidence != null ? Math.round(confidence * 100) : null

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium
        transition-all duration-150
        ${styles.bg} ${styles.text} ${styles.border}
        ${onClick ? 'cursor-pointer hover:shadow-sm' : ''}
        ${isLocked ? 'ring-1 ring-slate-400 ring-offset-1' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Source indicator */}
      {source && (
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/60 text-[9px] font-bold">
          {sourceIcons[source]}
        </span>
      )}

      {/* Tag name */}
      <span className="max-w-[120px] truncate">{name}</span>

      {/* Section badge */}
      {section && isHovered && (
        <span className="rounded bg-white/50 px-1 text-[9px] uppercase tracking-wide opacity-70">
          {section}
        </span>
      )}

      {/* Confidence indicator */}
      {showConfidence && confidencePercent != null && (
        <span
          className={`
            rounded-full px-1.5 py-0.5 text-[10px] font-semibold
            ${confidencePercent >= 70 ? 'bg-emerald-200/50 text-emerald-800' : ''}
            ${confidencePercent >= 40 && confidencePercent < 70 ? 'bg-amber-200/50 text-amber-800' : ''}
            ${confidencePercent < 40 ? 'bg-red-200/50 text-red-800' : ''}
          `}
        >
          {confidencePercent}%
        </span>
      )}

      {/* Lock button */}
      {showLock && isLocked && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onUnlock?.()
          }}
          className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-300/50 text-[10px] hover:bg-slate-400/50"
          title="Unlock tag"
        >
          L
        </button>
      )}

      {showLock && !isLocked && isHovered && onLock && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onLock()
          }}
          className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200/50 text-[10px] hover:bg-slate-300/50"
          title="Lock tag (protect from regeneration)"
        >
          l
        </button>
      )}

      {/* Remove button */}
      {removable && isHovered && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.()
          }}
          className="flex h-4 w-4 items-center justify-center rounded-full bg-red-200/50 text-red-700 hover:bg-red-300/50"
          title={isLocked ? 'Force remove locked tag' : 'Remove tag'}
        >
          x
        </button>
      )}
    </span>
  )
}
