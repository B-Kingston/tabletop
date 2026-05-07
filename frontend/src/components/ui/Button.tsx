import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-all duration-150 ease-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-accent text-white shadow-soft hover:bg-accent/90',
        secondary: 'bg-surface text-text border border-border hover:bg-surface-secondary',
        ghost: 'text-text-secondary hover:bg-surface-secondary hover:text-text',
        outline: 'border border-border bg-transparent hover:bg-surface-secondary',
        warm: 'bg-accent-surface text-accent hover:bg-accent/10',
      },
      size: {
        sm: 'h-8 px-4 text-xs',
        default: 'h-10 px-5 py-2.5',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10 p-2',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
