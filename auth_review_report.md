# Server-Side Auth Code Review Report

Here is a comprehensive, FAANG-grade technical code review of the server-side Auth feature. The architecture employs a standard JWT-based authentication system with Prisma, Redis for OTPs, and Zod for validation. While the foundation is solid, several critical vulnerabilities and architectural flaws have been identified, particularly within the state machines for password reset and token rotation.

### 🔴 Critical Vulnerabilities (P0)

**1. Complete Account Takeover in Forgot Password Flow**
* **Location:** `requestChangePassword.controller.ts` and `auth.service.ts` (`allowPasswordChange` / `changePassword`)
* **Description:** There is a severe logic flaw that bypasses OTP validation. When a user requests a password reset, `allowPasswordChange` generates the OTP **and immediately sets the authorization key in Redis** (`RedisKeys.auth.allowPasswordChange(user.id)`). It then returns a `TfaToken` to the client.
An attacker can simply call `POST /forgot-password` to get the `TfaToken` and immediately call `PATCH /password` with their chosen password. `changePassword` only checks if the Redis authorization key exists (which it does, because it was set during the request), allowing full account takeover without ever seeing or verifying the OTP.
* **Remediation:** Remove the Redis authorization key assignment from `allowPasswordChange`. The `allowPasswordChange(user.id)` Redis key MUST ONLY be set *after* a successful OTP validation inside `verifyOtpController`.

### 🟠 High Severity Issues (P1)

**2. State Machine Flaw in `verifyOtp` for Password Change**
* **Location:** `verifyOtp.controller.ts` (Handler for `TfaPurpose.CHANGE_PASSWORD`)
* **Description:** Currently, if a user successfully verifies an OTP for a password change, the controller calls `AuthService.allowPasswordChange(userId)`. This conceptually calls the *start* of the password reset flow again—generating and emailing *another* OTP instead of finalizing the authorization for the current flow. 
* **Remediation:** Refactor the password reset state machine:
  1. `POST /forgot-password` -> Sends OTP, returns `TfaToken(purpose: PASSWORD_RESET_REQUEST)`.
  2. `POST /verify-otp` -> Validates OTP. If valid, deletes OTP from Redis, sets `allowPasswordChange` flag in Redis, and returns `TfaToken(purpose: PASSWORD_RESET_AUTHORIZED)`.
  3. `PATCH /password` -> Validates the new token and checks the Redis flag before changing the password.

**3. Refresh Token Race Condition (Broken Token Replay Protection)**
* **Location:** `auth.service.ts` (`refreshTokens`)
* **Description:** The system strictly revokes a refresh token immediately upon use. If a frontend application sends two concurrent refresh requests (e.g., from multiple tabs or parallel API calls), the first will succeed and set `revokedAt`. The second concurrent request will see `revokedAt` is set, triggering the replay protection block which immediately invalidates all active sessions for that user/IP/UA.
* **Remediation:** Implement a "grace period" (e.g., 30 seconds) for token rotation. When a refresh token is rotated, keep it valid solely for issuing the *same* new token family for a short window, preventing race conditions from immediately logging the user out.

### 🟡 Medium Severity Issues (P2)

**4. Indefinite OTP TTL Extension**
* **Location:** `otp.service.ts` (`verifyOtp`)
* **Description:** When an incorrect OTP is provided, the attempts counter is incremented and saved back to Redis. However, the `EX` flag is hardcoded to `tokenExpirations.OTP_TOKEN_EXPIRY_MS`. This resets the expiration timer on every failed attempt. An attacker pacing their guesses could theoretically keep an OTP alive indefinitely until they hit the max attempts limit.
* **Remediation:** When updating the attempt count, preserve the remaining TTL. Use Redis `KEEPTTL` (if Redis 6.0+) or fetch the current TTL via `PTTL` and use that for the update.

**5. Flawed Replay Protection Scope**
* **Location:** `token.util.ts` (`revokeMatchingTokens`)
* **Description:** Token replay protection assumes that if a token is stolen, the attacker is using it from a different IP/UA. It revokes tokens matching `userId`, `ipAddress`, and `userAgent`. IP addresses can change dynamically on mobile networks, and User-Agents are easily spoofed or duplicated. If an attacker replays a token from another IP, the victim's session on the *current* IP might not actually be revoked.
* **Remediation:** Implement **Token Families**. When a user logs in, assign a `familyId` (UUID) to their refresh token chain. Replay protection should invalidate the *entire family* of tokens regardless of IP or User-Agent. 

**6. Stateless JWT Revocation**
* **Location:** `requireAuth.middleware.ts`
* **Description:** Access tokens are entirely stateless. If a user is deleted, their role is changed, or their account is suspended, their access token remains fully valid until its `exp` time.
* **Remediation:** Ensure access token lifetimes are extremely short (e.g., 5–15 minutes). If longer lifetimes are needed, implement a Redis-based user denylist or check a `lastTokenInvalidationTimestamp` on the user model during `requireAuth`.

### 🔵 Code Quality & Maintainability (P3)

**7. Naming Confusion in OTP Handler**
* **Location:** `verifyOtp.controller.ts`
* **Description:** In `handleOtpPurpose[TfaPurpose.CHANGE_PASSWORD]`, the second parameter is typed and named `userId: string`. However, the value being passed in from `verifyTfaToken` is the `email`. This coincidentally works because `AuthService.allowPasswordChange` expects an `email`, but it is highly misleading and brittle. 
* **Remediation:** Correct the parameter name to `email` to reflect the actual data being passed.

**8. Implicit User Creation Dependencies**
* **Location:** `auth.service.ts` (`signup`)
* **Description:** The authentication service directly creates a storage folder (`prisma.folder.create`). This tightly couples the Auth domain to the Storage domain.
* **Remediation:** Publish a domain event (e.g., `USER_CREATED`) using a lightweight event emitter, and let a Storage domain listener handle the folder creation. This keeps bounded contexts clean.