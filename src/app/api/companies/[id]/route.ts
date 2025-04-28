import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

// GET /api/companies/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check user's role/access
    // Super admins can access any company
    // Lead brokers and sub-brokers can only access their own company
    let company;
    
    if (session.user.role === 'SUPER_ADMIN') {
      company = await prisma.company.findUnique({
        where: { id },
        include: {
          leadBroker: true,
          employees: true,
          _count: {
            select: {
              employees: true,
              leads: true
            }
          }
        }
      });
    } else {
      // Check if the company belongs to the current user
      const user = await prisma.user.findUnique({
        where: { phone: session.user.phone },
        include: { company: true }
      });

      if (!user?.company || user.company.id !== id) {
        return NextResponse.json(
          { error: 'You are not authorized to access this company' },
          { status: 403 }
        );
      }

      company = await prisma.company.findUnique({
        where: { id },
        include: {
          leadBroker: true,
          employees: true,
          _count: {
            select: {
              employees: true,
              leads: true
            }
          }
        }
      });
    }

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company details' },
      { status: 500 }
    );
  }
}

// PATCH /api/companies/[id]
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only super admins can update companies
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only super admins can update companies' },
        { status: 403 }
      );
    }

    const existingCompany = await prisma.company.findUnique({
      where: { id }
    });

    if (!existingCompany) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, leadBrokerId } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = { name };

    // If lead broker is changing, validate and update
    if (leadBrokerId && leadBrokerId !== existingCompany.leadBrokerId) {
      // Check if the new lead broker exists and is not already assigned
      const newLeadBroker = await prisma.user.findUnique({
        where: { id: leadBrokerId },
        include: { managedCompany: true }
      });

      if (!newLeadBroker) {
        return NextResponse.json(
          { error: 'New lead broker not found' },
          { status: 400 }
        );
      }

      if (newLeadBroker.managedCompany && newLeadBroker.managedCompany.id !== id) {
        return NextResponse.json(
          { error: 'This lead broker is already managing another company' },
          { status: 400 }
        );
      }

      updateData.leadBroker = {
        connect: { id: leadBrokerId }
      };
    }

    // Update the company
    const updatedCompany = await prisma.company.update({
      where: { id },
      data: updateData,
      include: {
        leadBroker: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    });

    return NextResponse.json(updatedCompany);
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json(
      { error: 'Failed to update company' },
      { status: 500 }
    );
  }
}

// DELETE /api/companies/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only super admins can delete companies
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only super admins can delete companies' },
        { status: 403 }
      );
    }

    const existingCompany = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            employees: true,
            leads: true
          }
        }
      }
    });

    if (!existingCompany) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Check if there are any employees or leads in the company
    if (existingCompany._count.employees > 0 || existingCompany._count.leads > 0) {
      return NextResponse.json(
        { error: 'Cannot delete company with existing employees or leads' },
        { status: 400 }
      );
    }

    // Delete the company
    await prisma.company.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting company:', error);
    return NextResponse.json(
      { error: 'Failed to delete company' },
      { status: 500 }
    );
  }
}
