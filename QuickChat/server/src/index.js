import 'dotenv/config'
import http from 'http'
import express from 'express'
import cors from 'cors'
import { Server } from 'socket.io'
import { Prisma } from '@prisma/client'
import { createGuestUser, ensureSeedUsers, getMessages, listUsers, loginUser, registerUser, saveMessage, updateUserProfile } from './db.js'

const app = express()
const server = http.createServer(app)

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

app.use(cors({ origin: CLIENT_ORIGIN }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.post('/api/guest', async (_req, res) => {
  try {
    const user = await createGuestUser()
    res.status(201).json(user)
  } catch (error) {
    res.status(500).json({ error: 'Failed to create guest user.' })
  }
})

app.post('/api/auth/register', async (req, res) => {
  const { displayName, email, password } = req.body || {}
  if (!displayName || !email || !password) {
    res.status(400).json({ error: 'displayName, email, and password are required.' })
    return
  }

  try {
    const user = await registerUser({ displayName, email, password })
    res.status(201).json(user)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ error: 'Email already exists.' })
      return
    }
    res.status(500).json({ error: 'Register failed.' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required.' })
    return
  }

  try {
    const user = await loginUser({ email, password })
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials.' })
      return
    }
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: 'Login failed.' })
  }
})

app.get('/api/users', async (req, res) => {
  try {
    const { exclude } = req.query
    const users = await listUsers(exclude)
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users.' })
  }
})

app.get('/api/messages', async (req, res) => {
  const { userId, peerId } = req.query
  if (!userId || !peerId) {
    res.status(400).json({ error: 'userId and peerId are required.' })
    return
  }

  try {
    const messages = await getMessages(userId, peerId)
    res.json(messages)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages.' })
  }
})

app.patch('/api/profile', async (req, res) => {
  const { userId, displayName, bio, avatarKey } = req.body || {}
  if (!userId) {
    res.status(400).json({ error: 'userId is required.' })
    return
  }

  if (displayName !== undefined && !String(displayName).trim()) {
    res.status(400).json({ error: 'displayName cannot be empty.' })
    return
  }

  try {
    const user = await updateUserProfile({
      userId,
      displayName,
      bio,
      avatarKey
    })
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile.' })
  }
})

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN
  }
})

const onlineUsers = new Map()

const broadcastPresence = () => {
  io.emit('presence:update', {
    onlineUserIds: Array.from(onlineUsers.keys())
  })
}

io.on('connection', (socket) => {
  socket.on('register', ({ userId }) => {
    if (!userId) return
    socket.data.userId = userId
    socket.join(`user:${userId}`)
    onlineUsers.set(userId, (onlineUsers.get(userId) || 0) + 1)
    broadcastPresence()
  })

  socket.on('message:send', async (payload) => {
    const { fromUserId, toUserId, text, imageUrl } = payload || {}
    if (!fromUserId || !toUserId) return
    if (!text && !imageUrl) return
    if (typeof imageUrl === 'string' && imageUrl.length > 700000) {
      socket.emit('message:error', { error: 'Image is too large. Please choose a smaller image.' })
      return
    }

    try {
      const message = await saveMessage({ fromUserId, toUserId, text, imageUrl })
      io.to(`user:${fromUserId}`).to(`user:${toUserId}`).emit('message:new', {
        ...message,
        receiverId: toUserId
      })
    } catch (error) {
      console.error('message:send failed', {
        fromUserId,
        toUserId,
        hasText: Boolean(text),
        hasImage: Boolean(imageUrl),
        code: error?.code,
        error: error?.message
      })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2000') {
          socket.emit('message:error', { error: 'Image is too large. Please choose a smaller image.' })
          return
        }

        if (error.code === 'P2003') {
          socket.emit('message:error', { error: 'Invalid sender/receiver. Please re-login and try again.' })
          return
        }

        if (error.code === 'P2022') {
          socket.emit('message:error', { error: 'Database schema is out of sync. Please contact support.' })
          return
        }
      }

      const details = String(error?.message || '')
      if (details.includes('P2000') || details.toLowerCase().includes('value too long')) {
        socket.emit('message:error', { error: 'Image is too large. Please choose a smaller image.' })
        return
      }

      socket.emit('message:error', {
        error: `Failed to send message. ${error?.message || 'Please try again.'}`
      })
    }
  })

  socket.on('disconnect', () => {
    const userId = socket.data.userId
    if (!userId) return
    const count = (onlineUsers.get(userId) || 1) - 1
    if (count <= 0) {
      onlineUsers.delete(userId)
    } else {
      onlineUsers.set(userId, count)
    }
    broadcastPresence()
  })
})

const PORT = process.env.PORT || 5000

server.listen(PORT, async () => {
  await ensureSeedUsers()
  console.log(`QuickChat server listening on ${PORT}`)
})
