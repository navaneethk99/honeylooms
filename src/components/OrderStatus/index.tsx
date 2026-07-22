import { OrderStatus as StatusOptions } from '@/payload-types'
import { cn } from '@/utilities/cn'

type Props = {
  status: StatusOptions
  className?: string
}

export const OrderStatus: React.FC<Props> = ({ status, className }) => {
  return (
    <div
      className={cn('w-fit text-xs capitalize text-[#6c675d]', className, {
        'text-[#8a682f]': status === 'confirmed' || status === 'refund_requested',
        'text-[#456275]': status === 'shipped',
        'text-[#38624a]': status === 'completed' || status === 'refund_approved',
        'text-[#8a4b3c]':
          status === 'cancelled' || status === 'refunded' || status === 'refund_rejected',
      })}
    >
      {status?.replace('_', ' ')}
    </div>
  )
}
