import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding...");

  // Pracownicy-użytkownicy
  const password = await bcrypt.hash("haslo123", 10);

  const anna = await prisma.user.upsert({
    where: { email: "anna@salon.pl" },
    update: {},
    create: { name: "Anna Kowalska", email: "anna@salon.pl", password },
  });

  const marek = await prisma.user.upsert({
    where: { email: "marek@salon.pl" },
    update: {},
    create: { name: "Marek Nowak", email: "marek@salon.pl", password },
  });

  const kasia = await prisma.user.upsert({
    where: { email: "kasia@salon.pl" },
    update: {},
    create: { name: "Katarzyna Wiśniewska", email: "kasia@salon.pl", password },
  });

  // Pracownicy
  const empAnna = await prisma.employee.upsert({
    where: { userId: anna.id },
    update: {},
    create: { userId: anna.id, name: "Anna", color: "#f43f5e", phone: "500100200" },
  });

  const empMarek = await prisma.employee.upsert({
    where: { userId: marek.id },
    update: {},
    create: { userId: marek.id, name: "Marek", color: "#3b82f6", phone: "500100201" },
  });

  const empKasia = await prisma.employee.upsert({
    where: { userId: kasia.id },
    update: {},
    create: { userId: kasia.id, name: "Kasia", color: "#10b981", phone: "500100202" },
  });

  // Godziny pracy (pon–sob, 9–18)
  const workDays = [1, 2, 3, 4, 5, 6];
  for (const emp of [empAnna, empMarek, empKasia]) {
    for (const day of workDays) {
      await prisma.employeeHours.upsert({
        where: { employeeId_dayOfWeek: { employeeId: emp.id, dayOfWeek: day } },
        update: {},
        create: { employeeId: emp.id, dayOfWeek: day, startTime: "09:00", endTime: "18:00" },
      });
    }
  }

  // Usługi
  const services = await Promise.all([
    prisma.service.upsert({
      where: { id: "svc_cut_women" },
      update: {},
      create: { id: "svc_cut_women", name: "Strzyżenie damskie", durationMin: 60, pricePln: 120, color: "#f43f5e" },
    }),
    prisma.service.upsert({
      where: { id: "svc_cut_men" },
      update: {},
      create: { id: "svc_cut_men", name: "Strzyżenie męskie", durationMin: 30, pricePln: 60, color: "#3b82f6" },
    }),
    prisma.service.upsert({
      where: { id: "svc_color" },
      update: {},
      create: { id: "svc_color", name: "Koloryzacja", durationMin: 120, pricePln: 250, color: "#a855f7" },
    }),
    prisma.service.upsert({
      where: { id: "svc_blow" },
      update: {},
      create: { id: "svc_blow", name: "Blow-dry / stylizacja", durationMin: 45, pricePln: 80, color: "#f59e0b" },
    }),
    prisma.service.upsert({
      where: { id: "svc_treat" },
      update: {},
      create: { id: "svc_treat", name: "Pielęgnacja (maska + wcierka)", durationMin: 30, pricePln: 70, color: "#10b981" },
    }),
  ]);

  // Klienci
  const clients = await Promise.all([
    prisma.client.upsert({ where: { id: "cli_1" }, update: {}, create: { id: "cli_1", name: "Joanna Malinowska", phone: "600111222" } }),
    prisma.client.upsert({ where: { id: "cli_2" }, update: {}, create: { id: "cli_2", name: "Piotr Zając", phone: "600333444" } }),
    prisma.client.upsert({ where: { id: "cli_3" }, update: {}, create: { id: "cli_3", name: "Marta Krawczyk", phone: "601555666", notes: "Uczulona na amoniak" } }),
    prisma.client.upsert({ where: { id: "cli_4" }, update: {}, create: { id: "cli_4", name: "Tomasz Lewandowski", phone: "601777888" } }),
  ]);

  // Wizyty — bieżący tydzień
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function slot(daysOffset: number, hour: number, minute = 0): Date {
    const d = new Date(today);
    d.setDate(d.getDate() + daysOffset);
    d.setHours(hour, minute, 0, 0);
    return d;
  }

  const appointmentSeeds = [
    { employee: empAnna,  service: services[0], client: clients[0], start: slot(0, 9),   end: slot(0, 10) },
    { employee: empAnna,  service: services[2], client: clients[2], start: slot(0, 11),  end: slot(0, 13) },
    { employee: empMarek, service: services[1], client: clients[1], start: slot(0, 9),   end: slot(0, 9, 30) },
    { employee: empMarek, service: services[1], client: clients[3], start: slot(0, 10),  end: slot(0, 10, 30) },
    { employee: empKasia, service: services[3], client: clients[0], start: slot(0, 14),  end: slot(0, 14, 45) },
    { employee: empAnna,  service: services[0], client: clients[3], start: slot(1, 10),  end: slot(1, 11) },
    { employee: empKasia, service: services[4], client: clients[2], start: slot(1, 9),   end: slot(1, 9, 30) },
    { employee: empMarek, service: services[1], client: clients[0], start: slot(2, 11),  end: slot(2, 11, 30) },
    { employee: empAnna,  service: services[2], client: clients[1], start: slot(3, 10),  end: slot(3, 12) },
    { employee: empKasia, service: services[0], client: clients[3], start: slot(4, 13),  end: slot(4, 14) },
  ];

  for (const a of appointmentSeeds) {
    await prisma.appointment.create({
      data: {
        employeeId: a.employee.id,
        serviceId: a.service.id,
        clientId: a.client.id,
        startsAt: a.start,
        endsAt: a.end,
        status: "confirmed",
        source: "counter",
      },
    });
  }

  console.log("Seed gotowy.");
  console.log("Konta testowe: anna@salon.pl / marek@salon.pl / kasia@salon.pl — hasło: haslo123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
