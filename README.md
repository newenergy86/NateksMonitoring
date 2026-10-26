# Nateks Monitoring

Monitoring application for Nateks/NetXpert switches, integrated with Zabbix.

## Repositories
- Monitoring and Zabbix templates: https://github.com/newenergy86/NateksMonitoring
- Legacy Web UI adapter: https://github.com/newenergy86/NateksLegacyAdapter

## Start every work session here
1. Read [current task](docs/TODO.md).
2. Read [decision and experiment log](docs/HISTORY.md).
3. Check [OID reference](docs/OID-CATALOG.md) before changing SNMP items.
4. Inspect current source/templates before suggesting edits.
5. Make one change at a time, record the test result, then update the log.

## Project workflow
- [Project workflow guide](docs/PROJECT-GUIDE.md) — how we develop, test, document and preserve context.
- [Current task and next step](docs/TODO.md)
- [History / decisions / test outcomes](docs/HISTORY.md)
- [OID catalog](docs/OID-CATALOG.md)
- [Monitoring model](docs/MONITORING_MODEL.md)
- [Milestone 2026-08-21](docs/MILESTONE-2026-08-21.md)

## Project guardrails
- Do not change `dashboard/app.js` until the relevant data is confirmed working in Zabbix.
- Do not replace full Zabbix templates wholesale; preserve the current working configuration and patch only verified issues.
- Do not mark an OID as working until a successful GET/WALK on the target device is recorded.
- Keep tested facts separate from hypotheses.
- Export the live Zabbix template before importing any modified YAML.
