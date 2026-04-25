import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  max?: number
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function StarRating({ value, onChange, max = 5, readonly = false, size = 'md' }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  function handleClick(rating: number) {
    if (readonly || !onChange) return
    onChange(rating === value ? 0 : rating)
  }

  function handleMouseEnter(rating: number) {
    if (readonly) return
    setHoverValue(rating)
  }

  function handleMouseLeave() {
    if (readonly) return
    setHoverValue(null)
  }

  const displayValue = hoverValue ?? value

  return (
    <div className="flex items-center gap-0.5" role="group" aria-label={`Rating: ${value} out of ${max} stars`}>
      {Array.from({ length: max }).map((_, i) => {
        const starIndex = i + 1
        const filled = starIndex <= Math.floor(displayValue)
        const halfFilled = !filled && starIndex === Math.ceil(displayValue) && displayValue % 1 >= 0.25

        return (
          <button
            key={i}
            type="button"
            className={cn(
              'relative focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-1 rounded-sm',
              readonly && 'cursor-default'
            )}
            onClick={() => handleClick(starIndex)}
            onMouseEnter={() => handleMouseEnter(starIndex)}
            onMouseLeave={handleMouseLeave}
            disabled={readonly}
            aria-label={`${starIndex} star${starIndex > 1 ? 's' : ''}`}
          >
            <Star
              className={cn(
                sizeClasses[size],
                'text-neutral-200 transition-colors'
              )}
            />
            {(filled || halfFilled) && (
              <Star
                className={cn(
                  sizeClasses[size],
                  'absolute inset-0 fill-amber-400 text-amber-400 transition-colors'
                )}
                style={halfFilled ? { clipPath: 'inset(0 50% 0 0)' } : undefined}
              />
            )}
          </button>
        )
      })}
      {value > 0 && (
        <span className="ml-1 text-sm text-neutral-500">{value.toFixed(1)}</span>
      )}
    </div>
  )
}
