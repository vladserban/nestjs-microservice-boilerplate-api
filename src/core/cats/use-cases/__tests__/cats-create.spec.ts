import { Test } from '@nestjs/testing';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { ICatsCreateAdapter } from '@/modules/cats/adapter';
import { ApiInternalServerException } from '@/utils/exception';
import { expectZodError } from '@/utils/tests';

import { ICatsRepository } from '../../repository/cats';
import { CatsCreateUsecase } from '../cats-create';

describe('CatsCreateUsecase', () => {
  let usecase: ICatsCreateAdapter;
  let repository: ICatsRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        {
          provide: ICatsRepository,
          useValue: {}
        },
        {
          provide: ICatsCreateAdapter,
          useFactory: (catsRepository: ICatsRepository, logger: ILoggerAdapter) => {
            return new CatsCreateUsecase(catsRepository, logger);
          },
          inject: [ICatsRepository, ILoggerAdapter]
        }
      ]
    }).compile();

    usecase = app.get(ICatsCreateAdapter);
    repository = app.get(ICatsRepository);
  });

  test('should throw error when invalid parameters', async () => {
    await expectZodError(
      () => usecase.execute({}),
      (issues) => {
        expect(issues).toEqual([
          { message: 'Required', path: 'name' },
          { message: 'Required', path: 'breed' },
          { message: 'Required', path: 'age' }
        ]);
      }
    );
  });

  test('should cats create successfully', async () => {
    const cat = { age: 10, breed: 'dummy', name: 'dummy' };
    repository.create = jest.fn().mockResolvedValue(cat);
    repository.startSession = jest.fn().mockResolvedValue({
      commit: jest.fn(),
      rollback: jest.fn()
    });
    await expect(usecase.execute(cat)).resolves.toEqual(cat);
  });

  test('should throw error when create with transaction', async () => {
    const cat = { age: 10, breed: 'dummy', name: 'dummy' };
    repository.startSession = jest.fn().mockResolvedValue({
      commit: jest.fn(),
      rollback: jest.fn()
    });
    repository.create = jest.fn().mockRejectedValue(new ApiInternalServerException('transactionError'));
    await expect(usecase.execute(cat)).rejects.toThrow(ApiInternalServerException);
  });
});
