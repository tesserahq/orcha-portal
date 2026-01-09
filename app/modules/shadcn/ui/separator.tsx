import { cn } from '@shadcn/lib/utils'

interface IProps {
  className?: string
  orientation?: 'horizontal' | 'vertical'
}

export default function Separator({ className, orientation = 'horizontal' }: IProps) {
  return (
    <div
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className
      )}
    />
  )
}
