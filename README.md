# Homelab

**Homelab** is a production-grade personal cloud platform designed to demonstrate advanced backend architectural patterns, distributed systems principles, and secure resource management.

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

---

## 🚀 Key Engineering Highlights

- **Content-Addressable Storage (CAS):** Built-in blob deduplication and chunked upload pipeline for maximum storage efficiency.
- **Asynchronous Worker Tier:** Decoupled background processing using **BullMQ** for heavy I/O and media tasks (thumbnailing, zipping).
- **Security-First Auth:** JWT session management with refresh token rotation, family-based reuse detection, and a 30s race-condition grace period.
- **Distributed Rate Limiting:** High-performance Token Bucket algorithm implemented via **Redis Lua scripts** for atomic, multi-node protection.
- **Real-Time Mesh:** Bidirectional event-driven architecture powered by **Socket.io** for instant state synchronization.
- **Virtual File System:** Granular, bitmask-based permission engine supporting inheritance and secure link sharing.

---

## 🛠 Tech Stack

- **Monorepo:** PNPM Workspaces, TypeScript.
- **Backend:** Express.js, Prisma ORM, BullMQ, Socket.io.
- **Frontend:** Next.js (App Router), TanStack Query, Zustand, Tailwind CSS v4.
- **Infrastructure:** PostgreSQL, Redis, NGINX, Docker.

---

## 📖 Deep Dive

For a comprehensive breakdown of the system architecture, data flows, and engineering trade-offs, see the **[System Design Documentation](./SYSTEM_DESIGN.md)**.

---
