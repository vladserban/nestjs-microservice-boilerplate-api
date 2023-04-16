import { Injectable } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { ModelCtor } from 'sequelize-typescript';

import { CatsEntity } from '@/core/cats/entity/cats';
import { ICatsRepository } from '@/core/cats/repository/cats';
import { CatSchema } from '@/infra/database/postgres/schemas/cats';
import { SequelizeRepository } from '@/infra/repository/postgres/repository';
import { CatsListInput, CatsListOutput } from '@/modules/cats/types';
import { ConvertPaginateInputToSequelizeFilter } from '@/utils/decorators/convert-paginate-input-to-sequelize-filter.decorator';
import { SearchTypeEnum } from '@/utils/decorators/types';
import { ValidateDatabaseSortAllowed } from '@/utils/decorators/validate-database-sort-allowed.decorator';

type Model = ModelCtor<CatSchema> & CatsEntity;

@Injectable()
export class CatsRepository extends SequelizeRepository<Model> implements ICatsRepository {
  constructor(readonly repository: Model) {
    super(repository);
  }

  async startSession<TTransaction = Transaction>(): Promise<TTransaction> {
    const transaction = await this.repository.sequelize.transaction();

    return transaction as TTransaction;
  }

  @ValidateDatabaseSortAllowed(['createdAt', 'name', 'breed', 'age'])
  @ConvertPaginateInputToSequelizeFilter([
    { name: 'name', type: SearchTypeEnum.like },
    { name: 'breed', type: SearchTypeEnum.like },
    { name: 'age', type: SearchTypeEnum.equal }
  ])
  async paginate(input: CatsListInput): Promise<CatsListOutput> {
    const list = await this.repository.schema('schema2').findAndCountAll(input);

    return { docs: list.rows, limit: input.limit, page: input.page, total: list.count };
  }
}
