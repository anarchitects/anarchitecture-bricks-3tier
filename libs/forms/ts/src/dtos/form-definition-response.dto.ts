import { Static, Type } from '@sinclair/typebox';

const formField = Type.Object({
  name: Type.String(),
  kind: Type.Union([
    Type.Literal('string'),
    Type.Literal('email'),
    Type.Literal('textarea'),
    Type.Literal('boolean'),
    Type.Literal('select'),
    Type.Literal('file'),
  ]),
  required: Type.Optional(Type.Boolean()),
  minLength: Type.Optional(Type.Integer({ minimum: 0 })),
  maxLength: Type.Optional(Type.Integer({ minimum: 0 })),
  pattern: Type.Optional(Type.String()),
  options: Type.Optional(
    Type.Array(
      Type.Object({
        value: Type.String(),
        label: Type.String(),
      })
    )
  ),
  ui: Type.Optional(
    Type.Object({
      label: Type.Optional(Type.String()),
      placeholder: Type.Optional(Type.String()),
      rows: Type.Optional(Type.Integer({ minimum: 1 })),
      help: Type.Optional(Type.String()),
    })
  ),
});
export const FormDefinitionResponseSchema = Type.Object({
  id: Type.String(),
  version: Type.Integer({ minimum: 1 }),
  fields: Type.Array(formField),
  security: Type.Optional(
    Type.Object({
      honeypot: Type.Optional(Type.String()),
      captcha: Type.Union([
        Type.Literal('turnstile'),
        Type.Literal('hcaptcha'),
        Type.Literal('none'),
      ]),
    })
  ),
  delivery: Type.Optional(
    Type.Object({
      adminEmail: Type.Optional(Type.String({ format: 'email' })),
      subject: Type.Optional(Type.String()),
      templateId: Type.Optional(Type.String()),
      autoReply: Type.Optional(
        Type.Object({
          enabled: Type.Boolean(),
          templateId: Type.String(),
          subject: Type.String(),
        })
      ),
      webhooks: Type.Optional(
        Type.Array(
          Type.Object({
            url: Type.String({ format: 'uri' }),
            secret: Type.Optional(Type.String()),
          })
        )
      ),
    })
  ),
});

export type FormDefinitionResponseDTO = Static<
  typeof FormDefinitionResponseSchema
>;
