import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const CareerApplications: CollectionConfig = {
  slug: 'career-applications',
  labels: {
    singular: 'Application',
    plural: 'Applications',
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['job', 'status', 'createdAt'],
    group: 'Careers',
    useAsTitle: 'id',
  },
  fields: [
    {
      name: 'job',
      type: 'relationship',
      relationTo: 'job-postings',
      required: true,
    },
    {
      name: 'responses',
      type: 'array',
      label: 'Responses',
      admin: {
        readOnly: true,
      },
      fields: [
        {
          name: 'question',
          type: 'text',
          required: true,
        },
        {
          name: 'answer',
          type: 'textarea',
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      required: true,
      options: [
        { label: 'New', value: 'new' },
        { label: 'Reviewing', value: 'reviewing' },
        { label: 'Shortlisted', value: 'shortlisted' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Hired', value: 'hired' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'internalNotes',
      type: 'textarea',
      admin: {
        description: 'Visible only to administrators.',
      },
    },
  ],
  timestamps: true,
}
