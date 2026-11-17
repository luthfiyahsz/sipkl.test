import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = process.env.SEED_PASSWORD ?? "password";

function dateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function todayInJakarta(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function upsertUser(input: {
  name: string;
  email: string;
  role: Role;
  noTelp?: string;
  alamat?: string;
  active?: boolean;
}) {
  const password = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  return prisma.user.upsert({
    where: { email: input.email },
    // Do not reset passwords or profile data on re-seed.
    update: {},
    create: {
      name: input.name,
      email: input.email,
      password,
      role: input.role,
      noTelp: input.noTelp,
      alamat: input.alamat,
      active: input.active ?? true,
      emailVerifiedAt: new Date(),
    },
  });
}

async function main() {
  console.log("Seeding SI-PKL database...");

  const admin = await upsertUser({
    name: "Administrator",
    email: "admin@si-pkl.test",
    role: Role.admin,
  });

  const budiUser = await upsertUser({
    name: "Budi Santoso",
    email: "budi@si-pkl.test",
    role: Role.guru,
    noTelp: "081234567890",
  });
  const budi = await prisma.guru.upsert({
    where: { userId: budiUser.id },
    update: {},
    create: { userId: budiUser.id, nip: "198001012010011001", gelar: "S.Pd., M.Pd." },
  });

  const sitiUser = await upsertUser({
    name: "Siti Rahmawati",
    email: "siti@si-pkl.test",
    role: Role.guru,
    noTelp: "081234567891",
  });
  await prisma.guru.upsert({
    where: { userId: sitiUser.id },
    update: {},
    create: { userId: sitiUser.id, nip: "198501012010011002", gelar: "S.Kom., M.Kom." },
  });

  const ahmadUser = await upsertUser({
    name: "Ahmad Fauzi",
    email: "ahmad@si-pkl.test",
    role: Role.siswa,
    noTelp: "081234567892",
  });
  const ahmad = await prisma.siswa.upsert({
    where: { userId: ahmadUser.id },
    update: {},
    create: { userId: ahmadUser.id, nis: "2024001", kelas: "XII RPL 1" },
  });

  const dewiUser = await upsertUser({
    name: "Dewi Lestari",
    email: "dewi@si-pkl.test",
    role: Role.siswa,
    noTelp: "081234567893",
  });
  const dewi = await prisma.siswa.upsert({
    where: { userId: dewiUser.id },
    update: {},
    create: { userId: dewiUser.id, nis: "2024002", kelas: "XII RPL 1" },
  });

  const perusahaanUser = await upsertUser({
    name: "PT Teknologi Maju",
    email: "perusahaan@si-pkl.test",
    role: Role.perusahaan,
    noTelp: "02112345678",
    alamat: "Jl. Merdeka No. 123, Jakarta",
  });
  const perusahaan = await prisma.perusahaan.upsert({
    where: { userId: perusahaanUser.id },
    update: {},
    create: {
      userId: perusahaanUser.id,
      kontakPerson: "Hendra",
      website: "https://teknologimaju.co.id",
    },
  });

  const cvKaryaUser = await upsertUser({
    name: "CV Karya Digital",
    email: "cvkarya@si-pkl.test",
    role: Role.perusahaan,
    noTelp: "02212345678",
    alamat: "Jl. Sudirman No. 45, Bandung",
  });
  await prisma.perusahaan.upsert({
    where: { userId: cvKaryaUser.id },
    update: {},
    create: {
      userId: cvKaryaUser.id,
      kontakPerson: "Rina",
      website: "https://karyadigital.co.id",
    },
  });

  let pkl1 = await prisma.pkl.findFirst({
    where: { siswaId: ahmad.id, judul: "Pengembangan Sistem Informasi Perpustakaan Berbasis Web" },
  });
  if (!pkl1) {
    pkl1 = await prisma.pkl.create({
      data: {
        siswaId: ahmad.id,
        guruId: budi.id,
        perusahaanId: perusahaan.id,
        judul: "Pengembangan Sistem Informasi Perpustakaan Berbasis Web",
        deskripsi: "Membangun sistem informasi perpustakaan menggunakan Laravel dan MySQL",
        tanggalMulai: dateOnly("2026-01-10"),
        tanggalSelesai: dateOnly("2026-06-10"),
        status: "disetujui",
      },
    });
  }

  let pkl2 = await prisma.pkl.findFirst({
    where: { siswaId: dewi.id, judul: "Pengembangan Aplikasi Kasir Berbasis Web" },
  });
  if (!pkl2) {
    pkl2 = await prisma.pkl.create({
      data: {
        siswaId: dewi.id,
        guruId: budi.id,
        perusahaanId: perusahaan.id,
        judul: "Pengembangan Aplikasi Kasir Berbasis Web",
        deskripsi: "Membangun aplikasi kasir untuk usaha kecil menggunakan PHP dan MySQL",
        tanggalMulai: dateOnly("2026-02-01"),
        tanggalSelesai: dateOnly("2026-07-01"),
        status: "pengajuan",
      },
    });
  }

  const jurnalSeeds = [
    {
      pklId: pkl1.id,
      tanggal: dateOnly("2026-01-15"),
      kegiatan: "Membuat struktur database dan ERD",
      statusDosen: "disetujui" as const,
      statusPerusahaan: "disetujui" as const,
    },
    {
      pklId: pkl1.id,
      tanggal: dateOnly("2026-01-16"),
      kegiatan: "Membuat halaman login dan register",
      statusDosen: "pending" as const,
      statusPerusahaan: "pending" as const,
    },
    {
      pklId: pkl2.id,
      tanggal: dateOnly("2026-02-05"),
      kegiatan: "Analisis kebutuhan sistem kasir",
      statusDosen: "pending" as const,
      statusPerusahaan: "pending" as const,
    },
  ];

  for (const item of jurnalSeeds) {
    const exists = await prisma.jurnal.findFirst({
      where: { pklId: item.pklId, tanggal: item.tanggal, kegiatan: item.kegiatan },
    });
    if (!exists) await prisma.jurnal.create({ data: item });
  }

  const today = dateOnly(todayInJakarta());
  await prisma.absensi.upsert({
    where: { siswaId_tanggal: { siswaId: ahmad.id, tanggal: today } },
    update: {},
    create: { siswaId: ahmad.id, tanggal: today, status: "hadir" },
  });
  await prisma.absensi.upsert({
    where: { siswaId_tanggal: { siswaId: dewi.id, tanggal: today } },
    update: {},
    create: { siswaId: dewi.id, tanggal: today, status: "sakit", keterangan: "Demam" },
  });

  const penilaianExists = await prisma.penilaian.findFirst({
    where: { pklId: pkl1.id, guruId: budi.id },
  });
  if (!penilaianExists) {
    await prisma.penilaian.create({
      data: {
        pklId: pkl1.id,
        guruId: budi.id,
        perusahaanId: perusahaan.id,
        nilaiKedisiplinan: 85,
        nilaiKerjasama: 80,
        nilaiPengetahuan: 90,
        nilaiKeterampilan: 88,
        nilaiLaporan: 85,
        totalNilai: 86,
        komentar: "Siswa rajin dan memiliki kemampuan teknis yang baik.",
      },
    });
  }

  console.log("Seed selesai. Akun login (password: %s):", DEFAULT_PASSWORD);
  console.log("Admin        | admin@si-pkl.test");
  console.log("Guru         | budi@si-pkl.test");
  console.log("Guru 2       | siti@si-pkl.test");
  console.log("Siswa        | ahmad@si-pkl.test");
  console.log("Siswa 2      | dewi@si-pkl.test");
  console.log("Perusahaan   | perusahaan@si-pkl.test");
  console.log("Perusahaan 2 | cvkarya@si-pkl.test");
  console.log("Admin user id: %d", admin.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
