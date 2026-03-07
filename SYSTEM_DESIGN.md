# Homelab System Design

## Overview

Homelab is a modular personal cloud platform designed to demonstrate production-style backend architecture patterns.

The system provides:

- secure multi-user storage
- asynchronous processing
- real-time communication

while remaining **fully self-hostable**.

The project explores architectural patterns commonly used in modern backend systems, including:

- asynchronous job queues
- worker service isolation
- event-based messaging
- modular service architecture
- containerized deployment

Homelab is designed to resemble simplified infrastructure used in real-world backend platforms such as file storage services or collaboration systems.

---

# System Goals

### Primary Design Goals

- maintain responsive APIs by offloading heavy tasks to workers
- support scalable real-time communication
- separate metadata storage from file storage
- enforce clear boundaries between services
- maintain reproducible containerized deployment

### Non-Functional Goals

- reliability
- scalability
- modularity
- security
- maintainability

---

# High-Level Architecture

The system follows a **layered architecture**.

```text
Client (Next.js)
      ↓
Reverse Proxy / Load Balancer
      ↓
API Server (Express + Prisma)
      ↓
Redis (Queues + Pub/Sub)
      ↓
Workers (BullMQ)
      ↓
PostgreSQL
      ↓
File Storage
```

### Key Principles

- API servers remain **stateless**
- heavy tasks are processed **asynchronously**
- Redis acts as the **event backbone**
- PostgreSQL stores **structured metadata**
- filesystem stores **binary file data**

---

# Core System Components

## Client Application

The frontend application is built using:

- Next.js (App Router)
- React
- TypeScript
- TailwindCSS
- TanStack Query
- Zustand

### Responsibilities

- authentication interface
- file browsing and management
- file uploads and downloads
- chat interface
- displaying job progress

---

## API Server

The API server acts as the **central orchestration layer**.

### Responsibilities

- authentication and authorization
- rate limiting
- file metadata management
- folder hierarchy operations
- job creation and status tracking
- WebSocket integration

### Technologies

- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- Redis
- Socket.IO

The API server delegates heavy workloads to background workers through Redis queues.

---

# Storage Architecture

Homelab separates **file metadata** from **binary file storage**.

## Metadata Storage

PostgreSQL stores structured metadata including:

- user accounts
- folder hierarchy
- file metadata
- job status
- chat messages
- shared links

This enables efficient querying, indexing, and relational data integrity.

---

## File Storage

Binary files are stored on the filesystem.

Stored data includes:

- uploaded files
- generated thumbnails
- temporary archives

Future improvements may include support for **S3-compatible storage backends**.

---

# Real-Time Messaging

Homelab includes a broadcast chat system supporting real-time communication.

### Message Flow

```text
User sends message
      ↓
Message stored in PostgreSQL
      ↓
Message published to Redis Pub/Sub
      ↓
Delivered to WebSocket clients
```

### Benefits

- persistent chat history
- real-time message delivery
- horizontal scaling of WebSocket servers

Redis acts as the communication bridge between WebSocket instances.

---

# Authentication and Security

Authentication uses **JWT access tokens with refresh tokens**.

### Features

- user signup
- login
- refresh token rotation
- password reset via OTP
- password change
- authenticated session tracking

### Security Mechanisms

- rate limiting
- bcrypt password hashing
- hashed refresh tokens
- token revocation
- device metadata tracking

Authorization is enforced using middleware layers within the API server.

### Rate Limiting

Homelab implements **layered rate limiting** to protect the system from abuse while maintaining a smooth user experience. The design separates **infrastructure protection** from **application-level protection**.

#### Architecture

Rate limiting is applied in two layers:

```
Client
 ↓
NGINX
  global IP protection
 ↓
Express
  requireAuth
 ↓
  global user limiter
 ↓
  endpoint limiters
 ↓
  controller
```

- **NGINX** handles global IP-based rate limiting at the edge to prevent abusive traffic from reaching the application.
- **Express middleware** enforces user-level and endpoint-specific limits using Redis.

This layered approach ensures that infrastructure resources (CPU, database, Redis, workers) are protected before expensive application logic runs.

---

#### Algorithm

The API rate limiter uses the **Token Bucket algorithm** implemented through **Redis Lua scripts**.

Key characteristics:

