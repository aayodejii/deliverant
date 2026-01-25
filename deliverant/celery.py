import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "deliverant.settings.development")

app = Celery("deliverant")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

# Beat schedule will be enabled in Phase 5 when worker tasks are implemented
# app.conf.beat_schedule = {
#     "schedule-due-deliveries": {
#         "task": "workers.scheduler.schedule_due_deliveries",
#         "schedule": 1.0,
#     },
#     "recover-expired-leases": {
#         "task": "workers.lease.recover_expired_leases",
#         "schedule": 10.0,
#     },
# }
