# Auth Reports

### Auth Data in report form, in Auth, fully configurable by you

AKA Corp Stats 3.0

Included `Bits and Bobs`:

- Configurable Report Framework for corporate level aggregation of data
- each "field" is bassically a smart filter from sec groups ( can use them too )
- data is cached so the reports run "hourly" or so
- pass/fail stats collated over time. not full data.

What it needs:

- require corpotate member tokens to build the corp groups to see people not known to auth

Min Release Req's
[ ] a basic report that does what corpstats does now. - alts / mains and join dates
[ ] permisions that give access to all reports at a `corp/alli/state/holding corps` level
[ ] overview screen with passing/failing per corp per "report" ( maybe have this as optional aka "show_on_global_overview_report"

Nice to haves

- state level report that shows all members of a state

- Filters/stats provided by this app
- show all alts

## Installation

1.
2.

## Permissions

There are some basic access perms

All permissions are filtered by main character, if a person has neutral alts loaded they will also be visible to someone who can see their main.

| Perm | Admin Site | Perm | Description |
| ---- | ---------- | ---- | ----------- |
| 1    | 2          | 3    | 4           |

Note: Configure the "Holding Corps" in the `Auth Reports Configuration` Admin Model. via the auth admin interface.

## Settings

| Setting              | Default        | Description                     |
| -------------------- | -------------- | ------------------------------- |
| `AUTHSTATS_APP_NAME` | "Auth Reports" | Name on the menu for Auth Stats |

## Contributing

Make sure you have signed the [License Agreement](https://developers.eveonline.com/resource/license-agreement) by logging in at https://developers.eveonline.com before submitting any pull requests. All bug fixes or features must not include extra superfluous formatting changes.
