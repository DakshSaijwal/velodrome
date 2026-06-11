import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SocketProvider } from './context/SocketContext'
import Home from './pages/Home'
import SinglePlayer from './pages/SinglePlayer'
import MultiPlayer from './pages/MultiPlayer'
import Leaderboard from './pages/Leaderboard'
import Stats from './pages/Stats'

export default function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/solo" element={<SinglePlayer />} />
          <Route path="/multi" element={<MultiPlayer />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/stats" element={<Stats />} />
        </Routes>
      </BrowserRouter>
    </SocketProvider>
  )
}
