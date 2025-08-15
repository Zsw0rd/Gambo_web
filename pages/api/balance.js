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
  // This endpoint only exposes read-only balance information. All balance
  // updates must occur inside game-specific API routes after outcomes are
  // verified, preventing clients from directly manipulating funds here.
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { sessionToken } = req.query
  if (!sessionToken) {
    return res.status(400).json({ error: 'Missing sessionToken' })
  }

  try {
    const userId = parseUserId(sessionToken)
    if (!userId) {
      return res.status(401).json({ error: 'Invalid or missing session token' })
    }

    // Find user in DB
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Return current balance only; no updates allowed.
    return res.status(200).json({ balance: user.balance })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
}
