import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const users = [
  { email: 'alice@example.com', name: 'Alice', regionId: 'region-1' },
  { email: 'bob@example.com', name: 'Bob', regionId: 'region-1' },
  { email: 'kofi@example.com', name: 'Kofi', regionId: 'region-2' },
];
async function main(){
  for(const u of users){
    let user = await prisma.user.findUnique({ where: { email: u.email } });
    if(!user){
      user = await prisma.user.create({ data: u });
      await prisma.wallet.create({ data: { userId: user.id, balanceCents: 12000 } });
      const asset = await prisma.asset.create({ data: { ownerId: user.id, label: `${u.name}'s Solar`, regionId: u.regionId, capacityKw: 2.5 } });
      await prisma.meter.create({ data: { assetId: asset.id, whTotal: 0 } });
    }
  }
  console.log('Seeded extra users/assets.');
}
main().finally(()=>prisma.$disconnect());
