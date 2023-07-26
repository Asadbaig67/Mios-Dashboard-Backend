const { default: mongoose } = require("mongoose")
const { Schema } = mongoose;
const CounterSchema = new Schema({
    model: {
        type: String,
        required: true
    },
    count: {
        type: Number,
    },
}, {
    timestamps: true
});


const Counter = mongoose.model("Counter", CounterSchema);
module.exports = Counter;