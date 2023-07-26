const { default: mongoose } = require("mongoose")
const { Schema } = mongoose;
const ShippingCalcSchema = new Schema({
    weight: {
        type: String,
        required: true, unique: true,
        validate: {
            validator: function (v) {
                return v === "half" || v === "one" || v === "greater";
            },
            message: 'Weight must be either half, one, or greater than one',
        },
    },
    incity: {
        type: Number,
        required: true
    },
    outcity: {
        type: Number,
        required: true
    }
})
const ShippingCalc = mongoose.model("ShippingCalc", ShippingCalcSchema);
module.exports = ShippingCalc;