from sqlalchemy import Column, Integer, Float, String, DateTime
from app.database import Base

class FeederStatus(Base):
    __tablename__ = "mv_feeder_status"
    FeederId            = Column(Integer, primary_key=True)
    FeederName          = Column(String)
    CapacityKVA         = Column(Integer)
    AvgVoltA            = Column(Float)
    AvgVoltB            = Column(Float)
    AvgVoltC            = Column(Float)
    AvgCurrentA         = Column(Float)
    AvgCurrentB         = Column(Float)
    AvgCurrentC         = Column(Float)
    CurrentImbalancePct = Column(Float)
    ActiveDSCount       = Column(Integer)
    TotalDSCount        = Column(Integer)
    DeadMeterCount      = Column(Integer)
    NoMeterCount        = Column(Integer)
    Status              = Column(String)
    RefreshedAt         = Column(DateTime)

class TheftSuspect(Base):
    __tablename__ = "mv_theft_suspects"
    DSId                = Column(Integer, primary_key=True)
    DSName              = Column(String)
    FeederName          = Column(String)
    Latitude            = Column(Float)
    Longitude           = Column(Float)
    AvgCurrentA         = Column(Float)
    AvgCurrentB         = Column(Float)
    AvgCurrentC         = Column(Float)
    CurrentImbalancePct = Column(Float)
    RiskLevel           = Column(String)
    RefreshedAt         = Column(DateTime)

class DeadZone(Base):
    __tablename__ = "mv_dead_zones"
    DSId         = Column(Integer, primary_key=True)
    DSName       = Column(String)
    FeederName   = Column(String)
    Latitude     = Column(Float)
    Longitude    = Column(Float)
    NameplateKVA = Column(Integer)
    ZoneType     = Column(String)
    RefreshedAt  = Column(DateTime)

class FeederTimeseries(Base):
    __tablename__ = "mv_feeder_timeseries_24h"
    FeederId     = Column(Integer, primary_key=True)
    HourBucket   = Column(DateTime, primary_key=True)
    AvgVoltA     = Column(Float)
    AvgCurrentA  = Column(Float)
    ActiveMeters = Column(Integer)
    RefreshedAt  = Column(DateTime)