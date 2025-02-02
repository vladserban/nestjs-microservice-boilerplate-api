import { z } from 'zod';

import { ILoggerAdapter } from '@/infra/logger';
import { CreatedModel } from '@/infra/repository';
import { DatabaseOptionsType } from '@/utils/database/sequelize';
import { ValidateSchema } from '@/utils/decorators/validate-schema.decorator';

import { ICatsRepository } from '../repository/cats';
import { CatsEntity, CatsEntitySchema } from './../entity/cats';

export const CatsCreateSchema = CatsEntitySchema.pick({
  name: true,
  breed: true,
  age: true
});

export type CatsCreateInput = z.infer<typeof CatsCreateSchema>;
export type CatsCreateOutput = Promise<CreatedModel>;

export class CatsCreateUsecase {
  constructor(private readonly catsRepository: ICatsRepository, private readonly loggerServide: ILoggerAdapter) {}

  @ValidateSchema(CatsCreateSchema)
  async execute(input: CatsCreateInput): Promise<CatsCreateOutput> {
    const entity = new CatsEntity(input);

    const transaction = await this.catsRepository.startSession();
    try {
      const cats = await this.catsRepository.create<DatabaseOptionsType>(entity, { transaction });

      await transaction.commit();

      this.loggerServide.info({ message: 'cats created successfully.', obj: { cats } });

      return cats;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
