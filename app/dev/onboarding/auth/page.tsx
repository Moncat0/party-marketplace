import { notFound } from 'next/navigation'
import AuthPreviewClient from './AuthPreviewClient'

export const metadata = { title: 'Dev — Auth preview' }

export default function DevAuthPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound()
  return <AuthPreviewClient />
}
