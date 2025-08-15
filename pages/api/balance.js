// pages/api/balance.js
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  if (!user.verified) {
    return res.status(403).json({ error: 'Email not verified' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action, amount } = req.body
  if (!action) {
    return res.status(400).json({ error: 'Missing action' })
  }

  try {
    if (action === 'get') {
      return res.status(200).json({ balance: user.balance })
    } else if (action === 'update') {
      if (typeof amount !== 'number') {
        return res.status(400).json({ error: 'Amount must be a number' })
      }
      const newBalance = user.balance + amount
      if (newBalance < 0) {
        return res.status(400).json({ error: 'Insufficient funds!' })
      }

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { balance: newBalance }
      })
      return res.status(200).json({ balance: updatedUser.balance })
    } else {
      return res.status(400).json({ error: 'Unknown balance action' })
    }
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
}
