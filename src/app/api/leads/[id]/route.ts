import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/leads/[id] - Get a specific lead by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    if (!lead) {
      return new NextResponse("Lead not found", { status: 404 });
    }
    
    // If user is not a super admin, ensure they can only access leads from their company
    if (session.user.role !== 'SUPER_ADMIN' && lead.companyId !== session.user.companyId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }
    
    return NextResponse.json(lead);
  } catch (error) {
    console.error("Error fetching lead:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// PATCH /api/leads/[id] - Update a lead by ID
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const body = await request.json();
    const { name, phone, email, status, notes, ownerId, isPriority } = body;
    
    // Check if the lead exists
    const existingLead = await prisma.lead.findUnique({
      where: { id: params.id }
    });
    
    if (!existingLead) {
      return new NextResponse("Lead not found", { status: 404 });
    }
    
    // If user is not a super admin, ensure they can only update leads from their company
    if (session.user.role !== 'SUPER_ADMIN' && existingLead.companyId !== session.user.companyId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }
    
    // Build update data with optional fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (isPriority !== undefined) updateData.isPriority = isPriority;
    
    // If owner ID is provided, verify the owner belongs to the same company
    if (ownerId) {
      // Check if the new owner exists and belongs to the same company
      const newOwner = await prisma.user.findUnique({
        where: { id: ownerId },
        select: { companyId: true }
      });
      
      if (!newOwner) {
        return new NextResponse("New owner not found", { status: 400 });
      }
      
      if (newOwner.companyId !== existingLead.companyId) {
        return new NextResponse("New owner must be from the same company", { status: 400 });
      }
      
      updateData.ownerId = ownerId;
    }
    
    // Update the lead
    const updatedLead = await prisma.lead.update({
      where: { id: params.id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true
          }
        },
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error("Error updating lead:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE /api/leads/[id] - Delete a lead by ID
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Check if the lead exists
    const existingLead = await prisma.lead.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        companyId: true,
        ownerId: true
      }
    });
    
    if (!existingLead) {
      return new NextResponse("Lead not found", { status: 404 });
    }
    
    // Authorization checks:
    // 1. Super admins can delete any lead
    // 2. Lead brokers can delete leads from their company
    // 3. Subbrokers can only delete their own leads
    if (session.user.role !== 'SUPER_ADMIN') {
      // For non-super admins, check company
      if (existingLead.companyId !== session.user.companyId) {
        return new NextResponse("Unauthorized to delete leads from this company", { status: 403 });
      }
      
      // For subbrokers, check if they own the lead
      if (session.user.role === 'SUB_BROKER' && existingLead.ownerId !== session.user.id) {
        return new NextResponse("Unauthorized to delete leads owned by others", { status: 403 });
      }
    }
    
    // Delete related follow-ups first (if any exist)
    await prisma.followUp.deleteMany({
      where: { leadId: params.id }
    });
    
    // Delete the lead
    await prisma.lead.delete({
      where: { id: params.id }
    });
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting lead:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
