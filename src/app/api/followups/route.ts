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
    }    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('leadId')
    const userId = searchParams.get('userId') // Added userId filter
    const completed = searchParams.get('completed') === 'true'
    const reminderDateFilter = searchParams.get('reminderDate')
    
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
    
    // Filter by broker/user if provided
    if (userId) {
      // Check if the current user has permission to see the requested user's follow-ups
      if (session.user.role === 'SUB_BROKER' && userId !== currentUser.id) {
        return NextResponse.json(
          { error: 'You can only view your own follow-ups' },
          { status: 403 }
        )
      }
      
      // For lead brokers, ensure they can only see their own or their sub-brokers' follow-ups
      if (session.user.role === 'LEAD_BROKER' && userId !== currentUser.id) {
        const subBroker = await prisma.user.findFirst({
          where: {
            id: userId,
            managerId: currentUser.id
          }
        })
        
        if (!subBroker) {
          return NextResponse.json(
            { error: 'You can only view follow-ups for yourself or your sub-brokers' },
            { status: 403 }
          )
        }
      }
      
      where.userId = userId
    }
    
    // Filter by completion status if provided
    if (searchParams.has('completed')) {
      where.completed = completed
    }
    
    // Filter by reminder date
    if (reminderDateFilter === 'future') {
      // For upcoming reminders (today and future)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      where.reminderDate = {
        gte: today
      }
    } else if (reminderDateFilter === 'past') {
      // For past reminders
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      where.reminderDate = {
        lt: today
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
    }    const body = await request.json()
    const { leadId, notes, reminderDate, completed = false, assignedUserId } = body

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
    }    // If assignedUserId is provided, need to check if current user has permission to assign
    let assignToUserId = currentUser.id;
    
    if (assignedUserId) {
      // Check if the assigned user exists
      const assignedUser = await prisma.user.findUnique({
        where: { id: assignedUserId },
        include: { company: true }
      });
      
      if (!assignedUser) {
        return NextResponse.json(
          { error: 'Assigned user not found' },
          { status: 404 }
        );
      }
      
      // Check permissions for assignment
      if (session.user.role === 'SUPER_ADMIN') {
        // Super admin can assign to anyone
        assignToUserId = assignedUserId;
      } else if (session.user.role === 'LEAD_BROKER') {
        // Lead broker can only assign to users in their company
        if (assignedUser.companyId !== currentUser.companyId) {
          return NextResponse.json(
            { error: 'You can only assign follow-ups to brokers in your company' },
            { status: 403 }
          );
        }
        
        // Check if assigned user is a sub-broker of the current lead broker
        if (assignedUserId !== currentUser.id && assignedUser.managerId !== currentUser.id) {
          return NextResponse.json(
            { error: 'You can only assign follow-ups to yourself or your sub-brokers' },
            { status: 403 }
          );
        }
        
        assignToUserId = assignedUserId;
      } else {
        // Sub-brokers can only assign to themselves
        if (assignedUserId !== currentUser.id) {
          return NextResponse.json(
            { error: 'You can only assign follow-ups to yourself' },
            { status: 403 }
          );
        }
        
        assignToUserId = currentUser.id;
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
          connect: { id: assignToUserId }
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
