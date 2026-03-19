export type RateLimitScope = 'user' | 'email' | 'ip';

export interface RateLimitPolicy {
  scope: RateLimitScope;
  resource: string;
  action: string;
  capacity: number;
  refillRate: number;
}
