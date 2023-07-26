const { default: mongoose } = require("mongoose")
const { Schema } = mongoose;
const CategorySchema = new Schema({
  user: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    lowercase: true,
  },
})
const Category = mongoose.model("Category", CategorySchema);

module.exports = Category;