import * as migration_20260723_180000_add_order_code from './20260723_180000_add_order_code'
import * as migration_20260723_181500_enforce_order_code_format from './20260723_181500_enforce_order_code_format'

export const migrations = [
  {
    down: migration_20260723_180000_add_order_code.down,
    name: '20260723_180000_add_order_code',
    up: migration_20260723_180000_add_order_code.up,
  },
  {
    down: migration_20260723_181500_enforce_order_code_format.down,
    name: '20260723_181500_enforce_order_code_format',
    up: migration_20260723_181500_enforce_order_code_format.up,
  },
]
