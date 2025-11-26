import { useCallback, useRef } from 'react'

interface UseLongPressOptions {
  onLongPress: () => void
  delay?: number
}

export function useLongPress({ onLongPress, delay = 500 }: UseLongPressOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isLongPressRef = useRef(false)

  const start = useCallback(() => {
    isLongPressRef.current = false
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      onLongPress()
    }, delay)
  }, [onLongPress, delay])

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const handleTouchStart = useCallback(() => {
    start()
  }, [start])

  const handleTouchEnd = useCallback(() => {
    clear()
  }, [clear])

  const handleTouchCancel = useCallback(() => {
    clear()
  }, [clear])

  const handleMouseDown = useCallback(() => {
    start()
  }, [start])

  const handleMouseUp = useCallback(() => {
    clear()
  }, [clear])

  const handleMouseLeave = useCallback(() => {
    clear()
  }, [clear])

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseLeave,
  }
}
