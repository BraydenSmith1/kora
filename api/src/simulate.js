import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
function randWh(){ return Math.floor(50 + Math.random()*200); }
async function tick(){
  const meters = await prisma.meter.findMany();
  for(const m of meters){
    await prisma.meter.update({ where: { id: m.id }, data: { whTotal: m.whTotal + randWh() } });
  }
  console.log('Simulated meter tick for', meters.length, 'meters');
}
tick().finally(()=>prisma.$disconnect());
