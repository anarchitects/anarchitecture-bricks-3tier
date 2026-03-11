import { Global, Module } from '@nestjs/common';
import { CommonNodeMailerModule } from '@anarchitects/common-nest-mailer';

@Global()
@Module({
  imports: [CommonNodeMailerModule],
  exports: [CommonNodeMailerModule],
})
export class AuthMailerModule {}
