const { default: mongoose } = require("mongoose")
const { Schema } = mongoose;
const BankSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    bankName: {
        type: String,
        required: true
    },
    accountHolderName: {
        type: String,
        required: true
    },
    iban: {
        type: String,
        required: true
    },

});

const Bank = mongoose.model("Bank", BankSchema);
module.exports = Bank;