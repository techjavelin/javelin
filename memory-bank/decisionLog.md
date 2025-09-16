# Decision Log

| Date       | Decision                                   | Rationale                  |
|------------|--------------------------------------------|----------------------------|
| 2025-08-30 | Javelin Pulse SigInt backend will use a combination of AWS Lambda and containerized jobs hosted in ECS or Kubernetes on AWS. | This approach provides scalable, event-driven processing for lightweight tasks (Lambda) and robust orchestration for heavier, long-running, or stateful jobs (Kubernetes/ECS). It leverages AWS's managed services for reliability and cost efficiency. |
| 2025-09-14 | Always use Conventional Commit style for future git commit messages. | User explicitly requested that all future commit messages follow conventional commit style (e.g., feat:, fix:, refactor:, style:, etc.). |
| 2025-09-14 | Do not auto-commit; wait for explicit user instruction. Use `npm run type-check` (not `npm run typecheck`) for TypeScript validation. | User wants manual control over commit cadence and clarified the correct npm script name. |
| 2025-09-15 | Delay sandbox log analysis until 'Watching for file changes' appears. | User clarified sandbox startup takes 1-1.5 minutes; premature parsing may misinterpret transient build output as final errors. |
| 2025-09-15 | Move default domain data seeding (application/user types) from runtime seed script to infrastructure-level (amplify data seed directory) executed in all environments. | Seed script not reliable/accessible in production; embedding idempotent creation logic in Amplify backend (CDK-like definition area) ensures defaults exist across envs without manual runs. |
| 2025-09-15 | Force userPool auth for ApplicationType/UserType operations | Models restrict create/update/delete to admin group; default API auth mode remains apiKey for public blog reads so explicit userPool mode prevents Unauthorized errors. |
| 2025-09-15 | Expose takeover flag in migrations run endpoint and UI | Allows admins to recover from stale or stuck migration lock without manual Dynamo edits; improves operability. |
| 2025-09-15 | Seed migration uses explicit userPool auth | Ensures seeding succeeds despite project default apiKey authorization mode for public content models. |
