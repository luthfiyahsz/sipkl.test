-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `email_verified_at` DATETIME(3) NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'siswa', 'guru', 'perusahaan') NOT NULL DEFAULT 'siswa',
    `foto` VARCHAR(255) NULL,
    `no_telp` VARCHAR(20) NULL,
    `alamat` TEXT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `remember_token` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_reset_tokens` (
    `email` VARCHAR(255) NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NULL,

    PRIMARY KEY (`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `siswas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `nis` VARCHAR(20) NOT NULL,
    `kelas` VARCHAR(10) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `siswas_user_id_key`(`user_id`),
    UNIQUE INDEX `siswas_nis_key`(`nis`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gurus` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `nip` VARCHAR(20) NOT NULL,
    `gelar` VARCHAR(50) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `gurus_user_id_key`(`user_id`),
    UNIQUE INDEX `gurus_nip_key`(`nip`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `perusahaans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `kontak_person` VARCHAR(100) NULL,
    `website` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `perusahaans_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pkls` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `siswa_id` INTEGER NOT NULL,
    `guru_id` INTEGER NULL,
    `perusahaan_id` INTEGER NULL,
    `judul` VARCHAR(255) NOT NULL,
    `deskripsi` TEXT NULL,
    `tanggal_mulai` DATE NULL,
    `tanggal_selesai` DATE NULL,
    `status` ENUM('pengajuan', 'disetujui', 'ditolak', 'selesai') NOT NULL DEFAULT 'pengajuan',
    `laporan_akhir` VARCHAR(255) NULL,
    `catatan` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `pkls_siswa_id_idx`(`siswa_id`),
    INDEX `pkls_guru_id_idx`(`guru_id`),
    INDEX `pkls_perusahaan_id_idx`(`perusahaan_id`),
    INDEX `pkls_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jurnals` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pkl_id` INTEGER NOT NULL,
    `tanggal` DATE NOT NULL,
    `kegiatan` TEXT NOT NULL,
    `dokumentasi` VARCHAR(255) NULL,
    `komentar_dosen` TEXT NULL,
    `komentar_perusahaan` TEXT NULL,
    `status_dosen` ENUM('pending', 'disetujui', 'ditolak') NOT NULL DEFAULT 'pending',
    `status_perusahaan` ENUM('pending', 'disetujui', 'ditolak') NOT NULL DEFAULT 'pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `jurnals_pkl_id_idx`(`pkl_id`),
    INDEX `jurnals_status_dosen_idx`(`status_dosen`),
    INDEX `jurnals_status_perusahaan_idx`(`status_perusahaan`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `absensis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `siswa_id` INTEGER NOT NULL,
    `tanggal` DATE NOT NULL,
    `status` ENUM('hadir', 'sakit', 'izin', 'alpha') NOT NULL DEFAULT 'hadir',
    `keterangan` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `absensis_tanggal_idx`(`tanggal`),
    UNIQUE INDEX `absensis_siswa_id_tanggal_key`(`siswa_id`, `tanggal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `penilaians` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pkl_id` INTEGER NOT NULL,
    `guru_id` INTEGER NULL,
    `perusahaan_id` INTEGER NULL,
    `nilai_kedisiplinan` INTEGER NULL,
    `nilai_kerjasama` INTEGER NULL,
    `nilai_pengetahuan` INTEGER NULL,
    `nilai_keterampilan` INTEGER NULL,
    `nilai_laporan` INTEGER NULL,
    `total_nilai` INTEGER NULL,
    `komentar` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `penilaians_pkl_id_idx`(`pkl_id`),
    INDEX `penilaians_guru_id_idx`(`guru_id`),
    INDEX `penilaians_perusahaan_id_idx`(`perusahaan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `siswas` ADD CONSTRAINT `siswas_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gurus` ADD CONSTRAINT `gurus_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `perusahaans` ADD CONSTRAINT `perusahaans_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pkls` ADD CONSTRAINT `pkls_siswa_id_fkey` FOREIGN KEY (`siswa_id`) REFERENCES `siswas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pkls` ADD CONSTRAINT `pkls_guru_id_fkey` FOREIGN KEY (`guru_id`) REFERENCES `gurus`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pkls` ADD CONSTRAINT `pkls_perusahaan_id_fkey` FOREIGN KEY (`perusahaan_id`) REFERENCES `perusahaans`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jurnals` ADD CONSTRAINT `jurnals_pkl_id_fkey` FOREIGN KEY (`pkl_id`) REFERENCES `pkls`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `absensis` ADD CONSTRAINT `absensis_siswa_id_fkey` FOREIGN KEY (`siswa_id`) REFERENCES `siswas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penilaians` ADD CONSTRAINT `penilaians_pkl_id_fkey` FOREIGN KEY (`pkl_id`) REFERENCES `pkls`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penilaians` ADD CONSTRAINT `penilaians_guru_id_fkey` FOREIGN KEY (`guru_id`) REFERENCES `gurus`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penilaians` ADD CONSTRAINT `penilaians_perusahaan_id_fkey` FOREIGN KEY (`perusahaan_id`) REFERENCES `perusahaans`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

