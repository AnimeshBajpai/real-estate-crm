import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting to seed the database...');
  console.log('Starting to seed the database...');

  try {
    // Create a super admin user
    const superAdminPassword = await hash('admin123', 12);
    const superAdmin = await prisma.user.create({
      data: {
        phone: '1234567890',
        password: superAdminPassword,
        name: 'Admin User',
        role: 'SUPER_ADMIN',
      },
    });
    console.log('Created super admin:', superAdmin.name);

    // Create a lead broker
    const leadBrokerPassword = await hash('broker123', 12);
    const leadBroker = await prisma.user.create({
      data: {
        phone: '2234567890',
        password: leadBrokerPassword,
        name: 'John Smith',
        role: 'LEAD_BROKER',
      },
    });
    console.log('Created lead broker:', leadBroker.name);

    // Create a company
    const company = await prisma.company.create({
      data: {
        name: 'ABC Real Estate',
        leadBrokerId: leadBroker.id,
      },
    });
    console.log('Created company:', company.name);

    // Update lead broker with company
    await prisma.user.update({
      where: { id: leadBroker.id },
      data: { companyId: company.id }
    });

    // Create a sub-broker
    const subBrokerPassword = await hash('broker456', 12);
    const subBroker = await prisma.user.create({
      data: {
        phone: '3234567890',
        password: subBrokerPassword,
        name: 'Jane Doe',
        role: 'SUB_BROKER',
        companyId: company.id,
        managerId: leadBroker.id
      },
    });
    console.log('Created sub-broker:', subBroker.name);

    // Create some test leads
    const leads = await Promise.all([
      prisma.lead.create({
        data: {
          name: 'Sarah Johnson',
          phone: '+1 (555) 123-4567',
          email: 'sarah.johnson@example.com',
          status: 'NEW',
          notes: 'Interested in a 3-bedroom house in downtown',
          ownerId: leadBroker.id,
          companyId: company.id,
        },
      }),
      prisma.lead.create({
        data: {
          name: 'Michael Chen',
          phone: '+1 (555) 987-6543',
          email: 'mchen@example.com',
          status: 'CONTACTED',
          notes: 'Looking for commercial property',
          ownerId: subBroker.id,
          companyId: company.id,
        },
      }),
    ]);
    console.log(`Created ${leads.length} leads`);

    // Create follow-ups
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const followUps = await Promise.all([
      prisma.followUp.create({
        data: {
          notes: 'Discuss financing options',
          reminderDate: tomorrow,
          leadId: leads[0].id,
          userId: leadBroker.id,
        },
      }),
      prisma.followUp.create({
        data: {
          notes: 'Property viewing at 456 Park Ave',
          reminderDate: tomorrow,
          leadId: leads[1].id,
          userId: subBroker.id,
        },
      }),
    ]);
    console.log(`Created ${followUps.length} follow-ups`);

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
