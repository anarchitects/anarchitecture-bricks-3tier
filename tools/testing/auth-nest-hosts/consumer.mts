import assert from 'node:assert/strict';
import { Controller, Get, Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  Public,
  Policies,
  AUTH_PUBLIC_METADATA_KEY,
  POLICIES_KEY,
} from '@anarchitects/auth-declarations';
import { AuthModule } from '@anarchitects/auth-nest';
import { AuthService } from '@anarchitects/auth-nest/application';
import { identities } from './consumer.cjs';
assert.equal(Module, identities.Module);
assert.equal(AuthModule, identities.AuthModule);
assert.equal(AuthService, identities.AuthService);
assert.equal(AUTH_PUBLIC_METADATA_KEY, identities.AUTH_PUBLIC_METADATA_KEY);
@Controller('esm')
class EsmController {
  @Get()
  @Public()
  @Policies({ action: 'read', subject: 'Post' })
  route() {
    return true;
  }
}
const reflector = new Reflector();
assert.equal(
  reflector.get(AUTH_PUBLIC_METADATA_KEY, EsmController.prototype.route),
  true,
);
assert.deepEqual(reflector.get(POLICIES_KEY, EsmController.prototype.route), [
  { action: 'read', subject: 'Post' },
]);
console.log('Native ESM declarations, package loading and metadata passed.');
