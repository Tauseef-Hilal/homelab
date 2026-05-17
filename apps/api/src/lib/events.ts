import { EventEmitter } from 'events';

class DomainEventsEmitter extends EventEmitter {}

export const domainEvents = new DomainEventsEmitter();

export enum DomainEvent {
  USER_CREATED = 'USER_CREATED',
}
