import { Module } from '@nestjs/common';
import { FormsService } from './services/forms.service';
import { SubmissionsService } from './services/submissions.service';

@Module({
  imports: [],
  providers: [FormsService, SubmissionsService],
  exports: [FormsService, SubmissionsService],
})
export class FormsApplicationModule {}
