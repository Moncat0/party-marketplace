/**
 * Strip read_at from messages when the reader has disabled read receipts,
 * so senders do not see "Läst" for that person. Unread clearing still uses read_at.
 */
export function applyReadReceiptPrivacy<
  T extends { sender_id: string; read_at: string | null },
>(
  messages: T[],
  viewerId: string,
  /** Other party in the thread — the one who may have read viewer's messages */
  otherUserId: string,
  otherAllowsReadReceipts: boolean
): T[] {
  if (otherAllowsReadReceipts) return messages

  return messages.map(m => {
    if (m.sender_id === viewerId && m.read_at) {
      return { ...m, read_at: null }
    }
    return m
  })
}
