import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// PATCH /api/leads/[id] - Update a lead (e.g., reassign owner or edit details)
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

    // Fix: Await params to resolve the id
    const { id: leadId } = params
    const body = await request.json()
    const { name, phone, email, status, notes, ownerId } = body    // Check for required fields if this is a full lead update
    if (name !== undefined && (!name || !phone || !status)) {
      return NextResponse.json(
        { error: 'Name, phone, and status are required fields' },
        { status: 400 }
      )
    }
    
    // If only updating the owner, ensure ownerId is provided
    if (ownerId === undefined && Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'No fields provided for update' },
        { status: 400 }
      )
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { phone: session.user.phone },
      include: { company: true }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if lead exists
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { company: true }
    })

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }    // Verify the new owner exists and belongs to the same company
    const newOwner = await prisma.user.findFirst({
      where: { 
        id: ownerId,
        companyId: currentUser.companyId
      }
    })

    if (!newOwner) {
      return NextResponse.json(
        { error: 'Invalid owner ID or owner not in same company' },
        { status: 400 }
      )
    }

    // Check permissions:
    // 1. SUPER_ADMINs can reassign any leads
    // 2. LEAD_BROKERs can only reassign leads within their company and to their subbrokers
    // 3. SUB_BROKERs cannot reassign leads
    if (session.user.role === 'SUB_BROKER') {
      return NextResponse.json(
        { error: 'Sub-brokers cannot reassign leads' },
        { status: 403 }
      )
    }

    if (session.user.role === 'LEAD_BROKER') {
      // Lead must be in the same company
      if (lead.companyId !== currentUser.companyId) {
        return NextResponse.json(
          { error: 'You can only reassign leads within your company' },
          { status: 403 }
        )
      }

      // If assigning to a subbroker, verify they report to this lead broker
      if (newOwner.role === 'SUB_BROKER' && newOwner.id !== currentUser.id) {
        const subbroker = await prisma.user.findFirst({
          where: {
            id: newOwner.id,
            managerId: currentUser.id
          }
        })

        if (!subbroker) {
          return NextResponse.json(
            { error: 'You can only reassign leads to yourself or your sub-brokers' },
            { status: 403 }
          )
        }
      }
    }    // Prepare update data based on which fields were provided
    const updateData: any = {
      updatedAt: new Date()
    };
    
    // For full lead edit operations
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (ownerId !== undefined) updateData.ownerId = ownerId;
    if (body.isPriority !== undefined) updateData.isPriority = body.isPriority;
    
    // Update the lead with all provided fields
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
      include: {
        company: {
          select: {
            name: true
          }
        },
        owner: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    })

    return NextResponse.json(updatedLead)
  } catch (error) {
    console.error('Error reassigning lead:', error)
    return NextResponse.json(
      { error: 'Failed to reassign lead' },
      { status: 500 }
    )
  }
}
