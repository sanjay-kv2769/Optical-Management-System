const express = require('express');
const doctorRoutes = express.Router();
require('dotenv').config();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const docBookDB = require('../models/docBookingSchema');
const { default: mongoose } = require('mongoose');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'vatakara projects/optical management',
  },
});

const upload = multer({ storage: storage });

doctorRoutes.get('/view-bookings/:id', async (req, res) => {
  try {
    const loginId = req.params.id;
    // const bookData = await docBookDB.find({ doctor_id: loginId });
    const bookData = await docBookDB.aggregate([
      {
        $lookup: {
          from: 'register_tbs',
          localField: 'login_id',
          foreignField: 'login_id',
          as: 'result',
        },
      },
      {
        $unwind: {
          path: '$result',
        },
      },
      {
        $group: {
          _id: '$_id',
          login_id: {
            $first: '$login_id',
          },
          doctor_id: {
            $first: '$doctor_id',
          },

          date: {
            $first: '$date',
          },
          name: {
            $first: '$result.name',
          },
          phone: {
            $first: '$result.phone',
          },
        },
      },
      {
        $match: {
          doctor_id: new mongoose.Types.ObjectId(loginId),
        },
      },
    ]);

    if (bookData) {
      return res.status(200).json({
        Success: true,
        Error: false,
        data: bookData,
        Message: 'Booking fetched successfully',
      });
    } else {
      return res.status(400).json({
        Success: false,
        Error: true,
        Message: 'Booking fetching failed',
      });
    }
  } catch (error) {
    return res.status(500).json({
      Success: false,
      Error: true,
      Message: 'Internal Server Error',
      ErrorMessage: error.message,
    });
  }
});


doctorRoutes.put('/update-booking-stat/:id/:booked_date', async (req, res) => {
  try {
    const loginId = req.params.id;
    const bookedDate = req.params.booked_date;

    const result = await docBookDB.updateOne(
      { login_id: loginId, date: bookedDate },
      { $set: { status: 'confirmed' } }
    );

    if (result.nModified === 0) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    return res
      .status(200)
      .json({ message: 'Service status updated successfully' });
  } catch (error) {
    return res.status(500).json({
      Success: false,
      Error: true,
      Message: 'Internal Server Error',
      ErrorMessage: error.message,
    });
  }
});

module.exports = doctorRoutes;
