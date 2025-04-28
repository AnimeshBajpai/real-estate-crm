import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcrypt'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/users
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const companyId = searchParams.get('companyId')

    const where = {
      ...(role && { role }),
      ...(companyId && { company: { id: companyId } })
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/users
export async function POST(request: Request) {
  try {
    // Get the current user's session
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { name, phone, password, role, companyId } = body

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this phone number already exists' },
        { status: 400 }
      )
    }

    // Hash the password
    const hashedPassword = await hash(password, 10)
      // Case 1: Lead Broker creating a Sub-broker
    if (role === 'SUB_BROKER' && session?.user?.role === 'LEAD_BROKER') {
      // Get the Lead Broker's information
      const leadBroker = await prisma.user.findUnique({
        where: { phone: session.user.phone },
        include: { company: true }
      })

      if (!leadBroker) {
        return NextResponse.json(
          { error: 'Lead Broker account not found' },
          { status: 404 }
        )
      }

      if (!leadBroker.company) {
        return NextResponse.json(
          { error: 'Lead Broker is not associated with a company' },
          { status: 400 }
        )
      }

      // Create the Sub-broker with the Lead Broker as manager and in the same company
      const user = await prisma.user.create({
        data: {
          name,
          phone,
          password: hashedPassword,
          role: 'SUB_BROKER',
          managerId: leadBroker.id,
          companyId: leadBroker.company.id
        },
        select: {
          id: true,
          name: true,
          phone: true,
          role: true,
          company: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
      
      return NextResponse.json(user)
    }    // Case 2: Super Admin creating a Sub-broker for a specific company
    if (role === 'SUB_BROKER' && session?.user?.role === 'SUPER_ADMIN' && companyId) {
      // Verify the company exists
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: { leadBroker: true }
      });
      
      if (!company) {
        return NextResponse.json(
          { error: 'Specified company not found' },
          { status: 404 }
        );
      }
      
      if (!company.leadBroker) {
        return NextResponse.json(
          { error: 'Company has no lead broker assigned' },
          { status: 400 }
        );
      }
      
      // Create the sub-broker with the company's lead broker as manager
      const user = await prisma.user.create({
        data: {
          name,
          phone,
          password: hashedPassword,
          role: 'SUB_BROKER',
          managerId: company.leadBroker.id,
          companyId: company.id
        },
        select: {
          id: true,
          name: true,
          phone: true,
          role: true,
          company: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      
      return NextResponse.json(user);
    }
    
    // Case 3: Standard user creation for other cases
    const user = await prisma.user.create({
      data: {
        name,
        phone,
        password: hashedPassword,
        role,
        ...(companyId && { companyId })
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
