-- bin/cqlsh
DROP KEYSPACE IF EXISTS eventlogger;
CREATE KEYSPACE eventlogger WITH REPLICATION = {
    -- 'class': 'NetworkTopologyStrategy', 
    'class': 'SimpleStrategy', 
    'replication_factor': 3
};
use eventlogger;

DROP TABLE IF EXISTS eventlogger.pricing_service_logs;
DROP TABLE IF EXISTS eventlogger.ridematching_service_logs;
DROP TABLE IF EXISTS eventlogger.avg_surge_by_city;
DROP TABLE IF EXISTS eventlogger.avg_drivers_by_city;
DROP TABLE IF EXISTS eventlogger.conversion_ratio;

 
CREATE TABLE pricing_service_logs (
    userId INT, 
    city VARCHAR, 
    -- pickUpLocationLat FLOAT, 
    -- pickUpLocationLong FLOAT, 
    -- dropOffLocationLat FLOAT, 
    -- dropOffLocationLong FLOAT, 
    surgeMultiplier FLOAT, 
    price VARCHAR, 
    priceTimestamp TIMESTAMP,
    timeInterval INT, 
    day varchar,  
    PRIMARY KEY((day, timeInterval), city, priceTimestamp, userId)
);

-- copy eventlogger.pricing_service_logs (userId, pickUpLocationLat, pickUpLocationLong, dropOffLocationLat, dropOffLocationLong, surgeMultiplier, price, timeInterval, day, priceTimestamp) from 'fakeData.csv';
-- copy eventlogger.pricing_service_logs (userId, city, surgeMultiplier, price, timeInterval, day, priceTimestamp) from 'fakeData.csv';


CREATE TABLE ridematching_service_logs (
    userId INT, 
    city VARCHAR, 
    day varchar, 
    priceTimestamp TIMESTAMP,
    timeinterval int, 
    PRIMARY KEY((day, timeinterval), city, priceTimestamp, userId)
);

CREATE TABLE conversion_ratio (
    city varchar, 
    day varchar, 
    timeinterval INT, 
    insertTime timestamp, 
    conversion_ratio FLOAT, 
    PRIMARY KEY ((day, timeinterval), city, insertTime)
);

CREATE TABLE avg_surge_by_city (
    city VARCHAR, 
    day varchar,
    timeInterval INT, 
    surgeMultiplier FLOAT, 
    PRIMARY KEY(day, timeInterval, city)
    )    
WITH CLUSTERING ORDER BY (timeInterval DESC);

-- copy eventlogger.avg_surge_by_city (city, day, timeinterval, surgeMultipler) from 'fakeAvgSurge.csv';


CREATE TABLE avg_drivers_by_city (
    city VARCHAR, 
    day varchar,
    timeInterval INT,  
    avgDrivers FLOAT,
    PRIMARY KEY((day, timeInterval), city)
    )    
WITH CLUSTERING ORDER BY (city DESC);


-- CREATE MATERIALIZED VIEW avg_drivers_by_city_vw as 
--     select city, day, timeinterval, avgDrivers
--     from avg_drivers_by_city
--     where city is not null 
--         and day is not null
--         and timeinterval is not null
--         and avgDrivers is not null
--     PRIMARY KEY((timeinterval), day, city)

-- copy eventlogger.avg_drivers_by_city (city, day, timeinterval, avgDrivers) from 'fakeAvgDrivers.csv';
