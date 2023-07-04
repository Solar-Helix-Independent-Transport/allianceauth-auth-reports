# Auth Reports

### Auth Data in report form, in Auth, fully configurable

AKA Corp Stats 3.0

- Configurable Report Framework for corporate level aggregation of any data
- each "field" is a smart filter similar to secure groups ( can use secure groups filters too ) or a "field only" filter provided by any application in the alliance auth ecosystem.
  - These filters MUST be the more modern kind with either a `process_field` or `audit_filter` methods. Legacy filters using only `process_filter` will not show any data. [Please see this link for more info](https://github.com/Solar-Helix-Independent-Transport/allianceauth-secure-groups/blob/main/THRID_PARTY.md)

## What it needs:

- require corporate member tokens to build the corp groups to see people not known to auth, to make a report for that too. these can be added with the pluss button in the menubar

## Min Release Req's:

- [ ] a basic report that does what corpstats 2.0 does now
  - [x] alts to mains
  - [ ] join dates
  - [ ] last login
- [x] permissions that give access to all reports at a `corp/alli/state/holding corps` level
- [ ] overview screen with passing/failing per corp per "report" ( maybe have this as optional aka "show_on_global_overview_report" )

## Nice to haves future plans

- state level report that shows all members of a state
- csv/json/other export
- more things...

## Filters/stats provided by this app

- show all alts for a main, with option to only show in corp alts

## Installation

**BETA INSTALL** This will be updated with QOL in later releases but this is still BETA software

### Bare Metal

1. `pip install allianceauth-auth-stats==0.0.1b2`
1. add `'authstats',` to your local.py
1. migrate `python manage.py migrate`
1. collectstatic `python manage.py collectstatic --noinput`
1. sync commands `python manage.py reports_sync_filters`
1. restart auth
1. continue to the common section

### Docker

1. add `allianceauth-auth-stats==0.0.1b1` to your requirements.txt file and rebuild your containers `docker compose build --no-cache`
1. add `'authstats',` and `'solo',` to your local.py
1. recreate you docker stack `docker compose up -d`
1. enter your auth container and run migrations and collect static and sync filters `docker compose exec auth bash`

- `auth collectstatic`
- `auth migrate`
- `auth reports_sync_filters`

1. continue to the common section

### Common setup steps

1. run the following command to sync all the available filters `manage.py reports_sync_filters`
1. In the auth admin site edit the `Auth Reports Configuration` to your liking.
1. set your states to include in reports at a minimum.
1. Create a new `Report Field: Character Alts` defaults are fine
1. create your first report.

- Name "Corpstats"
- Check show character images
- Setup your fields
- Don't forget to add the characters field you setup in the previous step. i recommend you uncheck sorting on this field.

1. add permissions to the parties you wish to be able to use reports. permisions are defined below.

## Screenshots

![Imgur](https://i.imgur.com/FhCpfMC.png)

![Imgur](https://i.imgur.com/MCV0zWX.png)

## Permissions

There are some basic access perms

All permissions are filtered by main character, if a person has neutral alts loaded they will also be visible to someone who can see their main.

| Perm         | Admin Site | Perm                                 | Description                                                          |
| ------------ | ---------- | ------------------------------------ | -------------------------------------------------------------------- |
| basic_access | nill       | Can access reports module            | Shows the Auth Reports module in the menu and gives access to the UI |
| own_corp     | nill       | Can access own corporations reports. |                                                                      |
| own_alliance | nill       | Can access own alliances reports.    |                                                                      |
| own_state    | nill       | Can access own states reports.       |                                                                      |

### Future Perms

these are not hooked up yet

| Perm               | Admin Site | Perm                                        | Description |
| ------------------ | ---------- | ------------------------------------------- | ----------- |
| restricted_reports | nill       | Can access restricted reports.              |             |
| holding_corps      | nill       | Can access configured holding corp reports. |             |

Note: Configure the "Holding Corps" in the `Auth Reports Configuration` Admin Model. via the auth admin interface.

## Settings

| Setting              | Default        | Description                     |
| -------------------- | -------------- | ------------------------------- |
| `AUTHSTATS_APP_NAME` | "Auth Reports" | Name on the menu for Auth Stats |

## Contributing

Make sure you have signed the [License Agreement](https://developers.eveonline.com/resource/license-agreement) by logging in at https://developers.eveonline.com before submitting any pull requests. All bug fixes or features must not include extra superfluous formatting changes.
