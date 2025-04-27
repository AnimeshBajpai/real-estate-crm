import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role;
    const companyId = session.user.companyId;

    let brokers = [];

    if (userRole === 'SUPER_ADMIN') {
      // Super admin can assign to any broker
      brokers = await prisma.user.findMany({
        where: {
          role: {
            in: ['LEAD_BROKER', 'SUB_BROKER']
          }
        },
        orderBy: {
          name: 'asc'
        },
        select: {
          id: true,
          name: true,
          role: true,
          company: {
            select: {
              name: true
            }
          }
        }
      });
    } else if (userRole === 'LEAD_BROKER') {
      // Lead broker can assign to self and sub-brokers under them
      brokers = await prisma.user.findMany({
        where: {
          companyId,
          OR: [
            { id: userId }, // Self
            { managerId: userId } // Direct reports
          ]
        },
        orderBy: {
          name: 'asc'
        },
        select: {
          id: true,
          name: true,
          role: true
        }
      });
    } else {
      // Sub broker can only assign to themselves
      brokers = await prisma.user.findMany({
        where: {
          id: userId
        },
        select: {
          id: true,
          name: true,
          role: true
        }
      });
    }

    return NextResponse.json(brokers);
  } catch (error) {
    console.error('Error fetching brokers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brokers' },
      { status: 500 }
    );
  }
}
