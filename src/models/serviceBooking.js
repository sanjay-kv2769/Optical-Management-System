const mongoose = require('mongoose');
const docBookingSchema = new mongoose.Schema({
  login_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'login_tb',
    required: true,
  },
  doctor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'doctors_tb',
    required: true,
  },
  date: { type: String, required: true },
});

var docBookDB = mongoose.model('docbooking_tb', docBookingSchema);
module.exports = docBookDB;
