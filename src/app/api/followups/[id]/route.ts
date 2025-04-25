import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// PATCH /api/followups/[id] - Update a follow-up (e.g., mark as completed)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const followUpId = params.id
    const body = await request.json()
    const { completed } = body

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

    // Check if follow-up exists
    const followUp = await prisma.followUp.findUnique({
      where: { id: followUpId },
      include: {
        lead: {
          include: {
            company: true
          }
        }
      }
    })

    if (!followUp) {
      return NextResponse.json(
        { error: 'Follow-up not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this follow-up
    if (session.user.role !== 'SUPER_ADMIN') {
      if (followUp.userId !== currentUser.id) {
        // Check if user belongs to the same company as the follow-up's lead
        const user = await prisma.user.findUnique({
          where: { id: currentUser.id },
          include: { company: true }
        })

        if (!user?.company || user.company.id !== followUp.lead.companyId) {
          return NextResponse.json(
            { error: 'You do not have access to this follow-up' },
            { status: 403 }
          )
        }
      }
    }

    // Update the follow-up
    const updatedFollowUp = await prisma.followUp.update({
      where: { id: followUpId },
      data: { 
        completed,
        updatedAt: new Date()
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

    return NextResponse.json(updatedFollowUp)
  } catch (error) {
    console.error('Error updating follow-up:', error)
    return NextResponse.json(
      { error: 'Failed to update follow-up' },
      { status: 500 }
    )
  }
}
