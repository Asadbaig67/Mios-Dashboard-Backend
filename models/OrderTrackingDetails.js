const { default: mongoose } = require("mongoose");
const { Schema } = mongoose;
const OrderTrackingDetailsSchema = new Schema({
  order: {
    type: Schema.Types.ObjectId,
    ref: "Orders",
  },
  trackingId: {
    type: String,
  },
  courierServiceName: {
    type: String,
  },
});
const OrderTrackingDetails = mongoose.model(
  "OrderTrackingDetails",
  OrderTrackingDetailsSchema
);
module.exports = OrderTrackingDetails;
