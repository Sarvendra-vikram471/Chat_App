import React from 'react'
import { io } from 'socket.io-client'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar';
import ChatContainer from '../components/ChatContainer';
import RightSidebar from '../components/RightSidebar';
import { apiFetch, API_BASE_URL } from '../lib/api'
import assets from '../assets/assets'

function HomePage() {
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [currentUser, setCurrentUser] = React.useState(null);
  const [users, setUsers] = React.useState([]);
  const [messages, setMessages] = React.useState([]);
  const [onlineUsers, setOnlineUsers] = React.useState(new Set());
  const socketRef = React.useRef(null);
  const selectedUserRef = React.useRef(null);
  const navigate = useNavigate();

  const avatarMap = React.useMemo(
    () => ({
      profile_martin: assets.profile_martin,
      profile_alison: assets.profile_alison,
      profile_enrique: assets.profile_enrique,
      profile_marco: assets.profile_marco,
      profile_richard: assets.profile_richard
    }),
    []
  )

  const hydrateUser = React.useCallback((user) => {
    if (!user) return null
    return {
      ...user,
      profilePic: avatarMap[user.avatarKey] || assets.avatar_icon
    }
  }, [avatarMap])

  React.useEffect(() => {
    const bootstrap = async () => {
      const cached = localStorage.getItem('qc_user')
      if (!cached) {
        navigate('/login')
        return
      }

      try {
        const parsed = JSON.parse(cached)
        if (!parsed?.id) {
          localStorage.removeItem('qc_user')
          navigate('/login')
          return
        }
        setCurrentUser(hydrateUser(parsed))
      } catch {
        localStorage.removeItem('qc_user')
        navigate('/login')
      }
    }

    bootstrap().catch(() => {})
  }, [hydrateUser, navigate])

  React.useEffect(() => {
    if (!currentUser) return
    apiFetch(`/api/users?exclude=${currentUser.id}`)
      .then((data) => setUsers(data.map(hydrateUser)))
      .catch(() => {})
  }, [currentUser, hydrateUser])

  React.useEffect(() => {
    if (!currentUser) return
    const socket = io(API_BASE_URL, {
      transports: ['websocket']
    })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('register', { userId: currentUser.id })
    })

    socket.on('presence:update', (payload) => {
      setOnlineUsers(new Set(payload.onlineUserIds || []))
    })

    socket.on('message:new', (payload) => {
      setMessages((prev) => {
        const activeUser = selectedUserRef.current
        if (!activeUser) return prev
        const isForActiveChat =
          payload.senderId === activeUser.id || payload.receiverId === activeUser.id
        if (!isForActiveChat) return prev
        return [...prev, payload]
      })
    })

    return () => {
      socket.disconnect()
    }
  }, [currentUser])

  React.useEffect(() => {
    selectedUserRef.current = selectedUser
  }, [selectedUser])

  React.useEffect(() => {
    if (!currentUser || !selectedUser) return
    apiFetch(`/api/messages?userId=${currentUser.id}&peerId=${selectedUser.id}`)
      .then((data) => setMessages(data))
      .catch(() => setMessages([]))
  }, [currentUser, selectedUser])

  const handleSendMessage = async ({ text, imageUrl }) => {
    if (!socketRef.current || !currentUser || !selectedUser) return
    socketRef.current.emit('message:send', {
      fromUserId: currentUser.id,
      toUserId: selectedUser.id,
      text,
      imageUrl
    })
  }

  const handleLogout = () => {
    localStorage.removeItem('qc_user')
    setCurrentUser(null)
    navigate('/login')
  }

  return (
    <div className='w-full min-h-screen px-4 py-6 sm:px-[10%] sm:py-[5%]'>
      <div
        className={`relative h-[calc(100vh-3rem)] sm:h-full rounded-2xl overflow-hidden border border-white/10 bg-[#0f1024]/60 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.45)] grid grid-cols-1 ${selectedUser ? 'md:grid-cols-[1fr_1.7fr_1fr] xl:grid-cols-[1fr_2fr_1fr]' : 'md:grid-cols-[1fr_2fr]'}`}
      >
        <Sidebar
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          users={users}
          onlineUsers={onlineUsers}
          onLogout={handleLogout}
          currentUser={currentUser}
        />
        <ChatContainer
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          currentUser={currentUser}
          messages={messages}
          onSendMessage={handleSendMessage}
        />
        <RightSidebar selectedUser={selectedUser} messages={messages} />
      </div>
    </div>
  )
}

export default HomePage
