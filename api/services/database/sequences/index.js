const CounterModel = require('../models/Counter');

async function getNextSequenceNumber(sequenceName) {
    const nextSequenceNumber = await CounterModel.increment(sequenceName);
    return nextSequenceNumber;
}


module.exports = {
    getNextSequenceNumber
};