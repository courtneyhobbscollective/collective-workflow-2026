import { PrismaClient } from "@prisma/client";
import { addDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.timeLog.deleteMany();
  await prisma.calendarBooking.deleteMany();
  await prisma.message.deleteMany();
  await prisma.messageThread.deleteMany();
  await prisma.internalNote.deleteMany();
  await prisma.briefUpdate.deleteMany();
  await prisma.deliverable.deleteMany();
  await prisma.briefAssignment.deleteMany();
  await prisma.brief.deleteMany();
  await prisma.serviceProduct.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.clientContact.deleteMany();
  await prisma.clientAsset.deleteMany();
  await prisma.user.deleteMany();
  await prisma.client.deleteMany();

  const clientA = await prisma.client.create({
    data: {
      name: "Northline Coffee",
      status: "active",
      engagementType: "retainer",
      brandSummary: "Premium specialty coffee roaster.",
      email: "hello@northline.com",
      phoneNumber: "+1 (555) 014-2291",
      relationshipContactFrequencyDays: 14,
      nextRelationshipContactDueAt: addDays(new Date(), -1),
      lastRelationshipContactAt: addDays(new Date(), -20),
      contacts: {
        create: [
          {
            name: "Jess Foley",
            email: "jess@northline.com",
            title: "Marketing Lead",
            isPrimary: true,
            role: "point_of_contact"
          },
          {
            name: "Morgan Reyes",
            email: "morgan@northline.com",
            title: "Accounts Coordinator",
            isPrimary: false,
            role: "accounts_contact"
          }
        ]
      }
    }
  });

  const admin = await prisma.user.create({
    data: { email: "admin@workflow.local", fullName: "Alex Admin", role: "admin" }
  });
  const producer = await prisma.user.create({
    data: { email: "team@workflow.local", fullName: "Taylor Producer", role: "team_member" }
  });
  const clientUser = await prisma.user.create({
    data: { email: "client@northline.com", fullName: "Jess Foley", role: "client", clientId: clientA.id }
  });

  await prisma.lead.create({
    data: {
      name: "Riley Chen",
      email: "riley@oakleaf-marketing.test",
      companyName: "Oakleaf Marketing Ltd",
      position: "Marketing Director",
      phoneNumber: "+44 20 7946 0958",
      status: "quoted",
      lastContactedAt: addDays(new Date(), -7),
      quotedAt: addDays(new Date(), -2),
      quoteSnapshot: {
        lineItems: [{ description: "Website refresh + content system", unitPriceExVat: 18500, quantity: 1 }],
        vatRate: 0.2,
      },
    },
  });

  await prisma.lead.create({
    data: {
      name: "Morgan Blake",
      email: "morgan@studio-k.test",
      companyName: "Studio K",
      position: "Founder",
      phoneNumber: "+44 7700 900321",
      status: "active",
      quoteSnapshot: { lineItems: [{ description: "", unitPriceExVat: 0, quantity: 1 }], vatRate: 0.2 },
    },
  });

  await prisma.serviceProduct.create({
    data: {
      name: "Brand sprint",
      description: "Two-week positioning sprint: strategy, identity direction, and launch assets.",
      kind: "fixed_package",
      scopeType: "project",
      serviceType: "design",
      defaultDeadlineDays: 21,
      projectBudget: 15000,
      deliverableTemplates: {
        create: [
          { sortOrder: 0, title: "Discovery workshop summary", deliverableType: "strategy", daysFromStart: 3 },
          { sortOrder: 1, title: "Brand strategy deck", deliverableType: "strategy", daysFromStart: 10 },
          { sortOrder: 2, title: "Visual identity directions (3 concepts)", deliverableType: "design", daysFromStart: 14 },
          { sortOrder: 3, title: "Launch social kit", deliverableType: "design", daysFromStart: 21 },
        ],
      },
    },
  });

  const retainerProduct = await prisma.serviceProduct.create({
    data: {
      name: "Standard monthly retainer",
      description: "Ongoing design and content support with a fixed monthly fee.",
      kind: "retainer_template",
      scopeType: "retainer",
      serviceType: "content",
      monthlyRetainer: 6500,
      defaultDeadlineDays: 30,
    },
  });

  const brief = await prisma.brief.create({
    data: {
      clientId: clientA.id,
      serviceProductId: retainerProduct.id,
      title: "Spring Product Launch Edits",
      description: "Produce 3 short-form edits and static cutdowns for the spring launch.",
      priority: "high",
      status: "in_progress",
      scopeStatus: "watch_scope",
      deadline: addDays(new Date(), 10)
    }
  });

  await prisma.briefAssignment.createMany({
    data: [{ briefId: brief.id, userId: producer.id, role: "producer" }]
  });

  await prisma.deliverable.createMany({
    data: [
      { briefId: brief.id, title: "Launch Reel V1", deliverableType: "video", deliveryDate: addDays(new Date(), 6) },
      { briefId: brief.id, title: "Static Story Pack", deliverableType: "design", deliveryDate: addDays(new Date(), 8) }
    ]
  });

  await prisma.briefUpdate.create({
    data: {
      briefId: brief.id,
      authorId: producer.id,
      content: "Filming complete, first edit in progress.",
      visibleToClient: true
    }
  });

  await prisma.internalNote.create({
    data: {
      briefId: brief.id,
      authorId: admin.id,
      noteType: "risk",
      content: "Cutdown count may exceed scoped allowance; monitor next revision."
    }
  });

  const clientThread = await prisma.messageThread.create({
    data: { briefId: brief.id, threadType: "client", title: "Client Brief Thread" }
  });
  await prisma.messageThread.create({
    data: { briefId: brief.id, threadType: "internal", title: "Internal Production Thread" }
  });

  await prisma.message.create({
    data: {
      threadId: clientThread.id,
      senderId: clientUser.id,
      body: "Can we prioritize the 9:16 cut first for paid?"
    }
  });

  await prisma.calendarBooking.create({
    data: {
      briefId: brief.id,
      clientId: clientA.id,
      bookingType: "review",
      title: "Client review call",
      startsAt: addDays(new Date(), 5),
      endsAt: addDays(new Date(), 5.01),
      visibleToClient: true
    }
  });

  await prisma.notification.create({
    data: {
      userId: producer.id,
      clientId: clientA.id,
      title: "Scope Watch",
      body: "Spring Product Launch Edits is marked watch_scope."
    }
  });

  await prisma.activityLog.create({
    data: {
      userId: admin.id,
      briefId: brief.id,
      action: "brief_created",
      metadata: { title: brief.title }
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
