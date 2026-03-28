import { Inject, Injectable, Optional } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import type { BetterAuthOptions, Where } from 'better-auth';
import type {
  BetterAuthAdaptersModule,
  BetterAuthRuntimeModules,
} from './better-auth.module-loader';
import type { DataSource, EntityManager, EntityTarget, ObjectLiteral } from 'typeorm';
import { AUTH_APPLICATION_MODULE_OPTIONS } from '../../application/application.module-definition';
import { BetterAuthDatabasePort } from '../../application/services/better-auth-database.port';
import type { ResolvedAuthApplicationModuleOptions } from '../../config';
import { AccountEntity } from '../../infrastructure-persistence/entities/account.entity';
import { SessionEntity } from '../../infrastructure-persistence/entities/session.entity';
import { UserEntity } from '../../infrastructure-persistence/entities/user.entity';
import { VerificationEntity } from '../../infrastructure-persistence/entities/verification.entity';
import { loadBetterAuthRuntimeModules } from './better-auth.module-loader';
import { PasskeyEntity } from './plugins/passkeys/passkey.entity';

type SortBy = {
  field: string;
  direction: 'asc' | 'desc';
};

type CleanedWhereClause = Required<Where>;

type JoinConfig = Record<
  string,
  {
    on: {
      from: string;
      to: string;
    };
    limit?: number;
    relation?: 'one-to-one' | 'one-to-many' | 'many-to-many';
  }
>;

type AdapterCreator =
  Parameters<BetterAuthAdaptersModule['createAdapterFactory']>[0]['adapter'];

const MODEL_ENTITY_MAP = {
  user: UserEntity,
  users: UserEntity,
  account: AccountEntity,
  accounts: AccountEntity,
  session: SessionEntity,
  sessions: SessionEntity,
  verification: VerificationEntity,
  verifications: VerificationEntity,
  passkey: PasskeyEntity,
  passkeys: PasskeyEntity,
} as Record<string, EntityTarget<ObjectLiteral>>;

@Injectable()
export class BetterAuthTypeormDatabaseAdapter
  implements BetterAuthDatabasePort
{
  private resolvedDatabasePromise: Promise<unknown> | null = null;

  constructor(
    @Inject(AUTH_APPLICATION_MODULE_OPTIONS)
    private readonly options: ResolvedAuthApplicationModuleOptions,
    @Optional()
    @Inject(getDataSourceToken())
    private readonly dataSource?: DataSource,
  ) {}

  resolveDatabase(): Promise<unknown> {
    if (!this.resolvedDatabasePromise) {
      this.resolvedDatabasePromise = this.createDatabaseAdapter();
    }

    return this.resolvedDatabasePromise;
  }

  private async createDatabaseAdapter(): Promise<BetterAuthOptions['database']> {
    if (!this.dataSource) {
      throw new Error(
        'Better Auth TypeORM adapter persistence requires an active TypeORM DataSource.',
      );
    }

    const runtimeModules = await loadBetterAuthRuntimeModules();

    return createBetterAuthTypeormAdapter(
      this.dataSource,
      runtimeModules,
      this.options,
    );
  }
}

