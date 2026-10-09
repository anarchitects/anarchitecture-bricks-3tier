import 'reflect-metadata';
import assert from 'node:assert/strict';
import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { FastifyAdapter, RouteSchema } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';

// A framework host probe, not a certification of any published brick.
@Injectable()
class ProbeService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  result() {
    const token = this.jwt.sign({ subject: 'nest-host-probe' });
    assert.equal(this.jwt.verify(token).subject, 'nest-host-probe');
    return { status: this.config.getOrThrow<string>('probe.status') };
  }
}

@Controller('probe')
class ProbeController {
  constructor(private readonly service: ProbeService) {}

  @Get()
  @RouteSchema({
    response: {
      200: {
        type: 'object',
        properties: { status: { type: 'string' } },
        required: ['status'],
        additionalProperties: false,
      },
    },
  })
  get() {
    return this.service.result();
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvFile: true,
      ignoreEnvVars: true,
      load: [() => ({ probe: { status: 'ok' } })],
    }),
    JwtModule.register({ secret: 'local-nest-host-probe-only' }),
  ],
  controllers: [ProbeController],
  providers: [ProbeService],
})
class ProbeModule {}

// Compare these with native ESM imports to catch separate framework identities.
export const frameworkIdentity = { Module, Test, FastifyAdapter };

export async function runProbe() {
  const moduleRef = await Test.createTestingModule({
    imports: [ProbeModule],
  }).compile();
  const app = moduleRef.createNestApplication(new FastifyAdapter());
  try {
    await app.init();
    const server = app.getHttpAdapter().getInstance();
    await server.ready();
    const response = await server.inject({ method: 'GET', url: '/probe' });
    assert.equal(response.statusCode, 200, response.body);
    assert.deepEqual(response.json(), { status: 'ok' });
  } finally {
    await app.close();
  }
}
