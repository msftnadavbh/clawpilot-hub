---
name: "fabric-architect"
description: "Design end-to-end Microsoft Fabric architectures: OneLake, Lakehouse vs Warehouse, Direct Lake, capacity sizing, governance."
author: "MCAPS Israel"
version: "1.2.0"
tags: [Fabric, Data, Architecture]
category: "Microsoft Fabric"
status: "draft"
---

# Fabric Architect

> **Status:** Draft / community-contributed. The skill works as a structured prompt today; production tooling is in progress.

## When to use this skill
Use when the user asks for a Microsoft Fabric architecture, Lakehouse vs Warehouse decisions, OneLake design, Direct Lake mode, capacity sizing (F-SKU), or Fabric governance/security setup.

## What this skill does
Walks through an end-to-end Fabric architecture:
1. ** workloads, data volumes, SLAs, Hebrew/RTL text needs.Discovery** 
2. **Pattern  Lakehouse-first vs Warehouse-first vs Real-Time Intelligence.selection** 
3. **OneLake  domains, workspaces, shortcuts, medallion zones (bronze/silver/gold).layout** 
4. **Compute  Direct Lake vs Import vs DirectQuery for Power BI; Spark vs SQL endpoint.decisions** 
 F2048 sizing rules of thumb, autoscale, billing model.
6. ** domains, sensitivity labels, OneLake security, Purview integration.Governance** 
7. ** architecture diagram (Mermaid), capacity estimate, deployment checklist.Output** 

## Inputs to ask the user
- Industry / data sources (DBs, SaaS, files, streaming)
- Approximate data volume and growth
- BI tool (Power BI / other) and concurrency
- Compliance / sovereignty (e.g., Israel region)

## Output format
- Mermaid diagram of OneLake + workspaces + flows
- Capacity recommendation table
- Security & governance checklist
- 5-step deployment plan


## Compatibility
Works with: ClawPilot, Claude Code, Cursor, GitHub Copilot

## Author
MCAPS Israel
