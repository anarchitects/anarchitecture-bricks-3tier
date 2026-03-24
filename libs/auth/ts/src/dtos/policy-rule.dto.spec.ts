import { Value } from '@sinclair/typebox/value';
import {
  parsePolicyRuleArrayDTO,
  parsePolicyRuleDTO,
  PolicyRuleArraySchema,
  PolicyRuleSchema,
} from './policy-rule.dto';

describe('PolicyRuleSchema', () => {
  const validateRule = (payload: unknown) => [
    ...Value.Errors(PolicyRuleSchema, payload),
  ];

  const validateRules = (payload: unknown) => [
    ...Value.Errors(PolicyRuleArraySchema, payload),
  ];

  it('accepts a valid minimal rule', () => {
    expect(validateRule({ action: 'read', subject: 'Document' })).toHaveLength(
      0,
    );
  });

  it('accepts a valid rule with all optional fields', () => {
    expect(
      validateRule({
        action: 'manage',
        subject: 'Project',
        conditions: { ownerId: 'user-1' },
        fields: ['name', 'status'],
        inverted: true,
        reason: 'Restricted to owners',
      }),
    ).toHaveLength(0);
  });

  it('rejects a missing action', () => {
    expect(validateRule({ subject: 'Document' })).not.toHaveLength(0);
  });

  it('rejects a missing subject', () => {
    expect(validateRule({ action: 'read' })).not.toHaveLength(0);
  });

  it('rejects a non-object rule entry', () => {
    expect(validateRule('read:Document')).not.toHaveLength(0);
  });

  it('rejects fields when not an array of strings', () => {
    expect(
      validateRule({
        action: 'update',
        subject: 'Document',
        fields: 'title',
      }),
    ).not.toHaveLength(0);

    expect(
      validateRule({
        action: 'update',
        subject: 'Document',
        fields: ['title', 1],
      }),
    ).not.toHaveLength(0);
  });

  it('rejects non-object conditions', () => {
    expect(
      validateRule({
        action: 'read',
        subject: 'Document',
        conditions: ['ownerId'],
      }),
    ).not.toHaveLength(0);
  });

  it('rejects a non-boolean inverted flag', () => {
    expect(
      validateRule({
        action: 'delete',
        subject: 'Comment',
        inverted: 'true',
      }),
    ).not.toHaveLength(0);
  });

  it('rejects a non-string reason', () => {
    expect(
      validateRule({
        action: 'delete',
        subject: 'Comment',
        reason: 123,
      }),
    ).not.toHaveLength(0);
  });

  it('rejects unexpected extra properties', () => {
    expect(
      validateRule({
        action: 'read',
        subject: 'Document',
        extra: true,
      }),
    ).not.toHaveLength(0);
  });

  it('parses and clones validated rules', () => {
    const parsed = parsePolicyRuleDTO({
      action: 'manage',
      subject: 'Project',
      conditions: { ownerId: 'user-1' },
      fields: ['name'],
    });

    expect(parsed).toEqual({
      action: 'manage',
      subject: 'Project',
      conditions: { ownerId: 'user-1' },
      fields: ['name'],
      inverted: undefined,
      reason: undefined,
    });
  });

  it('parses validated rule arrays', () => {
    const parsed = parsePolicyRuleArrayDTO([
      { action: 'read', subject: 'Document' },
      { action: 'update', subject: 'Document', fields: ['title'] },
    ]);

    expect(parsed).toEqual([
      { action: 'read', subject: 'Document' },
      { action: 'update', subject: 'Document', fields: ['title'] },
    ]);
  });

  it('rejects malformed rule arrays', () => {
    expect(
      validateRules([{ action: 'read', subject: 'Document' }, { action: 1 }]),
    ).not.toHaveLength(0);

    expect(() => parsePolicyRuleArrayDTO([{ action: 'read' }])).toThrow(
      /Invalid policy rules/,
    );
  });
});
