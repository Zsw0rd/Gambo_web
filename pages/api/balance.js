// pages/api/balance.js
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// simple function to parse the userId from the "token-<id>-<timestamp>"
function parseUserId(token) {
  if (!token.startsWith('token-')) return null;
  // Remove the "token-" prefix:
  const withoutPrefix = token.slice(6);
  // Find the last hyphen to separate the UUID from the timestamp:
  const lastHyphenIndex = withoutPrefix.lastIndexOf('-');
  if (lastHyphenIndex === -1) return null;
  return withoutPrefix.substring(0, lastHyphenIndex);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action, sessionToken, amount } = req.body
  if (!action || !sessionToken) {
    return res.status(400).json({ error: 'Missing action or sessionToken' })
  }

  try {
    const userId = parseUserId(sessionToken)
    if (!userId) {
      return res.status(401).json({ error: 'Invalid or missing session token' })
    }

    // find user in DB
    const user = await prisma.user.findUnique({ where: { id: userId }});
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (action === 'get') {
      // simply return current balance
      return res.status(200).json({ balance: user.balance })
    }
    else if (action === 'update') {
      // we add "amount" => could be positive or negative
      if (typeof amount !== 'number') {
        return res.status(400).json({ error: 'Amount must be a number' })
      }
      const newBalance = user.balance + amount
      if (newBalance < 0) {
        return res.status(400).json({ error: 'Insufficient funds!' })
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { balance: newBalance }
      })
      return res.status(200).json({ balance: updatedUser.balance })
    }
    else {
      return res.status(400).json({ error: 'Unknown balance action' })
    }
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
}
