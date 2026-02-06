# Developer Documentation

Visual, diagram-first documentation for contributors and maintainers.

---

## Purpose

These documents explain Tandava's architecture and behavior through **diagrams and flows** rather than narrative prose. They're designed for:

- **Contributors** who need to understand the system before writing code
- **Reviewers** who need to quickly grasp architectural decisions
- **Maintainers** who need reference material for system behavior

They are **not** user-facing help documentation.

---

## Documents

| Document | Purpose |
|----------|---------|
| [01-domain-model.md](01-domain-model.md) | Entity relationships and separations (ER diagrams) |
| [02-architecture.md](02-architecture.md) | System layers, data flow, boundaries |
| [03-key-flows.md](03-key-flows.md) | Sequence diagrams for core operations |
| [04-integrations.md](04-integrations.md) | How external systems connect |
| [05-scenarios.md](05-scenarios.md) | End-to-end walkthroughs with diagrams |
| [06-authentication.md](06-authentication.md) | Auth providers, RBAC, security |

---

## Reading Order

**New to the project?**
1. Start with [01-domain-model.md](01-domain-model.md) for core concepts
2. Read [02-architecture.md](02-architecture.md) for system structure
3. Browse [03-key-flows.md](03-key-flows.md) for how things work

**Adding an integration?**
1. Read [04-integrations.md](04-integrations.md)
2. Review relevant flows in [03-key-flows.md](03-key-flows.md)

**Setting up authentication?**
1. Read [06-authentication.md](06-authentication.md)
2. Review [02-architecture.md](02-architecture.md) for auth boundaries

**Understanding a specific feature?**
1. Find the scenario in [05-scenarios.md](05-scenarios.md)
2. Trace back to flows and domain model

---

## Viewing Diagrams

All diagrams use [Mermaid](https://mermaid.js.org/) syntax.

**GitHub:** Renders automatically in preview

**VS Code:** Install "Markdown Preview Mermaid Support" extension

**CLI:** Use `mmdc` (Mermaid CLI) to export as images

---

## Related Documentation

| Area | Location |
|------|----------|
| Narrative domain model | [architecture/DOMAIN_MODEL.md](../architecture/DOMAIN_MODEL.md) |
| Role-based access | [architecture/ROLE_ACCESS_CONTROL.md](../architecture/ROLE_ACCESS_CONTROL.md) |
| Compensation details | [guides/COMPENSATION_GUIDE.md](../guides/COMPENSATION_GUIDE.md) |
| Export specifications | [ai-agents/BUSINESS_CONNECTORS.md](../ai-agents/BUSINESS_CONNECTORS.md) |
| Product requirements | [prd/](../prd/) |

---

## Contributing to Developer Docs

When adding to these documents:

- **Use Mermaid** for all diagrams
- **One diagram per concept** — don't overcomplicate
- **Keep text minimal** — let diagrams speak
- **Test rendering** — verify diagrams render correctly
- **Link related docs** — connect to narrative documentation

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for general contribution guidelines.
