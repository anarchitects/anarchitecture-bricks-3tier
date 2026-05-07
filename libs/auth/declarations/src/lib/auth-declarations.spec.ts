import 'reflect-metadata';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  AUTHORIZE_RESOURCE_KEY,
  AUTH_PUBLIC_METADATA_KEY,
  AuthorizeResource,
  POLICIES_KEY,
  Policies,
  Public,
  RequirePermissions,
  RequireResourceAccess,
} from './auth-declarations';

const collectProductionSourceFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      return collectProductionSourceFiles(fullPath);
    }

    if (!entry.endsWith('.ts') || entry.endsWith('.spec.ts')) {
      return [];
    }

    return [fullPath];
  });

const collectControllerAndFeatureSourceFiles = (directory: string): string[] =>
  collectProductionSourceFiles(directory).filter(
    (filePath) =>
      filePath.includes('/controllers/') || filePath.includes('/feature/'),
  );

describe('auth security declaration decorators', () => {
  @Public()
  class PublicController {
    @Public()
    health() {
      return true;
    }
  }

  class ProtectedController {
    @Policies({ action: 'update', subject: 'Post' })
    byPolicy() {
      return true;
    }

    @AuthorizeResource({
      action: 'update',
      subject: 'Post',
      idParam: 'postId',
    })
    byAuthorizedResource() {
      return true;
    }

    @RequirePermissions({ action: 'delete', subject: 'Post' })
    byPermissionAlias() {
      return true;
    }

    @RequireResourceAccess({
      action: 'delete',
      subject: 'Post',
      idParam: 'postId',
    })
    byResourceAccessAlias() {
      return true;
    }
  }

  it('does not import runtime auth-nest or guard/provider/module APIs', () => {
    const sourceRoot = join(import.meta.dirname, '..');
    const source = collectProductionSourceFiles(sourceRoot)
      .map((filePath) => readFileSync(filePath, 'utf8'))
      .join('\n');

    expect(source).not.toContain('@anarchitects/auth-nest');
    expect(source).not.toMatch(/\bUseGuards\b/);
    expect(source).not.toMatch(
      /\b(CanActivate|ExecutionContext|Injectable|Module|Provider)\b/,
    );
  });

  it('keeps controller and feature bricks on declaration-only security imports', () => {
    const workspaceRoot = join(
      import.meta.dirname,
      '..',
      '..',
      '..',
      '..',
      '..',
    );
    const source = collectControllerAndFeatureSourceFiles(
      join(workspaceRoot, 'libs'),
    )
      .map((filePath) => readFileSync(filePath, 'utf8'))
      .join('\n');

    expect(source).not.toMatch(
      /from ['"]@anarchitects\/auth-nest(?:\/presentation)?['"]/,
    );
    expect(source).not.toMatch(/\bUseGuards\b/);
    expect(source).not.toMatch(
      /\b(AuthenticationGuard|AuthorizationGuard|PoliciesGuard|ResourceAuthorizationGuard|provideAuthRuntimeGuards)\b/,
    );
  });

  it('marks classes and methods as public using declaration metadata only', () => {
    expect(
      Reflect.getMetadata(AUTH_PUBLIC_METADATA_KEY, PublicController),
    ).toBe(true);
    expect(
      Reflect.getMetadata(
        AUTH_PUBLIC_METADATA_KEY,
        PublicController.prototype.health,
      ),
    ).toBe(true);
  });

  it('stores CASL-aligned route policy declarations', () => {
    expect(
      Reflect.getMetadata(POLICIES_KEY, ProtectedController.prototype.byPolicy),
    ).toEqual([{ action: 'update', subject: 'Post' }]);
  });

  it('stores resource authorization declarations without binding guards', () => {
    expect(
      Reflect.getMetadata(
        AUTHORIZE_RESOURCE_KEY,
        ProtectedController.prototype.byAuthorizedResource,
      ),
    ).toEqual([{ action: 'update', subject: 'Post', idParam: 'postId' }]);
  });

  it('keeps convenience decorators on the same metadata model', () => {
    expect(
      Reflect.getMetadata(
        POLICIES_KEY,
        ProtectedController.prototype.byPermissionAlias,
      ),
    ).toEqual([{ action: 'delete', subject: 'Post' }]);
    expect(
      Reflect.getMetadata(
        AUTHORIZE_RESOURCE_KEY,
        ProtectedController.prototype.byResourceAccessAlias,
      ),
    ).toEqual([{ action: 'delete', subject: 'Post', idParam: 'postId' }]);
  });
});
