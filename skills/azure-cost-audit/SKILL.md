---
name: "azure-cost-audit"
description: "Audit Azure subscription spend, flag idle resources, suggest reserved instances and savings plans."
author: "MCAPS Israel"
version: "1.3.0"
tags: [Azure, FinOps, Cost]
category: "Azure"
status: "draft"
---

# Azure Cost Audit

> **Status:** Draft / community-contributed. The skill works as a structured prompt today; production tooling is in progress.

## When to use this skill
Use to audit Azure subscription  flag idle resources, suggest reserved instances, savings plans, and right-sizing.spend 

## What this skill does
1. **Pull cost  Cost Management exports, Advisor recommendations.data** 
2. **Idle resource  VMs at <5% CPU, unattached disks, unused IPs, empty App Service plans.scan** 
3. **Reservation/Savings Plan  coverage % and break-even.analysis** 
4. **Right- VM SKU recommendations from Advisor.sizing** 
5. **Tag  untagged spend per resource group.hygiene** 
6. ** savings report sorted by $/month.Output** 

## Inputs to ask the user
- Subscription ID(s)
- Time window
- Whether commitments (RI/SP) are allowed

## Output
- Top idle resources table
- Reservation coverage chart
- Right-sizing list
- Total estimated savings $/month


## Compatibility
Works with: ClawPilot, Claude Code

## Author
MCAPS Israel
