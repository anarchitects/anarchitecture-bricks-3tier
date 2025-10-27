import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { SubmissionEntity } from '@anarchitects/forms-nest/infrastructure-persistence';

const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'anarchitects',
  password: 'anarchitects',
  database: 'anarchitects',
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  namingStrategy: new SnakeNamingStrategy(),
  migrations: ['migrations/*{.ts,.js}'],
  entities: [SubmissionEntity],
});

export default dataSource;
