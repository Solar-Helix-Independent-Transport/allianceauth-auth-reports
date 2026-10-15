# Auth Reports

### Auth Data in report form, in Auth, fully configurable

AKA Corp Stats 3.0

- Configurable Report Framework for corporate, alliance and group level aggregation of any data
- Global overview of pass rates for selected reports across every corporation, alliance and group you can see
- each "field" is a smart filter similar to secure groups ( can use secure groups filters too ) or a "field only" filter provided by any application in the alliance auth ecosystem.
  - These filters MUST be the more "modern" kind with either a `process_field` or `audit_filter` methods. Legacy filters using only `process_filter` will not show any data. [Please see this link for more info](https://github.com/Solar-Helix-Independent-Transport/allianceauth-secure-groups/blob/main/THRID_PARTY.md)
- Data Exportable to CSV for external manipulation.

## What it needs:

- require corporate member tokens to build the corp groups to see people not known to auth, to make a report for that too. these can be added with the plus button in the menubar

## The General Road Map

if you want some features, please create an issue.

- state level report that shows all members of a state
- ~~group reports for group leaders~~ done in 1.0.0
- ~~overview screen with passing/failing per corp per "report"~~ done in 1.0.0
- more things...

## Filters/stats provided by this app

- show all alts for a main, with option to only show in corp alts

## Other Apps with filters

- [Corptools](https://github.com/Solar-Helix-Independent-Transport/allianceauth-corp-tools?tab=readme-ov-file#corptools)
- [Member Audit Smart Filters](https://github.com/ppfeufer/aa-ma-securegroups)
- [Secure Groups](https://github.com/Solar-Helix-Independent-Transport/allianceauth-secure-groups)
- [Secret Santa](https://gitlab.com/tactical-supremacy/aa-secret-santa)
- [Discord Multiverse](https://github.com/Solar-Helix-Independent-Transport/allianceauth-discord-multiverse)
- [Invoices](https://github.com/Solar-Helix-Independent-Transport/allianceauth-invoice-manager)

... more send a PR in with updates

## Installation

### Bare Metal

1. `pip install -U allianceauth-auth-stats`
1. add `'authstats',` to your local.py
1. migrate `python manage.py migrate`
1. collectstatic `python manage.py collectstatic --noinput`
1. sync commands `python manage.py reports_sync_filters`
1. create your first report `python manage.py reports_bootstrap_report`
1. restart auth
1. continue to the common section

### Docker

1. add `allianceauth-auth-stats==0.0.1` (update version number as required) to your requirements.txt file and rebuild your containers `docker compose build --no-cache`
1. add `'authstats',` to your local.py
1. recreate you docker stack `docker compose up -d`
1. enter your auth container and run migrations and collect static and sync filters `docker compose exec alliancauth_gunicorn bash`

- `auth collectstatic`
- `auth migrate`
- `auth reports_sync_filters`
- `auth reports_bootstrap_report`

1. continue to the common section

### Common setup steps

1. In the auth admin site edit `Auth Reports Configuration` to your liking.
1. set your states to include in reports as a minimum.
1. add permissions to the parties you wish to be able to use reports. permisions are defined below.
1. (optional) keep the global overview up to date by adding this to your `local.py` and restarting celery beat. It refreshes reports that are "Shown on the global overview" every 4 hours; everything else refreshes when it is opened.

```python
from celery.schedules import crontab

CELERYBEAT_SCHEDULE['authstats_refresh_overview_reports'] = {
    'task': 'authstats.tasks.refresh_overview_reports',
    'schedule': crontab(minute='0', hour='*/4'),
    'apply_offset': True,
}
```

## Screenshots

![Imgur](https://i.imgur.com/FhCpfMC.png)

![Imgur](https://i.imgur.com/MCV0zWX.png)

## Permissions

There are some basic access perms

All permissions are filtered by main character, if a person has neutral alts loaded they will also be visible to someone who can see their main.

| Perm               | Admin Site | Perm                                        | Description                                                                                           |
| ------------------ | ---------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| basic_access       | nill       | Can access reports module                   | Shows the Auth Reports module in the menu and gives access to the UI                                  |
| own_corp           | nill       | Can access own corporations reports.        |                                                                                                       |
| own_alliance       | nill       | Can access own alliances reports.           | Corporation reports for every corp in the alliance, plus the alliance report itself                   |
| own_state          | nill       | Can access own states reports.              |                                                                                                       |
| own_groups         | nill       | Can access reports for groups they lead.    | Group reports for groups the user leads. Being a group leader without this permission gives no access |
| global_reports     | nill       | Can access all reports for all targets.     | Every corporation, alliance and group report                                                          |
| restricted_reports | nill       | Can access restricted reports.              | Allows access to any report with restricted enabled                                                   |
| holding_corps      | nill       | Can access configured holding corp reports. | Allows access to holding corporation reports                                                          |

The global overview needs only `basic_access`; its rows are limited to the corporations, alliances and groups the viewer can already see.

### Report options

Each report has three switches in the admin site:

| Option            | Default | Effect                                                                       |
| ----------------- | ------- | ---------------------------------------------------------------------------- |
| `show_for_corps`  | on      | Report is available for corporations and alliances                           |
| `show_for_groups` | off     | Report is available for groups                                               |
| `show_in_global`  | off     | Report appears on the global overview (and in the optional periodic refresh) |

Note: Configure the "Holding Corps" in the `Auth Reports Configuration` Admin Model. via the auth admin interface.

## Upgrading to 1.0.0

- The old Bootstrap 3 UI has been removed; only the Bootstrap 5 UI ships. Requires Alliance Auth 4 or newer.
- Run `migrate`. Existing results are kept; if a corporation had more than one stored result for the same report, only the newest is kept.
- Existing reports keep working for corporations (`show_for_corps` is on) and are now also available for alliances. Turn on `show_for_groups` and `show_in_global` per report to use group reports and the overview.
- New permissions: `own_groups` and `global_reports`. `global_reports` replaces the old `global_corp_manager` check, which was never a real permission.
- Old report links (`/reports/show/<corp_id>/<report_id>/`) still work.
- Optionally add the overview refresh schedule from the setup steps above.

## Contributing

Make sure you have signed the [License Agreement](https://developers.eveonline.com/resource/license-agreement) by logging in at https://developers.eveonline.com before submitting any pull requests. All bug fixes or features must not include extra superfluous formatting changes.
