import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FormConfig } from '@anarchitects/forms-ts/models';
import { Repository } from 'typeorm';
import { FormConfigEntity } from '../entities/form-config.entity';
import { FormConfigsRepository } from './form-configs.repository';

@Injectable()
export class TypeOrmFormConfigsRepository implements FormConfigsRepository {
  constructor(
    @InjectRepository(FormConfigEntity)
    private readonly repo: Repository<FormConfigEntity>,
  ) {}

  async getFormConfig(
    formId: string,
    formVersion: number,
  ): Promise<FormConfig> {
    const config = await this.repo.findOne({
      where: { id: formId, version: formVersion },
    });

    if (!config) {
      throw new NotFoundException(
        `Form config ${formId}@${formVersion} not found`,
      );
    }

    return config;
  }
}
