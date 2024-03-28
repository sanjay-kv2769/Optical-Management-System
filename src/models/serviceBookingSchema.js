const mongoose = require('mongoose');
const serviceBookSchema = new mongoose.Schema({
  login_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'login_tb',
    required: true,
  },
  complaint: { type: String, required: true },
  date: { type: String, required: true },
});

var serviceBookDB = mongoose.model('servicebooking_tb', serviceBookSchema);
module.exports = serviceBookDB;
