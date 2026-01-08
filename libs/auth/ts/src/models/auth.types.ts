export type Action =
  | 'manage'
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'publish'
  | 'invite'
  | (string & {});

export type Subject = 'all' | (string & {});

export interface PolicyRule {
  action: Action;
  subject: Subject;
  conditions?: Record<string, unknown>;
  fields?: string[];
  inverted?: boolean;
  reason?: string;
}
