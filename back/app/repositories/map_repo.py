from sqlalchemy.orm import Session
from app.models.staging import TheftSuspect, DeadZone

def get_all_map_points(db: Session):
    """
    Vraća sve dead zones i theft suspects za /api/map
    Posebno ih fetchujemo i kombinujemo u servisu
    """
    dead_zones = db.query(DeadZone).all()
    theft_suspects = db.query(TheftSuspect).all()
    return dead_zones, theft_suspects