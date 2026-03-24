import { Action, Subject } from '@anarchitects/auth-ts/models';

export type RoutePolicy = {
  action: Action;
  subject: Subject;
};
