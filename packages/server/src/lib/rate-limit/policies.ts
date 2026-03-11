import { RateLimitPolicy } from '@homelab/shared/types';

/*
|--------------------------------------------------------------------------
| AUTH POLICIES
|--------------------------------------------------------------------------
*/

/**
 * Login attempts per email
 * Protect against brute force
 *
 * Burst: 5 attempts
 * Sustained: 5/min
 */
export const loginEmailPolicy: RateLimitPolicy = {
  scope: 'email',
  resource: 'auth',
  action: 'login',
  capacity: 5,
  refillRate: 5 / 60,
};

/**
 * Signup attempts per IP
 * Prevent bot account creation
 *
 * Burst: 3
 * Sustained: 3/min
 */
export const signupPolicy: RateLimitPolicy = {
  scope: 'ip',
  resource: 'auth',
  action: 'signup',
  capacity: 3,
  refillRate: 3 / 60,
};

/**
 * Password reset
 * Expensive operation (email + security)
 *
 * Burst: 2
 * Sustained: 3/hour
 */
export const passwordResetPolicy: RateLimitPolicy = {
  scope: 'email',
  resource: 'auth',
  action: 'password-reset',
  capacity: 2,
  refillRate: 3 / 3600,
};

/*
|--------------------------------------------------------------------------
| GLOBAL USER LIMIT
|--------------------------------------------------------------------------
*/

/**
 * Global user safety limit
 * Protects system from runaway clients
 *
 * Burst: 30
 * Sustained: 5 req/sec (300/min)
 */
export const globalUserPolicy: RateLimitPolicy = {
  scope: 'user',
  resource: 'global',
  action: 'requests',
  capacity: 30,
  refillRate: 5,
};

/*
|--------------------------------------------------------------------------
| CHAT
|--------------------------------------------------------------------------
*/

/**
 * Chat messages
 * Natural conversation pacing
 *
 * Burst: 5 messages
 * Sustained: 1 msg/sec
 */
export const chatSendPolicy: RateLimitPolicy = {
  scope: 'user',
  resource: 'chat',
  action: 'send',
  capacity: 5,
  refillRate: 1,
};

/*
|--------------------------------------------------------------------------
| STORAGE
|--------------------------------------------------------------------------
*/

/**
 * List files/folders
 * Read-heavy but safe
 *
 * Burst: 20
 * Sustained: 5/sec
 */
export const storageListPolicy: RateLimitPolicy = {
  scope: 'user',
  resource: 'storage',
  action: 'list',
  capacity: 20,
  refillRate: 5,
};

/**
 * File uploads
 * Disk IO + metadata writes
 *
 * Burst: 5
 * Sustained: 0.5/sec (30/min)
 */
export const uploadPolicy: RateLimitPolicy = {
  scope: 'user',
  resource: 'storage',
  action: 'upload',
  capacity: 20,
  refillRate: 0.5,
};

/**
 * Copy operation
 * Worker + filesystem IO
 *
 * Burst: 3
 * Sustained: 1 / 10 sec
 */
export const storageCopyPolicy: RateLimitPolicy = {
  scope: 'user',
  resource: 'storage',
  action: 'copy',
  capacity: 3,
  refillRate: 1 / 10,
};

/**
 * Move operation
 * Filesystem mutation
 *
 * Burst: 3
 * Sustained: 1 / 10 sec
 */
export const storageMovePolicy: RateLimitPolicy = {
  scope: 'user',
  resource: 'storage',
  action: 'move',
  capacity: 3,
  refillRate: 1 / 10,
};

/**
 * Delete operation
 * Dangerous + worker operation
 *
 * Burst: 3
 * Sustained: 1 / 10 sec
 */
export const storageDeletePolicy: RateLimitPolicy = {
  scope: 'user',
  resource: 'storage',
  action: 'delete',
  capacity: 3,
  refillRate: 1 / 10,
};

/**
 * File downloads
 * Network heavy but safe
 *
 * Burst: 10
 * Sustained: 2/sec
 */
export const storageDownloadPolicy: RateLimitPolicy = {
  scope: 'user',
  resource: 'storage',
  action: 'download',
  capacity: 10,
  refillRate: 2,
};
