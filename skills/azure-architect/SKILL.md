---
name: "azure-architect"
description: "Generate WAF-aligned Azure architectures with cost estimates, security checklist, and Bicep templates."
author: "MCAPS Israel"
version: "2.0.1"
tags: [Azure, WAF, Bicep]
category: "Azure"
status: "draft"
---

# Azure Solution Architect

> **Status:** Draft / community-contributed. The skill works as a structured prompt today; production tooling is in progress.

## When to use this skill
Use for any "design an Azure solution"  landing zones, application architectures, AI/data platforms,  where the answer should be Well-Architected Framework aligned.migrations request 

## What this skill does
Produces a WAF-aligned Azure architecture covering all five pillars (reliability, security, cost, operational excellence, performance efficiency):
1. **Requirements  workload type, scale, region, compliance.capture** 
2. **Reference  chosen from Azure Architecture Center patterns.architecture** 
3. **Service  concrete SKUs and regions.selection** 
4. **Security  MCSB, network isolation, Entra ID, Key Vault.baseline** 
5. **Cost  first-pass monthly cost via the `/azure-pricing` skill.estimate** 
6. **Bicep  minimal IaC starter.skeleton** 
7. **Deployment  landing zone prerequisites + day-2 ops.checklist** 

## Inputs to ask the user
- Workload (web app / data platform / AI / analytics / migration)
- Expected load and SLA
- Region (default: Israel Central if unspecified)
- Existing landing zone? Y/N

## Output
- Mermaid architecture diagram
- Service table with SKU + monthly cost
- Bicep starter file
- Security & ops checklist


## Compatibility
Works with: ClawPilot, Claude Code, Cursor

## Author
MCAPS Israel
