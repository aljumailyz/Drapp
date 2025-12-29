import { useState, useRef, useEffect, type ReactNode } from 'react'

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  position?: TooltipPosition
  delay?: number
  maxWidth?: number
  disabled?: boolean
}

export default function Tooltip({
  content,
  children,
  position = 'top',
  delay = 300,
  maxWidth = 280,
  disabled = false
}: TooltipProps): JSX.Element {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const showTooltip = () => {
    if (disabled) return
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsVisible(false)
  }

  useEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) return

    const trigger = triggerRef.current.getBoundingClientRect()
    const tooltip = tooltipRef.current.getBoundingClientRect()
    const padding = 8

    let x = 0
    let y = 0

    switch (position) {
      case 'top':
        x = trigger.left + trigger.width / 2 - tooltip.width / 2
        y = trigger.top - tooltip.height - padding
        break
      case 'bottom':
        x = trigger.left + trigger.width / 2 - tooltip.width / 2
        y = trigger.bottom + padding
        break
      case 'left':
        x = trigger.left - tooltip.width - padding
        y = trigger.top + trigger.height / 2 - tooltip.height / 2
        break
      case 'right':
        x = trigger.right + padding
        y = trigger.top + trigger.height / 2 - tooltip.height / 2
        break
    }

    // Keep tooltip within viewport
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    if (x < padding) x = padding
    if (x + tooltip.width > viewportWidth - padding) x = viewportWidth - tooltip.width - padding
    if (y < padding) y = padding
    if (y + tooltip.height > viewportHeight - padding) y = viewportHeight - tooltip.height - padding

    setCoords({ x, y })
  }, [isVisible, position])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const arrowPosition = {
    top: 'bottom-[-6px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-slate-800',
    bottom: 'top-[-6px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-slate-800',
    left: 'right-[-6px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-slate-800',
    right: 'left-[-6px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-slate-800'
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            left: coords.x,
            top: coords.y,
            maxWidth,
            zIndex: 9999
          }}
          className="pointer-events-none"
        >
          <div className="relative rounded-lg bg-slate-800 px-3 py-2 text-sm text-white shadow-lg">
            {content}
            <div
              className={`absolute h-0 w-0 border-[6px] ${arrowPosition[position]}`}
            />
          </div>
        </div>
      )}
    </>
  )
}

// InfoTooltip - a tooltip with an info icon trigger
interface InfoTooltipProps {
  content: ReactNode
  position?: TooltipPosition
}

export function InfoTooltip({ content, position = 'top' }: InfoTooltipProps): JSX.Element {
  return (
    <Tooltip content={content} position={position}>
      <span className="ml-1.5 inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-500 hover:bg-slate-300">
        ?
      </span>
    </Tooltip>
  )
}

// Tooltip content components for rich tooltips
interface TooltipHeadingProps {
  children: ReactNode
}

export function TooltipHeading({ children }: TooltipHeadingProps): JSX.Element {
  return <p className="mb-1 font-semibold text-white">{children}</p>
}

interface TooltipTextProps {
  children: ReactNode
}

export function TooltipText({ children }: TooltipTextProps): JSX.Element {
  return <p className="text-slate-300">{children}</p>
}

interface TooltipListProps {
  items: string[]
  type?: 'pros' | 'cons' | 'neutral'
}

export function TooltipList({ items, type = 'neutral' }: TooltipListProps): JSX.Element {
  const bulletColor = {
    pros: 'text-emerald-400',
    cons: 'text-red-400',
    neutral: 'text-slate-400'
  }

  const bulletChar = {
    pros: '+',
    cons: '-',
    neutral: '•'
  }

  return (
    <ul className="mt-1 space-y-0.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-1.5 text-slate-300">
          <span className={`${bulletColor[type]} font-mono`}>{bulletChar[type]}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
