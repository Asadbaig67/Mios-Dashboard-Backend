const { default: mongoose } = require("mongoose");
const { Schema } = mongoose;
const MyShopchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  product: [{
    type: Schema.Types.ObjectId,
    ref: "Product",
  }],
});

const deletemyShopIfEmpty = function (doc) {
  if (doc.product.length === 0) {
    mongoose.model("MyShop").deleteOne({ user: doc.user }, function (error) {
      if (error) {
        console.log(error);
      }
    });
  }
};

MyShopchema.post("findOneAndUpdate", function (doc) {
  deletemyShopIfEmpty(doc);
});

const MyShop = mongoose.model("MyShop", MyShopchema);
module.exports = MyShop;