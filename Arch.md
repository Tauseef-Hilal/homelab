## 🏗️ Project Architecture

This project uses a **Monorepo + Modular Layered Architecture**, combining the benefits of **layered design (SoC)** and **feature-based modularity**.
- Project is divided into packages. Each package runs in a separate docker container.
- Code is organized by **features** (`auth/`, `chat/`, etc.), not by technical layers (e.g., `routes/`, `services/`).
- Each feature has its own route/controller/service/middleware.
- Supports **clean separation of concerns** and **scalability**.

---

## Internals

### Folder Structure Breakdown:

**Overall Structure**

```
homelab
├── packages     # Except shared, each package is run in a separate container
│   ├── server
│   │   ├── src
│   │   ├── tests
│   │   ├── Dockerfile
│   │   ├── nodemon.json
│   │   ├── package.json
│   │   ├── pnpm-lock.yaml
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   ├── shared
│   │   ├── prisma
│   │   ├── src
│   │   ├── package.json
│   │   ├── pnpm-lock.yaml
│   │   └── tsconfig.json
│   └── workers
│       ├── src
│       ├── Dockerfile
│       ├── nodemon.json
│       ├── package.json
│       └── tsconfig.json
├── a.md
├── Arch.md
├── docker-compose.yml
├── LICENSE
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── README.md
└── tsconfig.json
```

**Server Code Structure**

```
src/
├── constants/          # Static values used globally in the server
├── errors/             # Error classes and codes
├── features/           # Modular business logic
│   ├── auth/                  # Auth feature
│   │   ├── constants/         # Feature-specific static values
│   │   ├── controllers/       # Request/response handlers
│   │   ├── middlewares/       # Auth-specific middleware
│   │   ├── schemas/           # Zod validation schemas
│   │   ├── services/          # Core business logic
│   │   ├── types/             # Feature-specific types
│   │   ├── utils/             # Helper functions
│   │   ├── auth.config.ts     # Auth-specific config
│   │   └── auth.routes.ts     # Route definitions for auth
├── lib/                # Shared utilities (prisma, bcrypt etc.)
├── middleware/         # Global middleware (errorHandler, logger etc.)
├── queues/             # Job producers
├── types/              # Global types
├── app.ts/             # Express app bootstrapper
└── server.ts/          # Entry point that starts HTTP server
```

**Layered Flow:**

```
Request → Middleware → Route → Controller → Service → Lib/DB → Response
```

---

## Trade-offs

| Pros                             | Cons                                      |
| -------------------------------- | ----------------------------------------- |
| Modular and scalable per feature | Slightly verbose for small apps           |
| Clean separation of concerns     | Some repetition across features           |
| Easier testing and onboarding    | Requires discipline to maintain structure |
| Aligns with Domain-Driven Design | Initial setup may feel heavyweight        |

---

## Comparison

| Architecture Style              | Features                        | Suitable For              |
| ------------------------------- | ------------------------------- | ------------------------- |
| Feature-first (used here)       | Easy scaling, good SoC, modular | Mid to large projects     |
| Horizontal (routes/, services/) | Simpler in small projects       | Tiny apps, POCs           |
| MVC (Model-View-Controller)     | UI-focused separation           | Web apps with views       |
| Microservices                   | Independent deployability       | Large distributed systems |
| Clean Architecture / Hexagonal  | Abstract layers, testable       | Enterprise-grade systems  |

---

## FAANG Q\&A

### **Q1:** _Why did you choose feature-based architecture over layer-based?_

**A:** Because it scales better. Each feature is self-contained, making onboarding easier, testing more isolated, and the structure more maintainable. It aligns with DDD principles.

---

### **Q2:** _Where would you place cross-cutting concerns like rate limiting or logging?_

**A:** In the `middleware/` folder, applied globally in `app.ts`, since they apply across all features.

---

### **Q3:** _What are the benefits of separating `app.ts` from `server.ts`?_

**A:** This separation improves testability (you can test the app without starting the server) and keeps configuration logic apart from execution logic.

---

### **Q4:** _How would you scale this architecture for 5+ features and 10+ services?_

**A:** Group features into domains (e.g., `users`, `auth`, `chat`), abstract shared services to `lib/`, and consider module boundaries. As it grows, you can even split features into microservices.

---

### **Q5:** _How does this architecture enforce Separation of Concerns (SoC)?_

**A:** Each layer handles a single responsibility:

- Routes map HTTP methods to controller actions.
- Controllers manage HTTP-specific logic (params, responses).
- Services handle business logic and domain operations.
- Lib contains pure helpers like hashing or token generation.
- Middlewares handle cross-cutting concerns like error handling, auth, rate limiting.

This clean separation makes reasoning, testing, and scaling easier.

---

### **Q6:** _Can this architecture support a monorepo or microservices migration?_

**A:** Yes. Each feature is already self-contained, so it’s possible to extract a feature (like `auth`) into a microservice. You just wrap it with its own `server.ts`, expose routes over HTTP/gRPC, and plug it into an API gateway or internal service mesh.

---

### **Q7:** _What are the trade-offs of having controllers separate from services?_

**A:**

- **Pros:** Promotes single responsibility; controllers handle I/O logic, while services focus on core rules.
- **Cons:** Slightly more boilerplate, especially for trivial features.
- **Trade-off:** You gain long-term maintainability and testability at the cost of initial verbosity.

---

### **Q8:** _How do you handle shared logic between features?_

**A:** Common utilities (e.g., hashing, token signing, DB access) are abstracted into the `lib/` folder. This avoids duplication and makes features independent but still DRY. If shared logic gets complex, it can be refactored into a domain-specific module or service layer.

---

### **Q9:** _How would you add versioning support (e.g., `/api/v1/...`) in this structure?_

**A:** Route prefixes can be handled globally in `app.ts`:

```ts
app.use("/api/v1/auth", authRoutes);
```

You could also structure features by version:

```
features/
├── v1/
│   └── auth/
├── v2/
│   └── auth/
```

This makes it easy to sunset or maintain multiple versions simultaneously.

---

### **Q10:** _How do you ensure feature isolation in this architecture?_

**A:** By colocating each feature's routes, controller, service, and middleware in its own folder, you ensure that features don’t leak logic into each other. Services do not import from other services unless explicitly allowed. Any communication is done via shared `lib/` or event emitters (if needed later).
