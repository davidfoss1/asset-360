---
appName: "Asset 360"
externalId: "asset-360"
infra: "appsApi"
customer: "Publicdata demo project"
tier: "Tier 1: Monitoring & reporting"
owner: "David Foss <david.foss@cognite.com>"
userCount: ""
businessValue: ""
milestones: ""
repoUrl: "https://github.com/davidfoss1/asset-360.git"
userRole: "Operations Analyst (or Reliability Engineer) at an industrial facility. Starts the day reviewing shift reports and alarms; when an anomaly is flagged on equipment (e.g. a pump or compressor) they investigate its history, current state and documentation to brief the maintenance team. Works at a desk in an office, occasionally visits the control room, on a desktop or laptop with a large monitor."
currentProblem: "Right after an asset is flagged (e.g. PUMP-101) the analyst has to log into SAP for open work orders, open a separate historian tool for live sensor data, and dig through a SharePoint drive for the P&ID. This takes 1-2 hours per asset, so they fall back on outdated Excel sheets, ask colleagues on Teams for tribal knowledge, or decide with incomplete data."
oneSentenceStory: "As an Operations Analyst, I want to search for a specific piece of equipment and instantly see its connected time series data, recent work orders, and related documents in one unified view, so that I can quickly understand its status without switching between five different systems."
successCriteria: "An analyst can search an equipment tag, view its live time series, and open a related file (manual or P&ID) on one page in under 10 minutes total, down from 1-2 hours today."
userEvidence: "Assumption, no direct user interview. Based on aggregated experience across many CDF deployments, where the Asset 360 pattern (SAP work orders + historian data + P&ID files) is the most requested first-value use case. This is a generalized Tier 1 certification app simulating a well-understood industrial pain point."
reviewedSections:
  - appDetails
  - who
  - problem
  - tasksAndSuccess
---

# App Brief — Asset 360

## App details

- **Customer:** Publicdata demo project
- **Tier:** Tier 1: Monitoring & reporting
- **Owner:** David Foss <david.foss@cognite.com>
- **Expected users:**
- **Business value:**
- **Milestones:**
- **Repository:** https://github.com/davidfoss1/asset-360.git
- **App externalId:** asset-360
- **Infra:** appsApi

## Who is this app for?

Operations Analyst (or Reliability Engineer) at an industrial facility. Starts the day reviewing shift reports and alarms; when an anomaly is flagged on equipment (e.g. a pump or compressor) they investigate its history, current state and documentation to brief the maintenance team. Works at a desk in an office, occasionally visits the control room, on a desktop or laptop with a large monitor.

## What problem does this solve?

Right after an asset is flagged (e.g. PUMP-101) the analyst has to log into SAP for open work orders, open a separate historian tool for live sensor data, and dig through a SharePoint drive for the P&ID. This takes 1-2 hours per asset, so they fall back on outdated Excel sheets, ask colleagues on Teams for tribal knowledge, or decide with incomplete data.

## Tasks and success

**One-sentence story.** As an Operations Analyst, I want to search for a specific piece of equipment and instantly see its connected time series data, recent work orders, and related documents in one unified view, so that I can quickly understand its status without switching between five different systems.

**Success criteria.** An analyst can search an equipment tag, view its live time series, and open a related file (manual or P&ID) on one page in under 10 minutes total, down from 1-2 hours today.

**User evidence.** Assumption, no direct user interview. Based on aggregated experience across many CDF deployments, where the Asset 360 pattern (SAP work orders + historian data + P&ID files) is the most requested first-value use case. This is a generalized Tier 1 certification app simulating a well-understood industrial pain point.
