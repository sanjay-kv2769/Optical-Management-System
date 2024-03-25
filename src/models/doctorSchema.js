const mongoose = require('mongoose');
const doctorSchema = new mongoose.Schema({
  login_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'login_tb',
    required: true,
  },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  place: { type: String, required: true },
  // designation: { type: String, required: true },
});

var doctorDB = mongoose.model('doctor_tb', doctorSchema);
module.exports = doctorDB;
