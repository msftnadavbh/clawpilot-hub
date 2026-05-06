---
name: "agent-architect"
description: "Design multi-agent systems on Microsoft Agent Framework. Sub-agents, workflows, memory, eval."
author: "MCAPS Israel"
version: "1.0.0"
tags: [MAF, Agents, AI]
category: "AI & Agents"
status: "draft"
---

# Agent Architect

> **Status:** Draft / community-contributed. The skill works as a structured prompt today; production tooling is in progress.

## When to use this skill
Use when the user wants to design a multi-agent system on Microsoft Agent Framework (MAF), Semantic Kernel, or  sub-agents, orchestration, memory, evaluation harness.AutoGen 

## What this skill does
1. **Decompose the task** into agents (planner, retriever, executor, critic).
2. **Pick orchestration  sequential, group chat, hierarchical, swarm.pattern** 
3. **Define tools &  JSON schemas for each tool/function call.contracts** 
4. **Memory  short-term (thread), long-term (vector/Graph), shared scratchpad.design** 
5. **Eval  golden set, LLM-as-judge, cost & latency tracking.harness** 
6. ** system diagram, agent specs, code skeleton (Python/TypeScript).Output** 

## Inputs to ask the user
- Use case + success metric
- Existing model endpoint(s) (Azure OpenAI, Foundry, etc.)
- Latency / cost constraints
- Where it runs (local, AKS, Container Apps, Functions)

## Output
- Mermaid diagram of agent topology
- Per-agent prompt templates
- Tool schemas
- Eval harness scaffold


## Compatibility
Works with: ClawPilot, Claude Code

## Author
MCAPS Israel
