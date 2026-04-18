from sqlalchemy.orm import Session
from app.models.staging import FeederTimeseries

def get_timeseries_for_feeder(db: Session, feeder_id: int):
    return (
        db.query(FeederTimeseries)
        .filter(FeederTimeseries.FeederId == feeder_id)
        .order_by(FeederTimeseries.HourBucket.asc())
        .all()
    )