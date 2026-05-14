import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',

        // Using typed namespace now — config.get('database.host')
        // instead of config.get('DB_HOST')
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.database'),

        // TypeORM will scan for any file ending in .entity.ts
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],

        // Migrations folder — you'll use this from Week 2 onwards
        migrations: [__dirname + '/../migrations/*{.ts,.js}'],

        // synchronize: true = TypeORM auto-creates/alters tables
        // ONLY safe in development — in production always use migrations
        synchronize: config.get('NODE_ENV') === 'development',

        logging: config.get('NODE_ENV') === 'development',
      }),
    }),
  ],
})
export class DatabaseModule {}