const { default: mongoose } = require("mongoose")
const { Schema } = mongoose;
const UserSchema = new Schema({
    role: {
        type: String,
        default: "wholeseller"
    },
    name: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    address: {
        type: String,
    },
    phone: {
        type: String,
        required: true
    },
    company: {
        type: String,
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    dropShipperStatus: {
        type: Boolean,
        default: false
    },
});

const User = mongoose.model("User", UserSchema);
module.exports = User;