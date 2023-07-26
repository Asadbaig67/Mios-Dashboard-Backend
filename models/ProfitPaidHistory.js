const mongoose = require('mongoose');

const PaidProfitHistory = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  records: [{
    orders: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Orders',
      required: true,
      unique: true
    }],
    amount: {
      type: Number,
      required: true
    },
    datePaid: {
      type: Date,
      default: Date.now
    }
  }]
});

module.exports = mongoose.model('ProfitRecords', PaidProfitHistory);
