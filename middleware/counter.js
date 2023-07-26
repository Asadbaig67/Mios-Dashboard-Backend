const Counter = require("../models/Counter")

 const getNextSequenceValue = async (sequenceName) => {
    const sequenceDocument = await Counter.findOneAndUpdate(
        { model: sequenceName },
        { $inc: { count: 1 } },
        { new: true, upsert: true }
    );
    return sequenceDocument.count;
}

module.exports = getNextSequenceValue