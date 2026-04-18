-- ============================================================
-- KORAK 2: STAGING TABELE (zamena za Materialized Views)
-- ============================================================

-- -----------------------------------------------------------
-- mv_feeder_status: trenutni status svakog 11kV feeder-a
-- Refreshuje se svakih 5 minuta
-- Backend čita ovu tabelu za mapu i dashboard
-- -----------------------------------------------------------
CREATE TABLE dbo.mv_feeder_status (
    FeederId            INT             NOT NULL,
    FeederName          NVARCHAR(500),
    CapacityKVA         INT,
    AvgVoltA            FLOAT,          -- Prosečan napon faze A (posl. 1h)
    AvgVoltB            FLOAT,
    AvgVoltC            FLOAT,
    AvgCurrentA         FLOAT,          -- Prosečna struja faze A (posl. 1h)
    AvgCurrentB         FLOAT,
    AvgCurrentC         FLOAT,
    CurrentImbalancePct FLOAT,          -- (max_faza - min_faza) / avg * 100
    ActiveDSCount       INT,            -- Trafoi koji šalju podatke
    TotalDSCount        INT,            -- Ukupno priključenih trafoa
    DeadMeterCount      INT,            -- Trafoi sa brojilom ali bez podataka
    NoMeterCount        INT,            -- Trafoi bez ijednog brojila
    Status              NVARCHAR(30),   -- 'OK','VOLTAGE_DROP','SUSPECTED_THEFT','OVERLOADED','OFFLINE'
    RefreshedAt         DATETIME2       NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_mv_feeder_status PRIMARY KEY (FeederId)
);

-- -----------------------------------------------------------
-- mv_feeder_timeseries_24h: po-satna agregirani podaci za grafikone
-- Refreshuje se na sat
-- Backend čita ovu tabelu za chart komponentu
-- -----------------------------------------------------------
CREATE TABLE dbo.mv_feeder_timeseries_24h (
    FeederId        INT         NOT NULL,
    HourBucket      DATETIME2   NOT NULL,   -- zaokružen na sat: 2026-04-16 14:00:00
    AvgVoltA        FLOAT,
    AvgCurrentA     FLOAT,
    ActiveMeters    INT,
    RefreshedAt     DATETIME2   NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_mv_timeseries PRIMARY KEY (FeederId, HourBucket)
);

-- -----------------------------------------------------------
-- mv_theft_suspects: trafoi sa visokim imbalance-om
-- Direktan input za "Theft Detection" feature
-- -----------------------------------------------------------
CREATE TABLE dbo.mv_theft_suspects (
    DSId                INT             NOT NULL,
    DSName              NVARCHAR(500),
    FeederName          NVARCHAR(500),
    Latitude            DECIMAL(13,9),
    Longitude           DECIMAL(13,9),
    AvgCurrentA         FLOAT,
    AvgCurrentB         FLOAT,
    AvgCurrentC         FLOAT,
    CurrentImbalancePct FLOAT,
    RiskLevel           NVARCHAR(20),   -- 'HIGH','MEDIUM','LOW'
    RefreshedAt         DATETIME2       NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_mv_theft_suspects PRIMARY KEY (DSId)
);

-- -----------------------------------------------------------
-- mv_dead_zones: trafoi bez aktivnih podataka (za mapu)
-- -----------------------------------------------------------
CREATE TABLE dbo.mv_dead_zones (
    DSId            INT             NOT NULL,
    DSName          NVARCHAR(500),
    FeederName      NVARCHAR(500),
    Latitude        DECIMAL(13,9),
    Longitude       DECIMAL(13,9),
    NameplateKVA    INT,
    ZoneType        NVARCHAR(20),   -- 'NO_METER' ili 'DEAD_METER'
    RefreshedAt     DATETIME2       NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_mv_dead_zones PRIMARY KEY (DSId)
);