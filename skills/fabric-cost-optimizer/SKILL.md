---
name: "fabric-cost-optimizer"
description: "Audit Fabric capacity usage, identify hot artifacts, recommend SKU right-sizing or autoscale."
author: "MCAPS Israel"
version: "0.8.0"
tags: [Fabric, Cost, FinOps]
category: "Microsoft Fabric"
status: "draft"
---

# Fabric Cost Optimizer

> **Status:** Draft / community-contributed. The skill works as a structured prompt today; production tooling is in progress.

## When to use this skill
Use to audit Microsoft Fabric capacity (F-SKU) usage, find hot artifacts, and recommend right-sizing or autoscale.

## What this skill does
1. **Pull capacity  Fabric Capacity Metrics app data.metrics** 
2. **Identify hot  top CU consumers (notebooks, semantic models, pipelines).artifacts** 
3. **Throttling  when does the capacity smooth/throttle.analysis** 
4. ** split workspaces across capacities, downsize off-hours, switch to autoscale, or move workloads to Spark pools.Recommendations** 
5. ** savings table with $/month delta and risk per recommendation.Output** 

## Inputs to ask the user
- Capacity ID or admin access
- Time window (last 7 / 30 days)
- Off-hours pattern (e.g., nights/weekends)

## Output
- Top-10 hot artifacts table
- Throttling timeline
- Recommendations with $ impact


## Compatibility
Works with: ClawPilot

## Author
MCAPS Israel
