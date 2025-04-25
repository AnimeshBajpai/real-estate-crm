import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

const prisma = new PrismaClient()

// GET /api/companies
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only super admins can see all companies
    // Lead brokers and sub brokers can only see their own company
    let companies
    if (session.user.role === 'SUPER_ADMIN') {
      companies = await prisma.company.findMany({
        include: {
          leadBroker: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          }
        }
      })
    } else {
      // Find the user's company
      const user = await prisma.user.findUnique({
        where: { phone: session.user.phone },
        include: {
          company: {
            include: {
              leadBroker: {
                select: {
                  id: true,
                  name: true,
                  phone: true
                }
              }
            }
          }
        }
      })
      
      if (user?.company) {
        companies = [user.company]
      } else {
        companies = []
      }
    }

    return NextResponse.json(companies)
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    )
  }
}

// POST /api/companies
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Only super admins can create companies
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Only super admins can create companies' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, leadBrokerId } = body

    // Validate input
    if (!name || !leadBrokerId) {
      return NextResponse.json(
        { error: 'Company name and lead broker are required' },
        { status: 400 }
      )
    }

    // Check if the lead broker exists and is not already assigned to a company
    const existingLeadBroker = await prisma.user.findUnique({
      where: { id: leadBrokerId },
      include: { managedCompany: true }
    })

    if (!existingLeadBroker) {
      return NextResponse.json(
        { error: 'Lead broker not found' },
        { status: 400 }
      )
    }

    if (existingLeadBroker.managedCompany) {
      return NextResponse.json(
        { error: 'This lead broker is already managing another company' },
        { status: 400 }
      )
    }

    // Create the company and assign the lead broker
    const company = await prisma.company.create({
      data: {
        name,
        leadBroker: {
          connect: { id: leadBrokerId }
        },
        employees: {
          connect: { id: leadBrokerId } // Also add lead broker as an employee
        }
      },
      include: {
        leadBroker: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    })

    return NextResponse.json(company)
  } catch (error) {
    console.error('Error creating company:', error)
    return NextResponse.json(
      { error: 'Failed to create company' },
      { status: 500 }
    )
  }
}
