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
  date: {
    type: String,
    default: () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero based
      const year = now.getFullYear();
      return `${day}-${month}-${year}`;
    },
  },
});

var docBookDB = mongoose.model('docbooking_tb', docBookingSchema);
module.exports = docBookDB;
