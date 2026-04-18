from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy import text
from app.database import SessionLocal

scheduler = BackgroundScheduler()

def refresh_all():
    with SessionLocal() as session:
        for proc in [
            "EXEC dbo.usp_Refresh_FeederStatus",
            "EXEC dbo.usp_Refresh_TheftSuspects",
            "EXEC dbo.usp_Refresh_DeadZones",
            "EXEC dbo.usp_Refresh_Timeseries24h",
        ]:
            session.execute(text(proc))
        session.commit()

def start_scheduler():
    scheduler.add_job(refresh_all, "interval", minutes=5, id="refresh_all")
    scheduler.start()