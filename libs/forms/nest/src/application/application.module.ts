import { Module } from '@nestjs/common';
import { FormsService } from './services/forms.service';
import { SubmissionsService } from './services/submissions.service';
import { FormsInfrastructurePersistenceModule } from '../infrastructure-persistence';

@Module({
  imports: [
    FormsInfrastructurePersistenceModule.forRoot({ persistence: 'typeorm' }),
  ],
  providers: [FormsService, SubmissionsService],
  exports: [FormsService, SubmissionsService],
})
export class FormsApplicationModule {}
