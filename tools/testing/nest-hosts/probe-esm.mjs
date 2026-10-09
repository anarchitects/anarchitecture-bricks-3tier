import assert from 'node:assert/strict';
import { Module } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { frameworkIdentity, runProbe } from './out/probe.cjs';

assert.equal(Module, frameworkIdentity.Module);
assert.equal(Test, frameworkIdentity.Test);
assert.equal(FastifyAdapter, frameworkIdentity.FastifyAdapter);
await runProbe();
console.log(
  'ESM host: shared framework identity, DI, config, JWT and HTTP passed',
);
