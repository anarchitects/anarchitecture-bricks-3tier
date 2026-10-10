import { nestPackages } from './nest-package-contract.mjs';
import { validatePackedNestPackages } from './validate-nest-package-compatibility.mjs';

validatePackedNestPackages(
  nestPackages.filter(({ name }) =>
    ['auth-nest', 'forms-nest', 'identity-nest'].includes(name),
  ),
);
