# Pikit Roadmap

Future improvements informed by patterns from [claw-code](https://github.com/instructkr/claw-code) and [open-multi-agent](https://github.com/JackChen-me/open-multi-agent).

## Implemented

- **Concurrency semaphore** — Parallel steps now throttled via configurable semaphore (default: 3). Prevents API rate limit crashes. Set `concurrency.limit` in workflow YAML.
- **Execution registry** — Centralized tracking of step state (pending/running/done/failed/skipped) with timing and error info. Summary appended to workflow output.
- **Cost event hooks** — Budget threshold events (`warning` at 80%, `critical` at 90%, `exceeded` at 100%) plus action events (`downgrade`, `skip`, `stop`). Register handlers via `costHooks.on()`.

## Future

### Task DAG Scheduler
Replace sequential + parallel-group model with full dependency graph. Steps declare `dependsOn: [step-ids]` and the scheduler topologically sorts and auto-parallelizes independent paths. Both claw-code and open-multi-agent implement this pattern.

**When:** When workflows regularly exceed 10+ steps with complex interdependencies. Current `parallel` groups and `branch` rules handle real workflows fine for now.

### MessageBus (Inter-Agent Communication)
Pub/sub message passing between running steps. Would allow agents to coordinate in real-time rather than passing data through shared memory after completion.

**When:** If pikit moves toward persistent, long-running agents that need to react to each other mid-execution. Current fire-and-forget + memory injection model is simpler and sufficient for batch workflows.

### Skill Lifecycle Hooks
Add `init()` / `cleanup()` hooks to skills for setup/teardown (DB connections, API auth, temp directories). Currently skills are stateless markdown definitions loaded on demand.

**When:** When skills need stateful resources. Not needed while skills remain prompt-only definitions.

### LSP Integration
Language Server Protocol for IDE-grade code intelligence (go-to-definition, type info, diagnostics). Would give agents deeper code understanding.

**When:** High effort, high value. Consider when agent code quality needs to improve beyond what static analysis + grep can provide.

### Plugin Architecture
Formal extension points with lifecycle hooks for third-party functionality. Currently extensible via skills/workflows but no dynamic plugin registration or event hooks beyond cost events.

**When:** When external contributors need to extend pikit without modifying core code.
