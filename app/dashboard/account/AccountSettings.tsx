'use client'

import AccountSettingsForm, {
  type AccountSettingsProps,
} from '@/components/settings/AccountSettingsForm'

/** Provider account settings — Airbnb-token UI via shared form. */
export default function AccountSettings(props: Omit<AccountSettingsProps, 'role'>) {
  return <AccountSettingsForm {...props} role="provider" />
}
