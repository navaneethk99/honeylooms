import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const AccountVerifications: CollectionConfig = {
  slug: 'account-verifications',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  admin: {
    group: 'Users',
    hidden: true,
  },
  fields: [
    { name: 'email', type: 'email', required: true, unique: true },
    { name: 'name', type: 'text', required: true },
    { name: 'encryptedPassword', type: 'text', required: true },
    { name: 'encryptedOtp', type: 'text', required: true },
    { name: 'otpHash', type: 'text', required: true },
    { name: 'otpAttempts', type: 'number', defaultValue: 0, min: 0, required: true },
    { name: 'expiresAt', type: 'date', required: true },
  ],
}
