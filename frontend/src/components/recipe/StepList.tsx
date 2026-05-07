import { Timer } from 'lucide-react'
import type { RecipeStep } from '@/types/models'

interface StepListProps {
  steps: RecipeStep[]
}

export function StepList({ steps }: StepListProps) {
  const sorted = [...steps].sort((a, b) => a.orderIndex - b.orderIndex)

  return (
    <ol className="space-y-6">
      {sorted.map((step, i) => (
        <li key={step.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent text-sm font-medium text-white">
              {i + 1}
            </span>
            {i < sorted.length - 1 && <div className="w-px flex-1 bg-border mt-2" />}
          </div>
          <div className="flex-1 pb-6">
            {step.title && (
              <h3 className="font-medium text-text mb-1">{step.title}</h3>
            )}
            <p className="text-sm text-text-secondary leading-relaxed">{step.content}</p>
            {step.durationMin && step.durationMin > 0 && (
              <span className="mt-2 inline-flex items-center gap-1 text-xs text-muted">
                <Timer className="h-3.5 w-3.5" />
                {step.durationMin} min
              </span>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
