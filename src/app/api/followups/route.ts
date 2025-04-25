import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma' // Using the singleton instance from lib/prisma

// GET /api/followups
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('leadId')
    const completed = searchParams.get('completed') === 'true'
    const upcoming = searchParams.get('upcoming') === 'true'
    
    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { phone: session.user.phone }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const where: any = {}
    
    // Filter by lead if provided
    if (leadId) {
      where.leadId = leadId
    }
    
    // Filter by completion status if provided
    if (searchParams.has('completed')) {
      where.completed = completed
    }
    
    // For upcoming reminders (for today and future)
    if (upcoming) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      where.reminderDate = {
        gte: today
      }
    }
    
    // Determine which follow-ups to show based on user role
    if (session.user.role === 'SUPER_ADMIN') {
      // Super admin can see all follow-ups
    } else if (session.user.role === 'LEAD_BROKER') {
      // Lead broker can see follow-ups from their company
      where.lead = {
        company: {
          leadBrokerId: currentUser.id
        }
      }
    } else {
      // Sub-broker can see their own follow-ups and those of their reportees
      const getAllSubBrokerIds = async (brokerId: string): Promise<string[]> => {
        const directSubBrokers = await prisma.user.findMany({
          where: { managerId: brokerId }
        })
        
        if (directSubBrokers.length === 0) {
          return []
        }
        
        const directIds = directSubBrokers.map(broker => broker.id)
        const nestedIds = await Promise.all(
          directIds.map(id => getAllSubBrokerIds(id))
        )
        
        return [...directIds, ...nestedIds.flat()]
      }
      
      const subBrokerIds = await getAllSubBrokerIds(currentUser.id)
      
      where.userId = {
        in: [currentUser.id, ...subBrokerIds]
      }
    }

    const followUps = await prisma.followUp.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            phone: true,
            status: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      },
      orderBy: {
        reminderDate: 'asc'
      }
    })

    return NextResponse.json(followUps)
  } catch (error) {
    console.error('Error fetching follow-ups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch follow-ups' },
      { status: 500 }
    )
  }
}

// POST /api/followups
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { leadId, notes, reminderDate, completed = false } = body

    // Validate input
    if (!leadId || !notes || !reminderDate) {
      return NextResponse.json(
        { error: 'Lead ID, notes, and reminder date are required' },
        { status: 400 }
      )
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { phone: session.user.phone }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify the lead exists and user has access to it
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { company: true }
    })

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this lead
    if (session.user.role !== 'SUPER_ADMIN') {
      // Get user's company
      const user = await prisma.user.findUnique({
        where: { id: currentUser.id },
        include: { company: true }
      })

      if (!user?.company || user.company.id !== lead.companyId) {
        return NextResponse.json(
          { error: 'You do not have access to this lead' },
          { status: 403 }
        )
      }
    }

    // Create the follow-up
    const followUp = await prisma.followUp.create({
      data: {
        notes,
        reminderDate: new Date(reminderDate),
        completed,
        lead: {
          connect: { id: leadId }
        },
        user: {
          connect: { id: currentUser.id }
        }
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            phone: true,
            status: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    })

    return NextResponse.json(followUp)
  } catch (error) {
    console.error('Error creating follow-up:', error)
    return NextResponse.json(
      { error: 'Failed to create follow-up' },
      { status: 500 }
    )
  }
}
