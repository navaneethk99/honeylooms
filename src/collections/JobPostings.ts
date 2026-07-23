import { slugField } from 'payload'
import type { CollectionConfig, Where } from 'payload'

import { adminOnly } from '@/access/adminOnly'

const revalidateCareers = ({ doc, req: { payload } }: any) => {
  try {
    const { revalidatePath } = require('next/cache')
    revalidatePath('/careers')
  } catch (error) {
    payload.logger.error(`Unable to revalidate careers: ${error}`)
  }

  return doc
}

export const JobPostings: CollectionConfig = {
  slug: 'job-postings',
  labels: {
    singular: 'Job Posting',
    plural: 'Job Postings',
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: ({ req }) => {
      if (adminOnly({ req })) return true

      const publicFilter: Where = {
        and: [
          {
            active: {
              equals: true,
            },
          },
          {
            or: [
              {
                closingDate: {
                  exists: false,
                },
              },
              {
                closingDate: {
                  greater_than_equal: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
                },
              },
            ],
          },
        ],
      }

      return publicFilter
    },
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['title', 'department', 'location', 'employmentType', 'active', 'closingDate'],
    group: 'Careers',
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'department',
      type: 'text',
      required: true,
    },
    {
      name: 'location',
      type: 'text',
      admin: {
        placeholder: 'e.g. Kolkata, India or Remote',
      },
    },
    {
      name: 'employmentType',
      type: 'select',
      options: [
        { label: 'Full-time', value: 'full-time' },
        { label: 'Part-time', value: 'part-time' },
        { label: 'Contract', value: 'contract' },
        { label: 'Internship', value: 'internship' },
      ],
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
    },
    {
      name: 'questions',
      type: 'array',
      label: 'Application questions',
      labels: {
        singular: 'Question',
        plural: 'Questions',
      },
      admin: {
        description: 'Questions are shown in this position’s application form in this order.',
      },
      fields: [
        {
          name: 'question',
          type: 'text',
          required: true,
        },
        {
          name: 'fieldType',
          type: 'select',
          defaultValue: 'shortText',
          required: true,
          options: [
            { label: 'Short text', value: 'shortText' },
            { label: 'Long text', value: 'longText' },
            { label: 'Email', value: 'email' },
            { label: 'Phone', value: 'phone' },
            { label: 'URL', value: 'url' },
            { label: 'Dropdown', value: 'select' },
          ],
        },
        {
          name: 'required',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'placeholder',
          type: 'text',
        },
        {
          name: 'options',
          type: 'array',
          label: 'Dropdown options',
          admin: {
            condition: (_, siblingData) => siblingData?.fieldType === 'select',
          },
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
    },
    {
      name: 'closingDate',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
        description: 'Optional. The role is hidden from the careers page after this date.',
        position: 'sidebar',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Lower numbers appear first.',
        position: 'sidebar',
      },
    },
    slugField({
      required: false,
    }),
  ],
  hooks: {
    afterChange: [revalidateCareers],
    afterDelete: [revalidateCareers],
  },
  timestamps: true,
}
