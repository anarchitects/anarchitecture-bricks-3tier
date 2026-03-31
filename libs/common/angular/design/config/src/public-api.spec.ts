import {
  AnxDesignRootDirective as RootDesignRootDirective,
  provideDocumentDesignSystemDomSync as provideRootDocumentDesignSystemDomSync,
} from '@anarchitects/common-angular-design';
import {
  AnxDesignRootDirective,
  provideDocumentDesignSystemDomSync,
} from './index';

describe('common-angular-design public api', () => {
  it('should expose the design root contract APIs from config and root entry points', () => {
    expect(RootDesignRootDirective).toBe(AnxDesignRootDirective);
    expect(provideRootDocumentDesignSystemDomSync).toBe(
      provideDocumentDesignSystemDomSync,
    );
  });
});
