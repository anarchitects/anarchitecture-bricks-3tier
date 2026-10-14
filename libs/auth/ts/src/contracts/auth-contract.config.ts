import type { AuthContractConfig } from '@anarchitects/auth-contracts';

export { DefaultAuthContractConfig } from '@anarchitects/auth-contracts';
export type {
  AuthContractConfig,
  AuthFieldConfig,
  EmptyStringPolicy,
} from '@anarchitects/auth-contracts';

// Preserve the existing consumer-facing names; Contracts owns their definitions.
export type RegisterFieldConfig = AuthContractConfig['register'];
export type LoginFieldConfig = AuthContractConfig['login'];
export type ForgotPasswordFieldConfig = AuthContractConfig['forgotPassword'];
export type ResetPasswordFieldConfig = AuthContractConfig['resetPassword'];
export type VerifyEmailFieldConfig = AuthContractConfig['verifyEmail'];
export type ChangePasswordFieldConfig = AuthContractConfig['changePassword'];
export type LogoutFieldConfig = AuthContractConfig['logout'];
