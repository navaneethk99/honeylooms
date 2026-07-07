import type { CollectionConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'
import { sendRefundNotificationEmail } from '@/hooks/sendRefundNotificationEmail'
import { updateOrderStatusOnRefund } from '@/hooks/updateOrderStatusOnRefund'

export const Refunds: CollectionConfig = {
  slug: 'refunds',
  access: {
    create: () => true,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  hooks: {
    afterChange: [sendRefundNotificationEmail, updateOrderStatusOnRefund],
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['id', 'order', 'reason', 'status', 'createdAt'],
    group: 'Ecommerce',
  },
  fields: [
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      required: true,
    },
    {
      name: 'reason',
      type: 'select',
      required: true,
      options: [
        { label: 'Size Issue', value: 'size_issue' },
        { label: 'Manufacturing Defect', value: 'manufacturing_defect' },
      ],
    },
    {
      name: 'explanation',
      type: 'textarea',
      required: true,
    },
    {
      name: 'contactEmail',
      type: 'text',
      required: true,
    },
    {
      name: 'contactPhone',
      type: 'text',
      required: true,
    },
    {
      name: 'resolution',
      type: 'select',
      required: true,
      options: [
        { label: 'Refund to original payment method', value: 'original_payment' },
        { label: 'Replacement', value: 'replacement' },
      ],
    },
    {
      name: 'images',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
      admin: {
        readOnly: true,
        hidden: true,
      },
    },
    {
      name: 'imagesPreview',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/RefundImagesField#RefundImagesField',
        },
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending Review', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
  ],
  timestamps: true,
}
