import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/users/subbrokers
// Fetch all subbrokers for the current lead broker
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only lead brokers should be able to access this endpoint
    if (session.user.role !== 'LEAD_BROKER') {
      return NextResponse.json(
        { error: 'Forbidden. Only lead brokers can access this information.' },
        { status: 403 }
      )
    }

    // Get current user (lead broker)
    const currentUser = await prisma.user.findUnique({
      where: { phone: session.user.phone }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get all subbrokers that report to this lead broker
    const subbrokers = await prisma.user.findMany({
      where: {
        role: 'SUB_BROKER',
        managerId: currentUser.id
      },
      select: {
        id: true,
        name: true,
        phone: true,
        _count: {
          select: {
            leads: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(subbrokers)
  } catch (error) {
    console.error('Error fetching subbrokers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subbrokers' },
      { status: 500 }
    )
  }
}
