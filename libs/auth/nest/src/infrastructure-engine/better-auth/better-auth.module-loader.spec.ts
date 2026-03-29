import { importEsmModule } from './dynamic-import';
import { loadBetterAuthTypeormAdapterModule } from './better-auth.module-loader';

jest.mock('./dynamic-import', () => ({
  importEsmModule: jest.fn(),
}));

describe('loadBetterAuthTypeormAdapterModule', () => {
  it('loads the external adapter through the shared ESM import helper', async () => {
    const moduleNamespace = {
      createBetterAuthTypeormAdapter: jest.fn(),
    };
    (importEsmModule as jest.Mock).mockResolvedValue(moduleNamespace);

    await expect(loadBetterAuthTypeormAdapterModule()).resolves.toBe(
      moduleNamespace,
    );
    expect(importEsmModule).toHaveBeenCalledWith(
      '@anarchitects/better-auth-typeorm-adapter',
    );
  });
});
