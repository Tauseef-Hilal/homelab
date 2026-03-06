# Homelab Architecture Blueprint

## Project Overview

**Homelab** is a self-hosted personal cloud platform designed to operate both on a LAN and as an internet-deployable service. The system focuses on modular architecture, asynchronous processing, and strong backend engineering practices.

### Core Capabilities

- Multi-user file storage with folder hierarchy
- Background job processing for heavy IO operations
- Media thumbnail generation
- Real-time broadcast chat
- Secure authentication with JWT and refresh tokens
- File sharing via expiring links
- Modular monorepo architecture

The system is designed with **production-grade patterns**, such as:

- job queues
- worker isolation
- shared contracts
- clean service boundaries

---

# Monorepo Architecture

Homelab uses a **pnpm monorepo**.

### Repository Structure

```
homelab/
  packages/
    server
    workers
    shared
    client
  docker/
  data/
```

### Package Responsibilities

| Package     | Responsibility                                          |
| ----------- | ------------------------------------------------------- |
| **server**  | Express API and WebSocket server                        |
| **workers** | Background job processors                               |
| **shared**  | Domain types, Prisma schema, constants, Zod API schemas |
| **client**  | Next.js web application                                 |

---

# System Architecture

### High-Level Architecture

```
Client (Next.js)
        ↓
API Server (Express + Prisma)
        ↓
Redis (Pub/Sub + Job Queues)
        ↓
Workers (BullMQ)
        ↓
PostgreSQL
        ↓
Filesystem Storage
```

The API server handles requests while workers perform heavy tasks asynchronously.

---

# Server Package

The **server package** implements the backend API and real-time communication layer.

### Technology Stack

- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- BullMQ
- Socket.IO
- Multer
- Nodemailer
- Zod

---

## Core Infrastructure

Server initialization includes:

- Express application setup
- JSON middleware
- CORS
- request logging middleware
- centralized error handling

**Socket.IO** is attached to the HTTP server to enable real-time communication.

---

## Error Handling

Custom error classes provide structured responses with:

- status code
- error code
- error message

A global error middleware ensures **consistent API responses**.

---

## Logging

Request logging captures:

- HTTP method
- endpoint
- response status
- request duration

---

# Authentication System

### Features Implemented

- user signup
- login
- logout
- refresh token rotation
- password reset with OTP
- change password flow
- authenticated user endpoint

### Security Features

- bcrypt password hashing
- refresh token hashing
- token revocation
- device metadata tracking
- JWT access tokens

### Refresh Token Metadata

Refresh tokens store:

- user agent
- IP address
- expiration
- revocation timestamp

---

# Authorization

Two middleware systems enforce access control.

### `requireAuth`

- Verifies JWT tokens
- Attaches the authenticated user to the request

### `requireRole`

- Restricts endpoints based on user roles

---

# Storage System

The storage subsystem provides a **cloud-drive style file manager**.

### Capabilities

- file upload
- folder creation
- folder navigation
- file preview
- file download
- multi-file zip download
- move items
- copy items
- delete items
- quota enforcement

Uploads use **Multer** for handling multipart requests.

### Filesystem Storage Location

```
data/uploads/
```

File metadata is stored in **PostgreSQL**.

---

# Chat System

Broadcast chat enables **real-time messaging**.

### Architecture

```
User message
    ↓
Stored in Postgres
    ↓
Published to Redis
    ↓
Delivered to WebSocket clients
```

### Features

- message persistence
- real-time updates
- message history retrieval

**Socket.IO** manages connections while **Redis** enables horizontal scaling.

---

# Job System

Heavy operations are processed **asynchronously**.

### Job Flow

```
API request
    ↓
enqueue job in Redis
    ↓
worker consumes job
    ↓
worker performs task
    ↓
database updated with job status
```

### Job Tracking

Jobs track:

- status
- progress
- result
- error information
- retry attempts

---

# Workers Package

Workers are **separate services** responsible for background processing.

### Worker Types

- **IO Worker**
- **Thumbnail Worker**

Workers communicate through **Redis queues using BullMQ**.

---

## IO Worker

Handles heavy filesystem operations.

### Implemented Handlers

- move items
- copy items
- delete items
- zip items

These operations run asynchronously to prevent API blocking.

---

## Thumbnail Worker

Generates thumbnails for media files.

### Supported Formats

| File Type | Tool    |
| --------- | ------- |
| Images    | Sharp   |
| Video     | FFmpeg  |
| PDF       | Poppler |

Generated thumbnails are saved to storage and database records are updated.

---

# Shared Package

The **shared package** acts as the **domain contract layer** across services.

### Contains

- Prisma schema
- shared TypeScript types
- job definitions
- system constants
- Zod API validation schemas

Both the server and workers rely on these shared definitions.

### Benefits

- consistent job contracts
- unified API validation
- shared system limits
- reduced duplication

---

# Database Schema

The system uses **PostgreSQL with Prisma ORM**.

### Major Models

- User
- RefreshToken
- Folder
- File
- SharedLink
- Job
- DownloadLink
- BroadcastMessage

---

## Filesystem Model

```
User → Folder → File
```

Folders support hierarchical relationships using **parent/child relations**.

Full paths are stored directly to simplify lookup operations.

---

## File Metadata

Files store:

- name
- MIME type
- size
- storage path
- thumbnail flag
- visibility level

### Visibility Values

- private
- public
- shared

---

## File Sharing

`SharedLink` enables **link-based sharing**.

### Capabilities

- expiring links
- access tokens

---

## Job Tracking

The `Job` table tracks background tasks including:

- progress
- status
- error messages
- job payload

---

## Chat Messages

`BroadcastMessage` stores persistent chat history.

---

# Client Application

The frontend is built using:

- Next.js (App Router)
- React
- TypeScript
- TailwindCSS
- shadcn UI
- Zustand
- TanStack Query

---

## Implemented UI Systems

### Authentication UI

- login
- OTP verification
- password change

### Drive Interface

- file browsing
- folder navigation
- file upload
- file preview
- move/copy/delete

### Chat Interface

- broadcast chat
- message history
- real-time updates

---

# Background Job Types

Implemented job categories:

- `generateThumbnail`
- `copyItems`
- `moveItems`
- `deleteItems`
- `zipItems`

These are processed by workers and tracked through the **Job table**.

---

# Deployment Model

Homelab supports **containerized deployment**.

### Docker Services

- API server
- IO worker
- thumbnail worker
- Redis
- PostgreSQL

The architecture supports **scaling workers independently**.

---

# Current System Capabilities

The platform currently provides:

- secure authentication
- private cloud storage
- background processing
- media thumbnail generation
- real-time messaging
- file sharing links
- job tracking

---

# Planned Enhancements

Future improvements include:

- folder sharing
- public deployment
- virus scanning
- media optimization
- advanced chat features

---

# Conclusion

Homelab is a **modular personal cloud platform** demonstrating modern backend architecture patterns, including:

- microservice-style worker separation
- asynchronous processing
- shared domain contracts
- scalable messaging
- real-time communication

The system serves as both:

- a practical **private cloud platform**
- a **comprehensive backend engineering portfolio project**
