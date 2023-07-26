const { default: mongoose } = require("mongoose")
const { Schema } = mongoose;
const ShippingDetailsSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    name:  {
        type: String,
        required: true
    },
    phoneNo: {
        type: Number,
        required: true
    },
    zipCode: {
        type: Number,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    }
})
    const ShippingDetails = mongoose.model("ShippingDetails", ShippingDetailsSchema);
    module.exports = ShippingDetails;