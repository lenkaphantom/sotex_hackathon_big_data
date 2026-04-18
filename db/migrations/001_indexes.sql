-- ============================================================
-- KORAK 1: KRITIČNI INDEKSI
-- Bez ovih, refresh staging tabela traje minuti umesto sekundi
-- ============================================================

-- MeterReads: joinujemo po Mid, filtriramo po Ts, čitamo Val i Cid
CREATE INDEX idx_MeterReads_Mid_Ts
    ON dbo.MeterReads (Mid, Ts DESC)
    INCLUDE (Val, Cid);

-- MeterReadTfes: iste potrebe
CREATE INDEX idx_MeterReadTfes_Mid_Ts
    ON dbo.MeterReadTfes (Mid, Ts DESC)
    INCLUDE (Val);

-- DistributionSubstation: joinujemo po Feeder11Id i Feeder33Id
CREATE INDEX idx_DS_Feeder11Id
    ON dbo.DistributionSubstation (Feeder11Id)
    INCLUDE (Id, MeterId, NameplateRating, Latitude, Longitude, Name);

CREATE INDEX idx_DS_Feeder33Id
    ON dbo.DistributionSubstation (Feeder33Id)
    INCLUDE (Id, MeterId, NameplateRating, Latitude, Longitude, Name);

-- Meters: lookup po Id
CREATE INDEX idx_Meters_Id_Multiplier
    ON dbo.Meters (Id)
    INCLUDE (MultiplierFactor, MSN);