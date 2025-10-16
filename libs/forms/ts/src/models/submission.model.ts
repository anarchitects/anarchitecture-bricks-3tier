export type Submission = {
  id: string;
  formId: string;
  formVersion: number;
  payload: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};
