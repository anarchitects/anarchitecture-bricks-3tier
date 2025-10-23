import { Module } from '@nestjs/common';
import { SubmissionsController } from './controllers/submissions.controller';
import { FormsController } from './controllers/forms.controller';
import { FormsApplicationModule } from '../application';

@Module({
  imports: [FormsApplicationModule],
  controllers: [SubmissionsController, FormsController],
})
export class FormsPresentationModule {}
