// pages/api/auth.js
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()
const DAILY_BONUS = 100

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action, username, email, password } = req.body
  if (!action) {
    return res.status(400).json({ error: 'Missing action parameter' })
  }

  try {
    if (action === 'signup') {
      // Validate user input
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields (username,email,password) required' })
      }

      // Check if username or email is already in use
      const existingUser = await prisma.user.findUnique({ where: { username } })
      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' })
      }
      const existingEmail = await prisma.user.findUnique({ where: { email } })
      if (existingEmail) {
        return res.status(400).json({ error: 'Email already in use' })
      }

      // Hash password
      const hashed = await bcrypt.hash(password, 10)

      // Create user with some default balance (e.g., 1000)
      const newUser = await prisma.user.create({
        data: {
          username,
          email,
          password: hashed,
          balance: 1000
        }
      })

      // Build a "fake" session token. 
      const sessionToken = `token-${foundUser.id}-${Date.now()}`

      return res.status(200).json({
        message: 'Signup successful',
        sessionToken,
        username: newUser.username,
        balance: newUser.balance
      })
    }

    else if (action === 'login') {
      // Must provide email & password
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' })
      }

      // Find user by email
      const foundUser = await prisma.user.findUnique({
        where: { email }
      })
      if (!foundUser) {
        // No user with that email
        return res.status(400).json({ error: 'No user found with that email' })
      }

      // Compare password
      const match = await bcrypt.compare(password, foundUser.password)
      if (!match) {
        // Wrong password
        return res.status(401).json({ error: 'Invalid password' })
      }

      // Build a "fake" session token
      const sessionToken = `token-${foundUser.id}-${Date.now()}`

      // Daily bonus processing
      const now = new Date()
      let awarded = 0
      if (!foundUser.lastLogin || new Date(foundUser.lastLogin).toDateString() !== now.toDateString()) {
        awarded = DAILY_BONUS
      }

      const dataToUpdate = { lastLogin: now }
      if (awarded > 0) {
        dataToUpdate.balance = { increment: awarded }
        dataToUpdate.dailyBonusClaimed = false
      }

      const updatedUser = await prisma.user.update({
        where: { id: foundUser.id },
        data: dataToUpdate
      })

      return res.status(200).json({
        message: 'Login successful',
        sessionToken,
        username: updatedUser.username,
        balance: updatedUser.balance,
        awarded
      })
    }

    else if (action === 'logout') {
      // Minimal example => do nothing on server
      return res.status(200).json({ message: 'Logged out' })
    }

    else {
      return res.status(400).json({ error: 'Unknown action' })
    }
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
}
