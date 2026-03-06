# Homelab

<p align="center">
  <h1 align="center">Homelab</h1>
  <p align="center">
    <strong>LAN-first - Secure - Modular - Async-Driven Personal Cloud Platform</strong>
  </p>
  <p align="center">
    A production-style backend architecture project demonstrating worker systems, async processing pipelines, and real-time messaging.
  </p>
</p>

---

<p align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![NodeJS](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![NextJS](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)

![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![BullMQ](https://img.shields.io/badge/BullMQ-FF6B00?style=for-the-badge)
![WebSockets](https://img.shields.io/badge/WebSockets-010101?style=for-the-badge)
![JWT Auth](https://img.shields.io/badge/JWT-000000?style=for-the-badge)

</p>

---

<p align="center">

![Architecture](https://img.shields.io/badge/Architecture-Modular-blue?style=flat-square)
![Async](https://img.shields.io/badge/Processing-Asynchronous-orange?style=flat-square)
![Workers](https://img.shields.io/badge/Workers-Isolated-green?style=flat-square)
![Messaging](https://img.shields.io/badge/Messaging-Real--Time-purple?style=flat-square)
![Deployment](https://img.shields.io/badge/Deployment-Dockerized-lightgrey?style=flat-square)

</p>

---

# Overview

**Homelab is a personal cloud platform designed to demonstrate production-style backend architecture patterns.**

The system provides:

- multi-user file storage
- asynchronous processing pipelines
- real-time messaging

while remaining **fully self-hostable**.

It was designed as a **systems engineering project** exploring patterns commonly used in distributed backend systems such as:

- job queues
- worker isolation
- event-based messaging
- modular service architecture

### Core Architectural Goals

- separation of API and background processing
- scalable real-time communication
- asynchronous handling of heavy IO operations
- strong domain contracts shared across services
- containerized deployment

---

# System Goals

Homelab aims to simulate a **production-style backend system** similar in spirit to platforms like **Google Drive or Slack**, while remaining self-hostable and understandable.

### Primary Goals

- demonstrate asynchronous system design
- implement modular backend architecture
- support scalable background processing
- enable real-time messaging
- maintain clean service boundaries

---

# Architecture Overview

### High-Level Architecture

```text
Client (Next.js)
      ↓
Reverse Proxy
      ↓
API Server (Express + Prisma)
      ↓
Redis (Queues + Pub/Sub)
      ↓
Workers (BullMQ)
      ↓
PostgreSQL + File Storage
```

### Key Ideas

- API servers remain **stateless**
- heavy tasks run **asynchronously in workers**
- Redis acts as the **event backbone of the system**
- PostgreSQL stores **metadata** while files live in **storage**

---

# Key Engineering Problems

## Problem: Long Running File Operations

Operations such as:

- copying large folders
- generating archives
- creating thumbnails

can **block the API server** and degrade system performance.

### Solution

```text
API request
      ↓
enqueue background job
      ↓
worker processes task
      ↓
job status updated in database
```

### Benefits

- prevents API blocking
- allows retry strategies
- enables progress tracking

---

# Deployment

Homelab supports **containerized deployment**.

### Typical Docker Compose Stack

- api-server
- io-workers
- thumbnail-worker
- redis
- postgres
- client

### Benefits

- reproducible environments
- easy local deployment
- scalable worker architecture

---

# Why This Project Exists

Homelab was built as an exploration of **backend system architecture beyond traditional CRUD applications**.

Instead of focusing on UI complexity, the project emphasizes **infrastructure concerns**, such as:

- background job processing
- real-time messaging
- modular service design

The goal was to design and implement a system that **resembles real-world backend platforms** while remaining understandable and self-hostable.
