import { Module } from '@nestjs/common';
import { SubmissionsController } from './controllers/submissions.controller';
import { FormsController } from './controllers/forms.controller';
import { FormsService, SubmissionsService } from '../application';

@Module({
  imports: [SubmissionsService, FormsService],
  controllers: [SubmissionsController, FormsController],
})
export class PresentationModule {}
