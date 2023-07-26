const { default: mongoose } = require("mongoose");
const { Schema } = mongoose;
const CartSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  cart: {
    type: Array,
    default: [],
  },
});

const deleteCartIfEmpty = function (doc) {
  if (doc.cart.length === 0) {
    mongoose.model("Cart").deleteOne({ user: doc.user }, function (error) {
      if (error) {
        console.log(error);
      }
    });
  }
};

CartSchema.post("findOneAndUpdate", function (doc) {
  deleteCartIfEmpty(doc);
});

const Cart = mongoose.model("Cart", CartSchema);
module.exports = Cart;
