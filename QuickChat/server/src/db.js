import bcrypt from 'bcryptjs'
import prisma from './prisma.js'

const seedUsers = [
  { displayName: 'Caroline Gray', email: 'caroline@quickchat.dev', avatarKey: 'profile_alison' },
  { displayName: 'Alexander Wilson', email: 'alexander@quickchat.dev', avatarKey: 'profile_marco' }
]

const removedSeedEmails = ['matthew@quickchat.dev', 'carmen@quickchat.dev', 'presley@quickchat.dev']
const orderPair = (a, b) => (a < b ? [a, b] : [b, a])

const toUserDto = (user) => ({
  id: user.id,
  displayName: user.displayName,
  avatarKey: user.avatarKey,
  bio: user.bio
})

const toMessageDto = (message) => ({
  id: message.id,
  senderId: message.senderId,
  text: message.text,
  imageUrl: message.imageUrl,
  createdAt: message.createdAt
})

export const createGuestUser = async () => {
  const guestSuffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  const user = await prisma.user.create({
    data: {
      displayName: `Guest ${guestSuffix}`,
      email: `guest_${Math.random().toString(36).slice(2, 8)}@quickchat.local`,
      avatarKey: null,
      bio: 'Hi Everyone, I am using QuickChat'
    }
  })

  return toUserDto(user)
}

export const listUsers = async (excludeId) => {
  const users = await prisma.user.findMany({
    where: excludeId ? { id: { not: excludeId } } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 50
  })
  return users.map(toUserDto)
}

export const registerUser = async ({ displayName, email, password }) => {
  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      displayName,
      email,
      avatarKey: null,
      bio: 'Hi Everyone, I am using QuickChat',
      passwordHash
    }
  })

  return toUserDto(user)
}

export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user || !user.passwordHash) return null

  const match = await bcrypt.compare(password, user.passwordHash)
  if (!match) return null

  return toUserDto(user)
}

export const ensureSeedUsers = async () => {
  const passwordHash = await bcrypt.hash('quickchat123', 10)

  await prisma.user.deleteMany({
    where: {
      email: { in: removedSeedEmails }
    }
  })

  await prisma.user.deleteMany({
    where: {
      displayName: 'Carmen Jacobson'
    }
  })

  await Promise.all(
    seedUsers.map((seed) =>
      prisma.user.upsert({
        where: { email: seed.email },
        create: {
          displayName: seed.displayName,
          email: seed.email,
          avatarKey: seed.avatarKey,
          bio: 'Hi Everyone, I am using QuickChat',
          passwordHash
        },
        update: {
          displayName: seed.displayName,
          avatarKey: seed.avatarKey
        }
      })
    )
  )
}

export const updateUserProfile = async ({ userId, displayName, bio, avatarKey }) => {
  const normalizedDisplayName =
    typeof displayName === 'string' ? displayName.trim() || undefined : undefined
  const normalizedBio = typeof bio === 'string' ? bio.trim() || null : undefined

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      displayName: normalizedDisplayName,
      bio: normalizedBio,
      avatarKey: avatarKey || null
    }
  })

  return toUserDto(user)
}

const findConversation = async (userId, peerId) => {
  const [userAId, userBId] = orderPair(userId, peerId)
  return prisma.conversation.findUnique({
    where: {
      userAId_userBId: {
        userAId,
        userBId
      }
    }
  })
}

const getOrCreateConversation = async (userId, peerId) => {
  const [userAId, userBId] = orderPair(userId, peerId)

  const conversation = await prisma.conversation.upsert({
    where: {
      userAId_userBId: {
        userAId,
        userBId
      }
    },
    create: {
      userAId,
      userBId
    },
    update: {}
  })

  return conversation.id
}

export const getMessages = async (userId, peerId) => {
  const conversation = await findConversation(userId, peerId)
  if (!conversation) return []

  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'asc' }
  })

  return messages.map(toMessageDto)
}

export const saveMessage = async ({ fromUserId, toUserId, text, imageUrl }) => {
  const conversationId = await getOrCreateConversation(fromUserId, toUserId)

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: fromUserId,
      text: text || null,
      imageUrl: imageUrl || null
    }
  })

  return toMessageDto(message)
}
