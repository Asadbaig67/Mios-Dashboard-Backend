const { default: mongoose } = require("mongoose")
const { Schema } = mongoose;
const getNextSequenceValue = require("../middleware/counter");

const OrdersSchema = new Schema({
    id: {
        type: Number,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    billingDetails: {
        type: Object,
        required: true,
    },
    shippingDetails: {
        type: Object,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    products: {
        type: Array,
        required: true
    },
    orderAmount: {
        type: Number,
    },
    paymentOption: {
        type: String,
        required: true,
        enum: ['COD', 'Receipt']
    },
    paymentStatus: {
        type: Boolean,
        default: false
    },
    shippingPrice: {
        type: String,
        required: true
    },
    shippingStatus: {
        type: Boolean,
        default: false
    },
    orderStatus: {
        type: String,
        enum: ['Pending', 'Delivered', 'Shipped', 'Returned'],
        default: 'Pending'
    },
    profitAmount: {
        type: Number,
    },
    profitStatus: {
        type: String,
        default: 'Not Paid'
    },
    orderType: {
        type: String,
    }
})

OrdersSchema.pre("save", async function (next) {
    const doc = this;
    if (doc.id == null) {
        const seq = await getNextSequenceValue("Orders");
        doc.id = seq;
    }
    next();
});

const Orders = mongoose.model("Orders", OrdersSchema);
module.exports = Orders;