import {
  AnxLayoutDefinition,
  AnxLayoutId,
  AnxLayoutKind,
} from '@anarchitects/common-angular-ui-layouts/contracts';

export type AnxLayoutDefaults = Partial<Record<AnxLayoutKind, AnxLayoutId>>;
export type AnxLayoutDefaultMap = Readonly<
  Record<string, AnxLayoutId | undefined>
>;

export type AnxResolvedLayout = {
  definition: AnxLayoutDefinition;
  source: 'explicit' | 'default' | 'fallback';
};
