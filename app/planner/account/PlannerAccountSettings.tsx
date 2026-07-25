'use client'

import AccountSettingsForm, {
  type AccountSettingsProps,
} from '@/components/settings/AccountSettingsForm'

/** Planner account settings — Airbnb-token UI via shared form. */
export default function PlannerAccountSettings(props: Omit<AccountSettingsProps, 'role'>) {
  return <AccountSettingsForm {...props} role="planner" />
}
