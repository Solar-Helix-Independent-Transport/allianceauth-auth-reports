from django.db import migrations


def include_member_state(apps, schema_editor):
    """
        Nothing is visible until a state is included, so start new installs
        with AA's Member state. Existing configuration is left alone.
    """
    State = apps.get_model('authentication', 'State')
    AuthReportsConfiguration = apps.get_model(
        'authstats', 'AuthReportsConfiguration')
    member = State.objects.filter(name="Member").first()
    if member is None:
        return
    # django-solo's singleton row
    conf, _ = AuthReportsConfiguration.objects.get_or_create(pk=1)
    if not conf.states_to_include.exists():
        conf.states_to_include.add(member)


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0025_v5squash'),
        ('authstats', '0011_report_targets_and_constraints'),
    ]

    operations = [
        migrations.RunPython(include_member_state, migrations.RunPython.noop),
    ]
