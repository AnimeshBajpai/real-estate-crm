import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

// GET /api/users/brokers?role=LEAD_BROKER&unassigned=true
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const unassignedOnly = searchParams.get('unassigned') === 'true'
    const includeId = searchParams.get('includeId')
    const companyId = searchParams.get('companyId')

    // Prepare the filter
    const filter: any = {}
    
    // Filter by role if specified
    if (role) {
      filter.role = role
    } else {
      // Default to LEAD_BROKER if no role is specified
      filter.role = 'LEAD_BROKER'
    }
    
    // Filter for unassigned brokers if requested
    if (unassignedOnly) {
      filter.managedCompany = null
    }
    
    // Filter by company if specified
    if (companyId) {
      filter.managedCompany = {
        id: companyId
      }
    }

    // Include a specific broker by ID regardless of assignment status
    if (includeId) {      const brokers = await prisma.user.findMany({
        where: {
          OR: [
            { ...filter },
            { id: includeId }
          ]
        },
        select: {
          id: true,
          name: true,
          phone: true,
          role: true,
          managedCompany: {
            select: {
              id: true,
              name: true,
            }
          },
        },
        orderBy: {
          name: 'asc'
        }
      })
      
      return NextResponse.json(brokers)    } else {
      // Standard query without including specific IDs
      const brokers = await prisma.user.findMany({
        where: filter,
        select: {
          id: true,
          name: true,
          phone: true,
          role: true,
          managedCompany: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      })
      
      return NextResponse.json(brokers)
    }
  } catch (error) {
    console.error('Error fetching brokers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch brokers' },
      { status: 500 }
    )
  }
}
