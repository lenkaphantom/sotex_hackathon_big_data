-- ============================================================
-- KORAK 3: STORED PROCEDURE ZA REFRESH
-- Svaka se poziva iz SQL Agent Job-a
-- ============================================================

-- -----------------------------------------------------------
-- usp_Refresh_FeederStatus (pozivati na svakih 5 minuta)
-- -----------------------------------------------------------

CREATE OR ALTER PROCEDURE dbo.usp_Refresh_TheftSuspects
AS
BEGIN
    SET NOCOUNT ON;
    TRUNCATE TABLE dbo.mv_theft_suspects;

    -- Korak 1: Izračunaj prosek svake faze posebno po trafou
    WITH PhaseAverages AS (
        SELECT
            ds.Id                                                        AS DSId,
            ds.Name                                                      AS DSName,
            f11.Name                                                     AS FeederName,
            ds.Latitude,
            ds.Longitude,
            AVG(CASE WHEN mr.Cid = 9  AND mr.Val > 10 THEN mr.Val END)  AS AvgA,
            AVG(CASE WHEN mr.Cid = 10 AND mr.Val > 10 THEN mr.Val END)  AS AvgB,
            AVG(CASE WHEN mr.Cid = 11 AND mr.Val > 10 THEN mr.Val END)  AS AvgC,
            COUNT(DISTINCT mr.Cid)                                       AS PhaseCount,
            COUNT(*)                                                     AS ReadingCount
        FROM dbo.MeterReads mr
        JOIN dbo.DistributionSubstation ds ON mr.Mid = ds.MeterId
        LEFT JOIN dbo.Feeders11 f11        ON ds.Feeder11Id = f11.Id
        WHERE mr.Val > 10
        GROUP BY ds.Id, ds.Name, f11.Name, ds.Latitude, ds.Longitude
        HAVING COUNT(DISTINCT mr.Cid) >= 3 AND COUNT(*) > 50
    )
    -- Korak 2: Poredimo proseke faza (ne sirove vrednosti!)
    INSERT INTO dbo.mv_theft_suspects (
        DSId, DSName, FeederName,
        Latitude, Longitude,
        AvgCurrentA, AvgCurrentB, AvgCurrentC,
        CurrentImbalancePct, RiskLevel, RefreshedAt
    )
    SELECT
        DSId, DSName, FeederName,
        Latitude, Longitude,
        AvgA, AvgB, AvgC,
        ROUND(
            (  (SELECT MAX(v) FROM (VALUES (AvgA),(AvgB),(AvgC)) AS t(v))
             - (SELECT MIN(v) FROM (VALUES (AvgA),(AvgB),(AvgC)) AS t(v))
            ) / NULLIF((AvgA + AvgB + AvgC) / 3.0, 0) * 100
        , 2),
        CASE
            WHEN (  (SELECT MAX(v) FROM (VALUES (AvgA),(AvgB),(AvgC)) AS t(v))
                  - (SELECT MIN(v) FROM (VALUES (AvgA),(AvgB),(AvgC)) AS t(v))
                 ) / NULLIF((AvgA + AvgB + AvgC) / 3.0, 0) * 100 > 50  THEN 'HIGH'
            WHEN (  (SELECT MAX(v) FROM (VALUES (AvgA),(AvgB),(AvgC)) AS t(v))
                  - (SELECT MIN(v) FROM (VALUES (AvgA),(AvgB),(AvgC)) AS t(v))
                 ) / NULLIF((AvgA + AvgB + AvgC) / 3.0, 0) * 100 > 25  THEN 'MEDIUM'
            ELSE 'LOW'
        END,
        GETDATE()
    FROM PhaseAverages
    WHERE AvgA IS NOT NULL AND AvgB IS NOT NULL AND AvgC IS NOT NULL;
END;
GO