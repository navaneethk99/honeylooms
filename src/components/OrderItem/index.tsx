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
    <div className="flex flex-col gap-5 border-b border-[#24231f]/20 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 grow flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-[#6c675d]">{`#${order.id}`}</span>
          {order.status && <OrderStatus status={order.status} />}
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-base text-[#24231f]">
            <time dateTime={order.createdAt}>
              {formatDateTime({ date: order.createdAt, format: 'MMMM dd, yyyy' })}
            </time>
          </p>

          <p className="flex items-center gap-1.5 text-sm text-[#6c675d]">
            <span>
              {order.items?.length} {itemsLabel}
            </span>
            {order.amount && (
              <>
                <span>/</span>
                <Price as="span" amount={order.amount} currencyCode={order.currency ?? undefined} />
              </>
            )}
          </p>
        </div>
      </div>

      <Button
        asChild
        className="h-auto self-start rounded-none border-0 bg-transparent p-0 text-sm font-normal text-[#24231f] underline underline-offset-4 shadow-none hover:bg-transparent sm:self-auto"
        variant="link"
      >
        <Link href={`/orders/${order.id}`}>View order</Link>
      </Button>
    </div>
  )
}
