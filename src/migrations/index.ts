import * as migration_20260723_180000_add_order_code from './20260723_180000_add_order_code'
import * as migration_20260723_181500_enforce_order_code_format from './20260723_181500_enforce_order_code_format'
import * as migration_20260811_120000_add_user_email_verification from './20260811_120000_add_user_email_verification'
import * as migration_20260811_121000_add_account_verifications from './20260811_121000_add_account_verifications'
import * as migration_20260811_122000_preserve_pending_verification_otp from './20260811_122000_preserve_pending_verification_otp'
import * as migration_20260811_123000_limit_verification_otp_attempts from './20260811_123000_limit_verification_otp_attempts'

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
  {
    down: migration_20260811_120000_add_user_email_verification.down,
    name: '20260811_120000_add_user_email_verification',
    up: migration_20260811_120000_add_user_email_verification.up,
  },
  {
    down: migration_20260811_121000_add_account_verifications.down,
    name: '20260811_121000_add_account_verifications',
    up: migration_20260811_121000_add_account_verifications.up,
  },
  {
    down: migration_20260811_122000_preserve_pending_verification_otp.down,
    name: '20260811_122000_preserve_pending_verification_otp',
    up: migration_20260811_122000_preserve_pending_verification_otp.up,
  },
  {
    down: migration_20260811_123000_limit_verification_otp_attempts.down,
    name: '20260811_123000_limit_verification_otp_attempts',
    up: migration_20260811_123000_limit_verification_otp_attempts.up,
  },
]