- **Atomic execution** via Lua scripts prevents race conditions.
- **Token refill over time** allows short bursts of traffic while maintaining average limits.
- **Redis-based storage** ensures consistency across multiple API instances.

Each request:

1. Loads the bucket state from Redis.
2. Refills tokens based on elapsed time.
3. Consumes a token if available.
4. Rejects the request if the bucket is empty.

Redis keys automatically expire to avoid long-term memory growth.

---

#### Key Structure

Rate limit keys follow a structured naming format:

```
rate:{scope}:{identifier}:{resource}:{action}
```

Examples:

```
rate:user:42:chat:send
rate:user:42:storage:upload
rate:email:abc123:auth:login
```

This structure keeps keys predictable and allows easy grouping by resource or action.

Scopes currently supported:

- `user`
- `email`
- `ip`

---

#### Global User Protection

Authenticated requests are protected by a **global per-user rate limit** to prevent runaway clients or abusive scripts.

Policy:

```
300 requests / minute per user
```

This is applied automatically after authentication through a shared middleware stack.

---

#### Endpoint Policies

Specific endpoints have stricter limits depending on their cost and security sensitivity.

Authentication:

```
login            → 5 requests / minute per email
signup           → 3 requests / minute per IP
password reset   → 3 requests / hour per email
```

Chat:

```
send message     → 60 requests / minute per user
```

Storage:

```
list             → 120 requests / minute per user
upload           → 20 requests / minute per user
copy             → 5 requests / minute per user
move             → 5 requests / minute per user
delete           → 5 requests / minute per user
download         → 60 requests / minute per user
```

Operations that trigger filesystem work or background jobs use stricter limits to protect worker resources.

---

#### Middleware Design

Rate limiting is implemented using a **middleware factory** that accepts a policy configuration. Policies define:

- identity scope
- bucket capacity
- refill rate
- resource/action classification

This approach allows policies to be reused across routes while keeping route definitions clean and explicit.

---

#### Design Considerations

Key decisions made during implementation:

- **Edge protection via NGINX** instead of duplicating IP limits in Express.
- **Token bucket algorithm** to allow bursts while controlling sustained traffic.
- **Lua scripts** to guarantee atomic Redis updates.
- **Explicit endpoint policies** instead of tier abstractions for clarity.
- **Global per-user limiter** to protect the system from abusive authenticated clients.
- **Structured Redis keys** for maintainability and observability.

---

# Deployment Model

Homelab supports **containerized deployment using Docker**.

### Typical Deployment Stack

- reverse proxy (NGINX)
- api server
- worker services
- redis
- postgres
- client application

### Benefits

- reproducible environments
- simplified local deployment
- scalable service architecture

---

# Scalability Strategy

The architecture supports **horizontal scaling of system components**.

### API Servers

- stateless containers
- scaled behind a load balancer

### Workers

- multiple worker instances
- independently scalable background processing

### Redis

- acts as the central messaging and queue system

### Database

- single PostgreSQL instance for simplicity
- read replicas possible for larger deployments

---

# Observability

Production systems require visibility into system health and behavior.

Recommended observability features include:

- structured logging
- request IDs
- job status tracking
- health check endpoints

### Example Endpoints

```
/health
/ready
```

Monitoring systems such as **Prometheus** and **Grafana** can be integrated for metrics and visualization.

---

# Design Tradeoffs

## Filesystem vs Object Storage

The current implementation uses **filesystem storage**.

### Advantages

- simple setup
- efficient for local deployments

### Tradeoff

- limited horizontal scalability

Possible future improvements:

- S3-compatible storage
- distributed object storage

---

## Redis vs Kafka

Redis is used for **queues and pub/sub messaging**.

### Advantages

- simple deployment
- low latency
- strong queue ecosystem with BullMQ

### Tradeoff

- weaker durability guarantees compared to Kafka

---

# Future Improvements

Potential enhancements include:

- S3-compatible storage providers
- virus scanning workers
- file versioning
- folder-level sharing
- advanced chat features
- monitoring and metrics dashboards

---

# Conclusion

Homelab demonstrates modern backend architecture patterns including:

- asynchronous processing pipelines
- worker-based background processing
- Redis-based messaging
- real-time WebSocket communication
- modular monorepo architecture

The system serves both as:

- a **practical self-hosted cloud platform**
- a **backend engineering case study demonstrating production-style system design**
