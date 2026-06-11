import { useEffect, useCallback } from 'react'
import { useSocket } from '../context/SocketContext'

/**
 * Subscribe to a socket event and auto-remove listener on unmount.
 *
 * Usage:
 *   useSocketEvent('race:update', (data) => { ... })
 */
export function useSocketEvent(event, handler) {
  const { socket } = useSocket()

  useEffect(() => {
    if (!socket) return
    socket.on(event, handler)
    return () => socket.off(event, handler)
  }, [socket, event, handler])
}

/**
 * Returns a stable emit function.
 *
 * Usage:
 *   const emit = useSocketEmit()
 *   emit('room:join', { code })
 */
export function useSocketEmit() {
  const { socket } = useSocket()

  return useCallback((event, data) => {
    if (socket?.connected) socket.emit(event, data)
  }, [socket])
}
