import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

const SocketContext = createContext(null)

const SERVER_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3001'
  : 'https://velodrome.onrender.com'

export function SocketProvider({ children }) {
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const socket = io(SERVER_URL, { 
      autoConnect: true,
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('connect_error', (err) => console.error('Socket error:', err.message))

    return () => { socket.disconnect() }
  }, [])

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}