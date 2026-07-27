/**
 * Lock page scroll without the classic “content jumps left” when the
 * scrollbar disappears. Restores previous inline styles on cleanup.
 */
export function lockBodyScroll(): () => void {
  const body = document.body
  const prevOverflow = body.style.overflow
  const prevPaddingRight = body.style.paddingRight

  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
  body.style.overflow = 'hidden'
  if (scrollbarWidth > 0) {
    body.style.paddingRight = `${scrollbarWidth}px`
  }

  return () => {
    body.style.overflow = prevOverflow
    body.style.paddingRight = prevPaddingRight
  }
}
