# Decision Log

| Date       | Decision                                   | Rationale                  |
|------------|--------------------------------------------|----------------------------|
| 2025-08-30 | Javelin Pulse SigInt backend will use a combination of AWS Lambda and containerized jobs hosted in ECS or Kubernetes on AWS. | This approach provides scalable, event-driven processing for lightweight tasks (Lambda) and robust orchestration for heavier, long-running, or stateful jobs (Kubernetes/ECS). It leverages AWS's managed services for reliability and cost efficiency. |
