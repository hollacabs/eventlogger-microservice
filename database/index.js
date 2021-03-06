const cassandra = require('cassandra-driver');
const fs = require('fs');
const moment = require('moment');
const cities = require('../dataGen/cities.js');

const client = new cassandra.Client({
    contactPoints: ['127.0.0.1'], 
    keyspace: 'eventlogger'
});

client.connect((err) => {
    if(err) {
        console.log('Error connecting to Cassandra', err);
    }
    console.log('Connection to Cassandra successful');
});

let getAvgSurge = (cityArray) => { 
    return Promise.all(cityArray.map(city => {
        let query = 'SELECT * FROM avg_surge_by_city where day = ? and city = ? and timeinterval = ?'
        let day = moment().format("YYYY-MM-DD");
        let timeInterval = moment().format('HH');
        let params = [day, city, timeInterval];
        return client.execute(query, params, { prepare: true })
    }));
}

let getAvgDrivers = (cityArray) => {
    return Promise.all(cityArray.map(city => {
        let query = 'SELECT * FROM avg_drivers_by_city where day = ? and city = ? and timeinterval = ?';
        let day = moment().format("YYYY-MM-DD");
        let timeInterval = moment().format('HH');
        let params = [day, city, timeInterval];
        return client.execute(query, params, { prepare: true })
    }));
}

let aggregateAvgSurge = () => {
    let query = 'select city, avg(surgeMultiplier) as surgeMultipler from pricing_service_logs where day = ? and timeinterval = ? group by city';
    let day = moment().format("YYYY-MM-DD");
    let timeInterval = moment().format('HH');
    let params = [day, timeInterval];
    return client.execute(query, params, { prepare: true });
}

let insertAvgSurge = () => {
    aggregateAvgSurge()
        .then(data => {
            data.rows.forEach((cityObject) => {
                let query = 'INSERT INTO avg_surge_by_city (city, day, timeinterval, surgeMultiplier) values (?, ?, ?, ?)';
                let city = cityObject.city;
                let surgeMultipler = cityObject.surgemultipler;
                let day = moment().format("YYYY-MM-DD");
                let timeInterval = moment().format('HH');
                let params = [city, day, timeInterval, surgeMultipler];

                return client.execute(query, params, { prepare: true });
            })
        })
}

let insertAvgDrivers = (driverArray) => {
    driverArray.forEach(cityObj => {
        let query = 'INSERT INTO avg_drivers_by_city (city, day, timeinterval, avgDrivers) values (?, ?, ?, ?)';
        let city = cityObj.city;
        let avgDrivers = cityObj.drivers;
        let day = moment().format("YYYY-MM-DD");
        let timeInterval = moment().format('HH');
        let params = [city, day, timeInterval, avgDrivers];
    
        return client.execute(query, params, { prepare: true });
    })
}

let insertPricingLogs = (userId, city, surgeMultiplier, price, priceTimestamp) => {
    let query = 'INSERT INTO pricing_service_logs (userId, city, surgeMultiplier, price, priceTimestamp, timeInterval, day) values (?, ?, ?, ?, ?, ?, ?)';
    let day = moment(priceTimestamp).format("YYYY-MM-DD");
    let priceTimestampMod = moment(priceTimestamp).format('YYYY-MM-DD HH:mm:ssZ').split('-').slice(0, 3).join('-').concat('Z')
    let timeInterval = moment(priceTimestamp).format('HH');
    let params = [userId, city, surgeMultiplier, price, priceTimestampMod, timeInterval, day];
    return client.execute(query, params, { prepare: true })
}

let insertDriverLogs = (userId, city, priceTimestamp) => {
    let query = 'INSERT INTO ridematching_service_logs (userId, city, priceTimestamp, timeInterval, day) values (?, ?, ?, ?, ?)';
    let day = moment(priceTimestamp).format("YYYY-MM-DD");
    let priceTimestampMod = moment(priceTimestamp).format('YYYY-MM-DD HH:mm:ssZ').split('-').slice(0, 3).join('-').concat('Z');
    let timeInterval = moment(priceTimestamp).format('HH');
    let params = [userId, city, priceTimestampMod, timeInterval, day];
    
    return client.execute(query, params, { prepare: true })
}

let getUserCount = () => {
    let query = 'SELECT city, day, timeinterval, count(*) as totalUsers from pricing_service_logs where day = ? and timeinterval = ? group by city';
    let day = moment().format("YYYY-MM-DD");
    let timeInterval = moment().format("HH");
    let params = [day, timeInterval];

    return client.execute(query, params, { prepare: true });
}

let getMatchedCount = () => {
    let query = 'SELECT city, day, timeinterval, count(*) as matchRides from ridematching_service_logs where day = ? and timeinterval = ? group by city';
    let day = moment().format("YYYY-MM-DD");
    let timeInterval = moment().format("HH");
    let params = [day, timeInterval];
    return client.execute(query, params, { prepare: true });
}

let getConversionRatio = () => {
    let query = 'SELECT * from conversion_ratio where day = ? and timeinterval = ?';
    let day = moment().format("YYYY-MM-DD");
    let timeInterval = moment().format("HH");
    let params = [day, timeInterval]; 

    return client.execute(query, params, { prepare: true });
}

let insertConversionRatio = (day, city, timeinterval, conversion_ratio) => {
    let query = 'INSERT INTO conversion_ratio (day, city, timeInterval, insertTime, conversion_ratio) values (?, ?, ?, ?, ?)';
    let dayMod = moment(day).format("YYYY-MM-DD");
    let insertTime = moment().format('YYYY-MM-DD HH:mm:ssZ').split('-').slice(0, 3).join('-').concat('Z');
    let params = [dayMod, city, timeinterval, insertTime, conversion_ratio];
    return client.execute(query, params, { prepare: true });
}

module.exports = {
    getAvgSurge, 
    getAvgDrivers, 
    aggregateAvgSurge, 
    insertAvgSurge, 
    insertPricingLogs, 
    insertDriverLogs, 
    getConversionRatio, 
    getUserCount, 
    getMatchedCount,
    insertConversionRatio, 
    insertAvgDrivers
}