function createBetterAuthTypeormAdapter(
  dataSource: DataSource,
  runtimeModules: Pick<BetterAuthRuntimeModules, 'betterAuthAdapters'>,
  options: ResolvedAuthApplicationModuleOptions,
): BetterAuthOptions['database'] {
  void options;
  let lazyOptions: BetterAuthOptions | null = null;

  const getLazyOptions = (): BetterAuthOptions => {
    if (!lazyOptions) {
      throw new Error(
        'Better Auth TypeORM adapter was invoked before Better Auth options were initialized.',
      );
    }

    return lazyOptions;
  };

  const buildCustomAdapter = (manager: EntityManager): AdapterCreator =>
    ((config: unknown) => {
      const { getFieldName, getModelName, transformWhereClause } = config as {
        getFieldName: (input: { model: string; field: string }) => string;
        getModelName: (model: string) => string;
        transformWhereClause: (input: {
          model: string;
          where?: Where[];
          action:
            | 'create'
            | 'update'
            | 'findOne'
            | 'findMany'
            | 'updateMany'
            | 'delete'
            | 'deleteMany'
            | 'count';
        }) => CleanedWhereClause[] | undefined;
      };
      const getEntity = (model: string): EntityTarget<ObjectLiteral> => {
        const entity = MODEL_ENTITY_MAP[model];
        if (!entity) {
          throw new Error(`Unsupported Better Auth model: ${model}`);
        }

        return entity;
      };

      const getRepository = (model: string) =>
        manager.getRepository(getEntity(model));

      const getColumn = (model: string, field: string) =>
        getFieldName({ model, field });

      const applyWhere = (
        queryBuilder: {
          where: (condition: string, parameters?: Record<string, unknown>) => unknown;
          andWhere: (
            condition: string,
            parameters?: Record<string, unknown>,
          ) => unknown;
          orWhere: (
            condition: string,
            parameters?: Record<string, unknown>,
          ) => unknown;
        },
        model: string,
        where: CleanedWhereClause[] | undefined,
        alias = 'entity',
      ) => {
        if (!where || where.length === 0) {
          return;
        }

        where.forEach((clause, index) => {
          const field = getColumn(model, clause.field);
          const reference = alias ? `${alias}."${field}"` : `"${field}"`;
          const parameter = `where_${index}`;
          const nextCondition = buildWhereCondition(
            reference,
            parameter,
            clause,
          );

          if (index === 0) {
            queryBuilder.where(nextCondition.sql, nextCondition.parameters);
            return;
          }

          if (clause.connector === 'OR') {
            queryBuilder.orWhere(
              nextCondition.sql,
              nextCondition.parameters,
            );
            return;
          }

          queryBuilder.andWhere(nextCondition.sql, nextCondition.parameters);
        });
      };

      const attachJoinResults = async (
        rows: Record<string, unknown>[],
        join: JoinConfig | undefined,
      ): Promise<Record<string, unknown>[]> => {
        if (!join || rows.length === 0) {
          return rows;
        }

        const hydratedRows = rows.map((row) => ({ ...row }));

        for (const [joinModel, joinConfig] of Object.entries(join)) {
          const joinRepository = getRepository(joinModel);
          const joinProperty = getModelName(joinModel);
          const joinField = getColumn(joinModel, joinConfig.on.to);
          const sourceValues = [
            ...new Set(
              hydratedRows
                .map((row) => row[joinConfig.on.from])
                .filter((value) => value !== undefined && value !== null),
            ),
          ];

          if (sourceValues.length === 0) {
            hydratedRows.forEach((row) => {
              row[joinProperty] =
                joinConfig.relation === 'one-to-one' ? null : [];
            });
            continue;
          }

          const joinedRows = await joinRepository
            .createQueryBuilder('joined')
            .where(`joined."${joinField}" IN (:...values)`, {
              values: sourceValues,
            })
            .getMany();

          const groupedRows = new Map<unknown, Record<string, unknown>[]>();
          joinedRows.forEach((joinedRow) => {
            const groupKey = joinedRow[joinField as keyof typeof joinedRow];
            const existingRows = groupedRows.get(groupKey) ?? [];
            existingRows.push(joinedRow as unknown as Record<string, unknown>);
            groupedRows.set(groupKey, existingRows);
          });

          hydratedRows.forEach((row) => {
            const relatedRows = groupedRows.get(row[joinConfig.on.from]) ?? [];
            if (joinConfig.relation === 'one-to-one') {
              row[joinProperty] = relatedRows[0] ?? null;
              return;
            }

            row[joinProperty] = relatedRows.slice(0, joinConfig.limit ?? 100);
          });
        }

        return hydratedRows;
      };

      const applySort = (
        queryBuilder: {
          orderBy: (
            sort: string,
            direction?: 'ASC' | 'DESC',
          ) => unknown;
        },
        model: string,
        sortBy?: SortBy,
        alias = 'entity',
      ) => {
        if (!sortBy) {
          return;
        }

        queryBuilder.orderBy(
          `${alias}."${getColumn(model, sortBy.field)}"`,
          sortBy.direction.toUpperCase() as 'ASC' | 'DESC',
        );
      };

      return {
        async create({
          model,
          data,
        }: {
          model: string;
          data: Record<string, unknown>;
        }) {
          const repository = getRepository(model);
          const createdEntity = repository.create(data);
          return repository.save(createdEntity);
        },
        async findOne<T>({
          model,
          where,
          join,
        }: {
          model: string;
          where: CleanedWhereClause[];
          join?: JoinConfig;
        }): Promise<T | null> {
          const transformedWhere = transformWhereClause({
            model,
            where,
            action: 'findOne',
          });
          const repository = getRepository(model);
          const queryBuilder = repository.createQueryBuilder('entity');
          applyWhere(queryBuilder, model, transformedWhere);
          const result = await queryBuilder.getOne();
          if (!result) {
            return null;
          }

          const hydratedRows = await attachJoinResults(
            [result as unknown as Record<string, unknown>],
            join,
          );
          return (hydratedRows[0] ?? null) as T | null;
        },
        async findMany<T>({
          model,
          where,
          limit,
          sortBy,
          offset,
          join,
        }: {
          model: string;
          where?: CleanedWhereClause[];
          limit: number;
          sortBy?: SortBy;
          offset?: number;
          join?: JoinConfig;
        }): Promise<T[]> {
          const transformedWhere = transformWhereClause({
            model,
            where,
            action: 'findMany',
          });
          const repository = getRepository(model);
          const queryBuilder = repository.createQueryBuilder('entity');
          applyWhere(queryBuilder, model, transformedWhere);
          applySort(queryBuilder, model, sortBy);
          queryBuilder.take(limit);
          if (offset !== undefined) {
            queryBuilder.skip(offset);
          }

          const results = await queryBuilder.getMany();
          const hydratedResults = await attachJoinResults(
            results as unknown as Record<string, unknown>[],
            join,
          );
          return hydratedResults as T[];
        },
        async count({
          model,
          where,
        }: {
          model: string;
          where?: CleanedWhereClause[];
        }): Promise<number> {
          const transformedWhere = transformWhereClause({
            model,
            where,
            action: 'count',
          });
          const repository = getRepository(model);
          const queryBuilder = repository.createQueryBuilder('entity');
          applyWhere(queryBuilder, model, transformedWhere);
          return queryBuilder.getCount();
        },
        async update<T>({
          model,
          where,
          update,
        }: {
          model: string;
          where: CleanedWhereClause[];
          update: Record<string, unknown>;
        }): Promise<T | null> {
          const transformedWhere = transformWhereClause({
            model,
            where,
            action: 'update',
          });
          const entity = getEntity(model);
          const queryBuilder = manager.createQueryBuilder().update(entity).set(update);
          applyWhere(queryBuilder, model, transformedWhere, '');
          const updateResult = await queryBuilder.execute();
          if (!updateResult.affected) {
            return null;
          }

          return this.findOne({
            model,
            where: transformedWhere as CleanedWhereClause[],
          }) as Promise<T | null>;
        },
        async updateMany({
          model,
          where,
          update,
        }: {
          model: string;
          where: CleanedWhereClause[];
          update: Record<string, unknown>;
        }): Promise<number> {
          const transformedWhere = transformWhereClause({
            model,
            where,
            action: 'updateMany',
          });
          const entity = getEntity(model);
          const queryBuilder = manager.createQueryBuilder().update(entity).set(update);
          applyWhere(queryBuilder, model, transformedWhere, '');
          const updateResult = await queryBuilder.execute();
          return updateResult.affected ?? 0;
        },
        async delete({
          model,
          where,
        }: {
          model: string;
          where: CleanedWhereClause[];
        }): Promise<void> {
          const transformedWhere = transformWhereClause({
            model,
            where,
            action: 'delete',
          });
          const entity = getEntity(model);
          const queryBuilder = manager.createQueryBuilder().delete().from(entity);
          applyWhere(queryBuilder, model, transformedWhere, '');
          await queryBuilder.execute();
        },
        async deleteMany({
          model,
          where,
        }: {
          model: string;
          where: CleanedWhereClause[];
        }): Promise<number> {
          const transformedWhere = transformWhereClause({
            model,
            where,
            action: 'deleteMany',
          });
          const entity = getEntity(model);
          const queryBuilder = manager.createQueryBuilder().delete().from(entity);
          applyWhere(queryBuilder, model, transformedWhere, '');
          const deleteResult = await queryBuilder.execute();
          return deleteResult.affected ?? 0;
        },
        options: {
          provider: 'typeorm',
          engine: 'typeorm',
        },
      };
    }) as AdapterCreator;

  const adapterOptions: Parameters<
    BetterAuthAdaptersModule['createAdapterFactory']
  >[0] = {
    config: {
      adapterId: 'anarchitects-typeorm',
      adapterName: 'Anarchitects TypeORM Adapter',
      usePlural: true,
      supportsBooleans: true,
      supportsDates: true,
      supportsJSON: true,
      supportsUUIDs: true,
      transaction: async (callback) =>
        dataSource.transaction((transactionManager) =>
          callback(
            runtimeModules.betterAuthAdapters.createAdapterFactory({
              config: adapterOptions.config,
              adapter: buildCustomAdapter(transactionManager),
            })(getLazyOptions()),
          ),
        ),
    },
    adapter: buildCustomAdapter(dataSource.manager),
  };

  const adapter =
    runtimeModules.betterAuthAdapters.createAdapterFactory(adapterOptions);

  return ((nextOptions: BetterAuthOptions) => {
    lazyOptions = nextOptions;
    return adapter(nextOptions);
  }) as BetterAuthOptions['database'];
}

