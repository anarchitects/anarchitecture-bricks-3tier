import { Module } from '@nestjs/common';
import { FormsService } from './services/forms.service';
import { SubmissionsService } from './services/submissions.service';
import { FormsInfrastructureMailerModule } from '../infrastructure-mailer';
import { FormsInfrastructurePersistenceModule } from '../infrastructure-persistence';

@Module({
  imports: [
    FormsInfrastructurePersistenceModule,
    FormsInfrastructureMailerModule,
  ],
  providers: [FormsService, SubmissionsService],
  exports: [FormsService, SubmissionsService],
})
export class FormsApplicationModule {}
