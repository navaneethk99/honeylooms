import { OrderStatus } from '@/components/OrderStatus'
import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { Order } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'
import Link from 'next/link'

type Props = {
  order: Order
}

export const OrderItem: React.FC<Props> = ({ order }) => {
  const itemsLabel = order.items?.length === 1 ? 'Item' : 'Items'

  return (
    <div className="border border-neutral-100 hover:border-neutral-300 dark:border-neutral-900 dark:hover:border-neutral-800 bg-background p-6 transition-all duration-300 flex flex-col sm:flex-row gap-6 sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3 grow min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-400 dark:text-neutral-500">
            {`#${order.id}`}
          </span>
          {order.status && <OrderStatus status={order.status} />}
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
            <time dateTime={order.createdAt}>
              {formatDateTime({ date: order.createdAt, format: 'MMMM dd, yyyy' })}
            </time>
          </p>

          <p className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-sans">
            <span>
              {order.items?.length} {itemsLabel}
            </span>
            {order.amount && (
              <>
                <span>•</span>
                <Price as="span" className="font-mono" amount={order.amount} currencyCode={order.currency ?? undefined} />
              </>
            )}
          </p>
        </div>
      </div>

      <Button
        variant="outline"
        asChild
        className="rounded-none self-start sm:self-auto hover:bg-neutral-50 dark:hover:bg-neutral-950 font-sans text-xs tracking-wider uppercase border-neutral-200 dark:border-neutral-800"
      >
        <Link href={`/orders/${order.id}`}>View Order</Link>
      </Button>
    </div>
  )
}
