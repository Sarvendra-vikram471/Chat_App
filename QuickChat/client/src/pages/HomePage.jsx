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
  const [unreadCounts, setUnreadCounts] = React.useState({});
  const [mutedUserIds, setMutedUserIds] = React.useState(new Set());
  const [blockedUserIds, setBlockedUserIds] = React.useState(new Set());
  const [onlineUsers, setOnlineUsers] = React.useState(new Set());
  const [chatError, setChatError] = React.useState('');
  const socketRef = React.useRef(null);
  const selectedUserRef = React.useRef(null);
  const mutedUserIdsRef = React.useRef(new Set());
  const blockedUserIdsRef = React.useRef(new Set());
  const lastOpenedMapRef = React.useRef({});
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
    const muted = JSON.parse(localStorage.getItem('qc_muted_user_ids') || '[]')
    const blocked = JSON.parse(localStorage.getItem('qc_blocked_user_ids') || '[]')
    const lastOpened = JSON.parse(localStorage.getItem('qc_last_opened_map') || '{}')
    setMutedUserIds(new Set(Array.isArray(muted) ? muted : []))
    setBlockedUserIds(new Set(Array.isArray(blocked) ? blocked : []))
    lastOpenedMapRef.current =
      lastOpened && typeof lastOpened === 'object' && !Array.isArray(lastOpened) ? lastOpened : {}
  }, [])

  React.useEffect(() => {
    mutedUserIdsRef.current = mutedUserIds
  }, [mutedUserIds])

  React.useEffect(() => {
    blockedUserIdsRef.current = blockedUserIds
  }, [blockedUserIds])

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

    socket.on('message:error', (payload) => {
      setChatError(payload?.error || 'Failed to send message.')
    })

    socket.on('message:new', (payload) => {
      setChatError('')
      const activeUser = selectedUserRef.current
      const senderId = payload?.senderId
      const isIncoming = senderId && senderId !== currentUser.id

      if (senderId && blockedUserIdsRef.current.has(senderId)) {
        return
      }

      const isForActiveChat =
        Boolean(activeUser) &&
        (payload.senderId === activeUser.id || payload.receiverId === activeUser.id)

      if (isForActiveChat) {
        setMessages((prev) => [...prev, payload])
        return
      }

      if (isIncoming && !mutedUserIdsRef.current.has(senderId)) {
        setUnreadCounts((prev) => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1
        }))
      }
    })

    socket.on('connect_error', () => {
      setChatError('Connection lost. Please try again.')
    })

    return () => {
      socket.disconnect()
    }
  }, [currentUser])

  React.useEffect(() => {
    selectedUserRef.current = selectedUser
    setChatError('')
    if (selectedUser?.id) {
      const nextLastOpened = {
        ...lastOpenedMapRef.current,
        [selectedUser.id]: Date.now()
      }
      lastOpenedMapRef.current = nextLastOpened
      localStorage.setItem('qc_last_opened_map', JSON.stringify(nextLastOpened))

      setUnreadCounts((prev) => {
        if (!prev[selectedUser.id]) return prev
        const next = { ...prev }
        delete next[selectedUser.id]
        return next
      })
    }
  }, [selectedUser])

  React.useEffect(() => {
    if (!currentUser || !selectedUser) return
    apiFetch(`/api/messages?userId=${currentUser.id}&peerId=${selectedUser.id}`)
      .then((data) => setMessages(data))
      .catch(() => setMessages([]))
  }, [currentUser, selectedUser])

  React.useEffect(() => {
    if (!currentUser || users.length === 0) return

    let cancelled = false

    const hydrateUnreadCounts = async () => {
      try {
        const counts = {}
        await Promise.all(
          users.map(async (user) => {
            if (blockedUserIdsRef.current.has(user.id) || mutedUserIdsRef.current.has(user.id)) return
            if (selectedUserRef.current?.id === user.id) return

            const data = await apiFetch(`/api/messages?userId=${currentUser.id}&peerId=${user.id}`)
            const lastOpenedAt = Number(lastOpenedMapRef.current[user.id] || 0)
            const unread = data.filter(
              (message) =>
                message.senderId === user.id && new Date(message.createdAt).getTime() > lastOpenedAt
            ).length

            if (unread > 0) counts[user.id] = unread
          })
        )

        if (!cancelled) {
          setUnreadCounts(counts)
        }
      } catch {
        if (!cancelled) {
          setUnreadCounts((prev) => prev)
        }
      }
    }

    hydrateUnreadCounts().catch(() => {})

    return () => {
      cancelled = true
    }
  }, [currentUser, users, mutedUserIds, blockedUserIds])

  const persistSet = (key, valueSet) => {
    localStorage.setItem(key, JSON.stringify(Array.from(valueSet)))
  }

  const toggleMuted = (userId) => {
    setMutedUserIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      persistSet('qc_muted_user_ids', next)
      return next
    })
  }

  const toggleBlocked = (userId) => {
    setBlockedUserIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      persistSet('qc_blocked_user_ids', next)
      return next
    })
  }

  const handleSendMessage = async ({ text, imageUrl }) => {
    if (!socketRef.current || !currentUser || !selectedUser) return
    if (blockedUserIds.has(selectedUser.id)) {
      setChatError('You blocked this user. Unblock to send messages.')
      return
    }
    setChatError('')
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
          unreadCounts={unreadCounts}
          onLogout={handleLogout}
          currentUser={currentUser}
        />
        <ChatContainer
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          currentUser={currentUser}
          messages={messages}
          onSendMessage={handleSendMessage}
          chatError={chatError}
          isBlocked={Boolean(selectedUser && blockedUserIds.has(selectedUser.id))}
        />
        <RightSidebar
          selectedUser={selectedUser}
          messages={messages}
          isMuted={Boolean(selectedUser && mutedUserIds.has(selectedUser.id))}
          isBlocked={Boolean(selectedUser && blockedUserIds.has(selectedUser.id))}
          onToggleMute={toggleMuted}
          onToggleBlock={toggleBlocked}
        />
      </div>
    </div>
  )
}

export default HomePage
