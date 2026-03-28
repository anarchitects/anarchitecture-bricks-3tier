import { RefreshTokenRequestDTO } from '@anarchitects/auth-ts/dtos/jwt';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { FormConfig } from '@anarchitects/forms-ts/models';

type RefreshTokensFormBridge = {
  resolveFormConfig(): FormConfig;
  mapSubmission(input: SubmissionRequestDTO): RefreshTokenRequestDTO | undefined;
};

const REFRESH_TOKENS_FORM_CONFIG: FormConfig = {
  id: 'refresh-tokens',
  version: 1,
  fields: [
    {
      name: 'refreshToken',
      kind: 'string',
      required: false,
      minLength: 1,
      ui: { label: 'Refresh Token' },
    },
  ],
};

const readPayloadString = (
  input: SubmissionRequestDTO,
  key: string,
): string | undefined => input.payload[key] as string | undefined;

const readStoredString = (key: string): string | undefined =>
  localStorage.getItem(key) || undefined;

export const refreshTokensFormBridge: RefreshTokensFormBridge = {
  resolveFormConfig: () => REFRESH_TOKENS_FORM_CONFIG,
  mapSubmission: (input) => {
    const refreshToken =
      readPayloadString(input, 'refreshToken') || readStoredString('refreshToken');

    if (!refreshToken) {
      return undefined;
    }

    return { refreshToken };
  },
};
