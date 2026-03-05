export type PublicPermission = {
  id: string;
  name: string;
  description: string | null;
  action: string;
  subject: string;
  conditions: Record<string, unknown> | null;
  fields: string[] | null;
  inverted: boolean;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicRole = {
  id: string;
  name: string;
  description: string | null;
  permissions: PublicPermission[] | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicUser = {
  id: string;
  email: string;
  userName: string | null;
  isActive: boolean;
  roles: PublicRole[] | null;
  createdAt: string;
  updatedAt: string;
};

export type PolicyRuleWire = {
  action: string;
  subject: string;
  conditions?: Record<string, unknown>;
  fields?: string[];
  inverted?: boolean;
  reason?: string;
};
