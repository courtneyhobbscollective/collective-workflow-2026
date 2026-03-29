import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Keep `User` rows so login/role switching still works.
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
  await prisma.scope.deleteMany();
  await prisma.clientContact.deleteMany();
  await prisma.clientAsset.deleteMany();
  await prisma.teamChannelMessage.deleteMany();
  await prisma.teamChannelMember.deleteMany();
  await prisma.teamChannel.deleteMany();
  await prisma.dmMessage.deleteMany();
  await prisma.dmThread.deleteMany();
  await prisma.client.deleteMany();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

