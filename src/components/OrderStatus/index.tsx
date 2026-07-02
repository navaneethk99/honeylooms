import { OrderStatus as StatusOptions } from '@/payload-types'
import { cn } from '@/utilities/cn'

type Props = {
  status: StatusOptions
  className?: string
}

export const OrderStatus: React.FC<Props> = ({ status, className }) => {
  return (
    <div
      className={cn(
        'text-xs tracking-widest font-mono uppercase py-0.5 px-2 rounded w-fit',
        className,
        {
          'bg-primary/10': status === 'processing',
          'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300': status === 'confirmed',
          'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300': status === 'shipped',
          'bg-success': status === 'completed',
          'bg-destructive/10 text-destructive': status === 'cancelled' || status === 'refunded',
        },
      )}
    >
      {status}
    </div>
  )
}
