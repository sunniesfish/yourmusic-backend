import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1699500000000 implements MigrationInterface {
  name = 'InitialMigration1699500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // User 테이블 생성
    await queryRunner.query(`
      CREATE TABLE \`user\` (
        \`id\` varchar(255) NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`profileImg\` varchar(255) NULL,
        \`password\` varchar(255) NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Playlist 테이블 생성
    await queryRunner.query(`
      CREATE TABLE \`playlist\` (
        \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
        \`name\` varchar(255) NOT NULL,
        \`listJson\` json NOT NULL,
        \`thumbnail\` varchar(255) NULL,
        \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`userId\` varchar(255) NOT NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_playlist_userId\` (\`userId\`),
        CONSTRAINT \`FK_playlist_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`user\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Statistic 테이블 생성
    await queryRunner.query(`
      CREATE TABLE \`statistic\` (
        \`userId\` varchar(255) NOT NULL,
        \`artistRankJson\` json NOT NULL,
        \`albumRankJson\` json NOT NULL,
        \`titleRankJson\` json NOT NULL,
        \`updatedAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`userId\`),
        CONSTRAINT \`FK_statistic_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`user\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // RefreshToken 테이블 생성
    await queryRunner.query(`
      CREATE TABLE \`refresh_token\` (
        \`id\` varchar(36) NOT NULL,
        \`refreshToken\` varchar(255) NULL,
        \`user_id\` varchar(255) NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`REL_refresh_token_user_id\` (\`user_id\`),
        CONSTRAINT \`FK_refresh_token_user_id\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // SpotifyToken 테이블 생성
    await queryRunner.query(`
      CREATE TABLE \`spotify_token\` (
        \`userId\` varchar(255) NOT NULL,
        \`refreshToken\` text NULL,
        \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`userId\`),
        CONSTRAINT \`FK_spotify_token_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`user\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // YoutubeCredentials 테이블 생성
    await queryRunner.query(`
      CREATE TABLE \`youtube_credentials\` (
        \`userId\` varchar(255) NOT NULL,
        \`refreshToken\` text NULL,
        \`scope\` text NULL,
        \`tokenType\` text NULL,
        \`expiryDate\` bigint NULL,
        PRIMARY KEY (\`userId\`),
        CONSTRAINT \`FK_youtube_credentials_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`user\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 삭제는 생성의 역순으로 진행합니다
    await queryRunner.query(`DROP TABLE \`youtube_credentials\``);
    await queryRunner.query(`DROP TABLE \`spotify_token\``);
    await queryRunner.query(`DROP TABLE \`refresh_token\``);
    await queryRunner.query(`DROP TABLE \`statistic\``);
    await queryRunner.query(`DROP TABLE \`playlist\``);
    await queryRunner.query(`DROP TABLE \`user\``);
  }
}