function buildWhereCondition(
  reference: string,
  parameter: string,
  clause: CleanedWhereClause,
): {
  sql: string;
  parameters?: Record<string, unknown>;
} {
  switch (clause.operator) {
    case 'in':
      return {
        sql: `${reference} IN (:...${parameter})`,
        parameters: { [parameter]: clause.value },
      };
    case 'not_in':
      return {
        sql: `${reference} NOT IN (:...${parameter})`,
        parameters: { [parameter]: clause.value },
      };
    case 'contains':
      return {
        sql: `${reference} LIKE :${parameter}`,
        parameters: { [parameter]: `%${String(clause.value)}%` },
      };
    case 'starts_with':
      return {
        sql: `${reference} LIKE :${parameter}`,
        parameters: { [parameter]: `${String(clause.value)}%` },
      };
    case 'ends_with':
      return {
        sql: `${reference} LIKE :${parameter}`,
        parameters: { [parameter]: `%${String(clause.value)}` },
      };
    case 'ne':
      if (clause.value === null) {
        return {
          sql: `${reference} IS NOT NULL`,
        };
      }

      return {
        sql: `${reference} <> :${parameter}`,
        parameters: { [parameter]: clause.value },
      };
    case 'lt':
      return {
        sql: `${reference} < :${parameter}`,
        parameters: { [parameter]: clause.value },
      };
    case 'lte':
      return {
        sql: `${reference} <= :${parameter}`,
        parameters: { [parameter]: clause.value },
      };
    case 'gt':
      return {
        sql: `${reference} > :${parameter}`,
        parameters: { [parameter]: clause.value },
      };
    case 'gte':
      return {
        sql: `${reference} >= :${parameter}`,
        parameters: { [parameter]: clause.value },
      };
    case 'eq':
    default:
      if (clause.value === null) {
        return {
          sql: `${reference} IS NULL`,
        };
      }

      return {
        sql: `${reference} = :${parameter}`,
        parameters: { [parameter]: clause.value },
      };
  }
}
