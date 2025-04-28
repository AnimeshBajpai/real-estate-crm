import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/users/subbrokers
// Fetch all subbrokers for the current lead broker
// For super admin, can filter by companyId
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    
    // Check access based on role
    // Allow either lead brokers or super admins with companyId
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN';
    const isLeadBroker = session.user.role === 'LEAD_BROKER';
    
    if (!isLeadBroker && !(isSuperAdmin && companyId)) {
      return NextResponse.json(
        { error: 'Forbidden. Only lead brokers or super admins with companyId can access this information.' },
        { status: 403 }
      )
    }

    // Build the query based on the role
    let whereClause: any = {
      role: 'SUB_BROKER',
    };
    
    if (isLeadBroker) {
      // Get current user (lead broker)
      const currentUser = await prisma.user.findUnique({
        where: { phone: session.user.phone }
      });

      if (!currentUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
      
      // Filter by the lead broker's ID as manager
      whereClause.managerId = currentUser.id;
    } 
    else if (isSuperAdmin && companyId) {
      // For super admin, filter by the requested company
      whereClause.companyId = companyId;
    }

    // Get subbrokers based on the where clause
    const subbrokers = await prisma.user.findMany({
      where: whereClause,
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
