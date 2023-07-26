const { default: mongoose } = require("mongoose")
const { Schema } = mongoose;
const PaymentSchema = new Schema({
    date: {
        type: Date,
        default: Date.now
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Orders',
        required: true,
        unique: true
    },
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    photo: {
        url: {
            type: String,
            required: true
        },
        public_id: {
            type: String,
            required: true
        }
    },
    paymentAmount: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: Boolean,
        default: false
    }
})
const Payment = mongoose.model("Payment", PaymentSchema);
module.exports = Payment;