const express = require('express');
const staffDB = require('../models/staffSchema');
const ordersDB = require('../models/ordersSchema');
const productsDB = require('../models/productsSchema');
const staffRoutes = express.Router();

require('dotenv').config();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const serviceBookDB = require('../models/serviceBookingSchema');

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

staffRoutes.post('/new-prod', upload.single('image'), async (req, res) => {
  console.log(req.body.brand);
  try {
    const Product = {
      brand: req.body.brand,
      type: req.body.type,
      model: req.body.model,
      color: req.body.color,
      material: req.body.material,
      price: req.body.price,
      description: req.body.description,
      image: req.file ? req.file.path : null,
    };
    const Data = await productsDB(Product).save();
    // console.log(Data);
    if (Data) {
      // const data = {
      //   Success: true,
      //   Error: false,
      //   Message: 'product added successfully',
      // };
      return res.status(201).json({
        Success: true,
        Error: false,
        data: Data,
        Message: 'Product added successfully',
        // return res.render('add-product', { data });
      });
    } else {
      return res.status(400).json({
        Success: false,
        Error: true,
        Message: 'Failed adding Product ',
      });
      // const data = {
      //   Success: false,
      //   Error: true,
      //   Message: 'Failed adding product ',
      // };
      // return res.render('add-product', { data });
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

staffRoutes.put('/attendance-staff/:id', async (req, res) => {
  try {
    const loginId = req.params.id;
    function formatDate(date) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    // const date = new Date();
    const date = formatDate(new Date());
    const isPresent = true;
    // const isPresent = req.body.isPresent;

    const result = await staffDB.updateOne(
      { login_id: loginId },
      { $push: { attendance: { date, isPresent } } }
    );

    if (result.nModified === 0) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    return res
      .status(200)
      .json({ message: 'Attendance updated successfully', isPresent: true });
  } catch (error) {
    return res.status(500).json({
      Success: false,
      Error: true,
      Message: 'Internal Server Error',
      ErrorMessage: error.message,
    });
  }
});

staffRoutes.get('/view-service-bookings', async (req, res) => {
  try {
    const bookData = await serviceBookDB.aggregate([
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
          complaint: {
            $first: '$complaint',
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

staffRoutes.put('/update-service-stat/:id/:booked_date', async (req, res) => {
  try {
    const loginId = req.params.id;
    const bookedDate = req.params.booked_date;

    const result = await serviceBookDB.updateOne(
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

staffRoutes.get('/view-orders', async (req, res) => {
  try {
    // const login_id = req.params.login_id;
    // console.log(login_id);
    const result = await ordersDB.aggregate([
      // {
      //   $match: {
      //     login_id: new mongoose.Types.ObjectId(login_id),
      //   },
      // },
      {
        $lookup: {
          from: 'products_tbs',
          localField: 'product_id',
          foreignField: '_id',
          as: 'products_data',
        },
      },
      {
        $unwind: '$products_data',
      },
      {
        $lookup: {
          from: 'login_tbs',
          localField: 'login_id',
          foreignField: '_id',
          as: 'login_data',
        },
      },
      {
        $unwind: '$login_data',
      },
    ]);
    return res.status(200).json({
      Success: true,
      Error: false,
      Data: result,
      Message: 'Order data fetched successfully',
    });
    // return res.send(result);
  } catch (error) {
    return res.status(500).json({
      Success: false,
      Error: true,
      Message: 'Internal Server Error',
      ErrorMessage: error.message,
    });
  }
});

module.exports = staffRoutes;
