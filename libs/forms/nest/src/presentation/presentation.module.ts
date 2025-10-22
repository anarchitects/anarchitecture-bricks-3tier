import { Module } from '@nestjs/common';
import { SubmissionsController } from './controllers/submissions.controller';
import { FormsController } from './controllers/forms.controller';
import { FormsApplicationModule } from '../application';
import { FormsPersistenceModule } from '../infrastructure-persistence';
import { FormsMailerModule } from '../infrastructure-mailer';

@Module({
  imports: [FormsApplicationModule, FormsPersistenceModule, FormsMailerModule],
  controllers: [SubmissionsController, FormsController],
})
export class FormsPresentationModule {}
