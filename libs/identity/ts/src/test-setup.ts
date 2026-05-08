import { TypeSystem } from '@sinclair/typebox/system';

TypeSystem.Format(
  'date-time',
  (value) => typeof value === 'string' && !Number.isNaN(Date.parse(value)),
);
