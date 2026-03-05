import { SubmissionRequestDTO } from '../dtos/submission-request.dto';
import { SubmissionResponseDTO } from '../dtos/submission-response.dto';
import { Submission } from '../models/submission.model';
import { fromIsoDateTime, toIsoDateTime } from './date-time';

type SubmissionRequestModel = Pick<Submission, 'formId' | 'formVersion' | 'payload'>;

const clonePayload = (
  payload: Record<string, unknown>,
): Record<string, unknown> => ({ ...payload });

export const toSubmissionRequestDTO = (
  model: SubmissionRequestModel,
): SubmissionRequestDTO => ({
  formId: model.formId,
  formVersion: model.formVersion,
  payload: clonePayload(model.payload),
});

export const fromSubmissionRequestDTO = (
  dto: SubmissionRequestDTO,
): SubmissionRequestModel => ({
  formId: dto.formId,
  formVersion: dto.formVersion,
  payload: clonePayload(dto.payload),
});

export const toSubmissionResponseDTO = (
  model: Submission,
): SubmissionResponseDTO => ({
  id: model.id,
  formId: model.formId,
  formVersion: model.formVersion,
  payload: clonePayload(model.payload),
  createdAt: toIsoDateTime(model.createdAt, 'createdAt'),
  updatedAt: toIsoDateTime(model.updatedAt, 'updatedAt'),
});

export const fromSubmissionResponseDTO = (
  dto: SubmissionResponseDTO,
): Submission => ({
  id: dto.id,
  formId: dto.formId,
  formVersion: dto.formVersion,
  payload: clonePayload(dto.payload),
  createdAt: fromIsoDateTime(dto.createdAt, 'createdAt'),
  updatedAt: fromIsoDateTime(dto.updatedAt, 'updatedAt'),
});
