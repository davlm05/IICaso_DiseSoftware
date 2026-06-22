# Skill: add a NestJS feature module

Target: `backend/apps/api/src/modules/<domain>/`. Mirror an existing module (e.g. `auth`, `checkout`).

## Layout
```
modules/<domain>/
  <domain>.module.ts       # @Module wiring controllers + providers
  <domain>.controller.ts   # @Controller('<domain>'), routes under global /api/v1 prefix
  <domain>.service.ts      # business logic; injects PrismaService, Redis, etc.
  dto/
    <action>.dto.ts        # request/response DTOs with class-validator decorators
```

## Conventions
- Register the module in `apps/api/src/app.module.ts` imports.
- Inject `PrismaService` from `common/prisma`; never instantiate PrismaClient directly.
- Guard routes with the existing auth guards + role decorators (RBAC). Validate every input DTO.
- Throw Nest `HttpException` subclasses; let the global filter shape the response. Never leak internals.
- Emit logs via the injected logger (include trace-id); add metrics for new hot paths.

## Checklist
- [ ] Module registered in `app.module.ts`
- [ ] DTOs validated (class-validator / Zod)
- [ ] AuthN + RBAC applied
- [ ] Errors via HttpException; no PII/secrets logged
- [ ] Unit + integration tests added by the QA agent
