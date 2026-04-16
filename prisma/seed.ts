import 'dotenv/config'
import { PrismaClient, Role, JobStatus, EmployeeStatus, PaymentStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seeding...')

  // 1. SEED EMPLOYEES (matches Employee_Database)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@acmefence.com' },
    update: {},
    create: {
      email: 'admin@acmefence.com',
      name: 'Michael Scott',
      password: 'password123',
      role: Role.ADMIN,
      employeeStatus: EmployeeStatus.ACTIVE,
      hireDate: new Date('2023-01-15'),
      payRate: 45.0,
    },
  })

  const foreman = await prisma.user.upsert({
    where: { email: 'foreman@acmefence.com' },
    update: {},
    create: {
      email: 'foreman@acmefence.com',
      name: 'Jim Halpert',
      password: 'password123',
      role: Role.FOREMAN,
      employeeStatus: EmployeeStatus.ACTIVE,
      hireDate: new Date('2023-04-20'),
      payRate: 35.0,
      emergencyContactName: 'Pam Beesly',
      emergencyContactPhone: '555-0199',
    },
  })

  const crew = await prisma.user.upsert({
    where: { email: 'crew@acmefence.com' },
    update: {},
    create: {
      email: 'crew@acmefence.com',
      name: 'Dwight Schrute',
      password: 'password123',
      role: Role.CREW,
      employeeStatus: EmployeeStatus.ACTIVE,
      hireDate: new Date('2023-06-10'),
      payRate: 25.0,
      emergencyContactName: 'Angela Martin',
      emergencyContactPhone: '555-0200',
    },
  })

  // 2. SEED CONTACTS (matches Contacts_Backup)
  const contact1 = await prisma.contact.upsert({
    where: { contactId: 'GHL_001' },
    update: {},
    create: {
      contactId: 'GHL_001',
      firstName: 'Stanley',
      lastName: 'Hudson',
      fullName: 'Stanley Hudson',
      email: 'stanley@pretzelday.com',
      phone: '555-1234',
      leadSource: 'Google Search',
      pipelineStage: 'Won',
      address: '1725 Slough Avenue',
      city: 'Scranton',
      state: 'PA',
      postalCode: '18505',
    },
  })

  // 3. SEED JOBS (matches Job_Tracker)
  const job1 = await prisma.job.upsert({
    where: { ghlJobId: 'JOB_101' },
    update: {},
    create: {
      ghlJobId: 'JOB_101',
      title: 'Commercial Chainlink - Warehouse D',
      customerName: 'Stanley Hudson',
      address: '1725 Slough Avenue, Scranton, PA',
      city: 'Scranton',
      postalCode: '18505',
      scheduledDate: new Date(),
      scheduledTime: '08:00 AM',
      status: JobStatus.In_Progress,
      assignedForemanId: foreman.id,
      revenue: 8500.00,
      materialCost: 2200.00,
      laborCost: 1500.00,
      totalJobCost: 3700.00,
      profitMargin: 56.47,
      materialListUrl: 'https://docs.google.com/warehouse_d_materials',
      contacts: {
        connect: { id: contact1.id }
      }
    },
  })

  // 4. SEED MATERIALS (matches Material_Lists)
  await prisma.material.createMany({
    data: [
      {
        jobId: job1.id,
        itemName: '6ft Chainlink Fabric (50ft Roll)',
        quantity: 12,
        unit: 'Roll',
        costPerUnit: 150.00,
        totalCost: 1800.00,
        supplier: 'Fencing Supply Co',
        status: 'Received',
        orderedDate: new Date('2024-03-20'),
        receivedDate: new Date('2024-03-25'),
      },
      {
        jobId: job1.id,
        itemName: '8ft Steel Posts',
        quantity: 40,
        unit: 'Each',
        costPerUnit: 10.00,
        totalCost: 400.00,
        supplier: 'Steel Masters',
        status: 'Pending',
        orderedDate: new Date('2024-03-22'),
      }
    ]
  })

  // 5. SEED TIMESHEETS (matches Timesheet_Log)
  const timesheet1 = await prisma.timesheet.create({
    data: {
      employeeId: crew.id,
      jobId: job1.id,
      date: new Date(),
      startTime: '08:00',
      endTime: '16:30',
      totalHours: 8.5,
      hourlyRate: 25.0,
      totalPay: 212.5,
      tasksCompleted: 'Installed 20 posts and partial framing',
      materialsUsed: '10 posts, 4 rolls fabric',
      status: 'APPROVED',
    }
  })

  // 6. SEED PAYROLL (matches Payroll_Calculator)
  await prisma.payroll.create({
    data: {
      employeeId: crew.id,
      payPeriodStart: new Date('2024-03-01'),
      payPeriodEnd: new Date('2024-03-15'),
      regularHours: 80,
      overtimeHours: 5.5,
      hourlyRate: 25.0,
      overtimeRate: 37.5,
      regularPay: 2000.0,
      overtimePay: 206.25,
      grossPay: 2206.25,
      deductions: 450.0,
      netPay: 1756.25,
      paymentStatus: PaymentStatus.PAID,
      paymentDate: new Date('2024-03-18'),
      paymentMethod: 'Direct Deposit',
    }
  })

  console.log('Seeding completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Error during seeding:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
