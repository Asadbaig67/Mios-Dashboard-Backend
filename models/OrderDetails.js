const { default: mongoose } = require("mongoose")
const { Schema } = mongoose;
const OrderDetailsSchema = new Schema({
    name:  {
        type: String,
        required: true
    },
    wholesaleprice: {
        type: Number,
        required: true
    },

    discountedprice: {
        type: Number
    },
    orderType: {
        type: String,
    },
    dropshipprice: {
        type: Number,
        required: true
    },

    qty: {
        type: Number,
        required: true
    },
    
    subtotal: {
        type: Number,
        required: true
    },

    orderStatus: {
        type: Boolean,
        required: true
    },

    profit: { 
        type: Number,
    },

    profitStatus: {
        type: Boolean,
        required: true,
        default: false
    }

})
    const OrderDetails = mongoose.model("OrderDetails", OrderDetailsSchema);
    module.exports = OrderDetails;