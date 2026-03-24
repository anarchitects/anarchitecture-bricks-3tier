import { GUARDS_METADATA, ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import {
  AuthorizeResource,
  AUTHORIZE_RESOURCE_KEY,
} from './authorize-resource.decorator';
import { AuthorizedResource } from './authorized-resource.decorator';
import { ResourceAuthorizationGuard } from '../guards/resource-authorization.guard';

describe('resource authorization decorators', () => {
  type ParamFactory = (
    data: unknown,
    context: {
      switchToHttp: () => { getRequest: () => Record<string, unknown> };
      getHandler: () => (...args: never[]) => unknown;
      getClass: () => object;
    },
  ) => unknown;

  class TestController {
    @AuthorizeResource({ action: 'update', subject: 'Post', idParam: 'postId' })
    update() {
      return true;
    }

    loadDefault(@AuthorizedResource() post: unknown) {
      return post;
    }

    loadExplicit(@AuthorizedResource('Comment') comment: unknown) {
      return comment;
    }
  }

  it('stores resource authorization metadata and applies the guard', () => {
    expect(
      Reflect.getMetadata(
        AUTHORIZE_RESOURCE_KEY,
        TestController.prototype.update,
      ),
    ).toEqual([{ action: 'update', subject: 'Post', idParam: 'postId' }]);

    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      TestController.prototype.update,
    ) as Array<new (...args: unknown[]) => unknown>;

    expect(guards).toContain(ResourceAuthorizationGuard);
  });

  it('reads the attached authorized resource using route metadata by default', () => {
    class DefaultSubjectController {
      @AuthorizeResource({
        action: 'update',
        subject: 'Post',
        idParam: 'postId',
      })
      handler(@AuthorizedResource() post: unknown) {
        return post;
      }
    }

    const metadata = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      DefaultSubjectController,
      'handler',
    ) as Record<string, { factory: ParamFactory }>;
    const [{ factory }] = Object.values(metadata);

    const value = factory(undefined, {
      switchToHttp: () => ({
        getRequest: () => ({
          __authAuthorizedResources: {
            Post: { id: 'post-1' },
          },
        }),
      }),
      getHandler: () => DefaultSubjectController.prototype.handler,
      getClass: () => DefaultSubjectController,
    });

    expect(value).toEqual({ id: 'post-1' });
  });

  it('reads an explicitly requested authorized resource subject', () => {
    const metadata = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      TestController,
      'loadExplicit',
    ) as Record<string, { factory: ParamFactory; data: string }>;
    const [{ factory, data }] = Object.values(metadata);

    const value = factory(data, {
      switchToHttp: () => ({
        getRequest: () => ({
          __authAuthorizedResources: {
            Comment: { id: 'comment-1' },
          },
        }),
      }),
      getHandler: () => TestController.prototype.loadExplicit,
      getClass: () => TestController,
    });

    expect(value).toEqual({ id: 'comment-1' });
  });
});
