const express = require('express');
const ordersDB = require('../models/ordersSchema');
const { default: mongoose } = require('mongoose');
const complaintsDB = require('../models/complaintSchema');
const cartDB = require('../models/cartSchema');
const addressDB = require('../models/addressSchema');
const docBookDB = require('../models/docBookingSchema');
const doctorDB = require('../models/doctorSchema');
const serviceBookDB = require('../models/serviceBookingSchema');
const feedbacksDB = require('../models/feedbackSchema');
const userRoutes = express.Router();

userRoutes.post('/add-cart/:login_id/:prod_id', async (req, res) => {
  try {
    const login_id = req.params.login_id;
    const productId = req.params.prod_id;

    const existingProduct = await cartDB.findOne({
      product_id: productId,
      login_id: login_id,
    });
    if (existingProduct) {
      const quantity = existingProduct.quantity;
      const updatedQuantity = quantity + 1;

      const updatedData = await cartDB.updateOne(
        { _id: existingProduct._id },
        { $set: { quantity: updatedQuantity } }
      );

      return res.status(200).json({
        success: true,
        error: false,
        data: updatedData,
        message: 'incremented existing product quantity',
      });
    } else {
      const cartDatas = {
        login_id: login_id,
        product_id: productId,
        price: req.body.price,
      };
      const Data = await cartDB(cartDatas).save();
      if (Data) {
        return res.status(200).json({
          Success: true,
          Error: false,
          data: Data,
          Message: 'Product added to cart successfully',
        });
      } else {
        return res.status(400).json({
          Success: false,
          Error: true,
          Message: 'Product adding failed',
        });
      }
    }
  } catch (error) {
    return res.status(500).json({
      Success: false,
      Error: true,
      Message: 'Internal Server error',
      ErrorMessage: error.message,
    });
  }
});
userRoutes.post(
  '/update-cart-quantity/:login_id/:prod_id',
  async (req, res) => {
    try {
      const login_id = req.params.login_id;
      const productId = req.params.prod_id;
      const quantity = req.body.quantity;

      const updatedData = await cartDB.updateOne(
        { product_id: productId, login_id: login_id },

        { $set: { quantity: quantity } }
      );

      if (updatedData) {
        return res.status(200).json({
          Success: true,
          Error: false,
          data: updatedData,
          Message: 'cart updated successfully',
        });
      } else {
        return res.status(400).json({
          Success: false,
          Error: true,
          Message: 'Cart update failed',
        });
      }
    } catch (error) {
      return res.status(500).json({
        Success: false,
        Error: true,
        Message: 'Internal Server error',
        ErrorMessage: error.message,
      });
    }
  }
);

userRoutes.get('/view-cart/:login_id', async (req, res) => {
  try {
    const user_id = req.params.login_id;
    // console.log(user_id);

    const cartProducts = await cartDB.aggregate([
      {
        $lookup: {
          from: 'products_tbs',
          localField: 'product_id',
          foreignField: '_id',
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
          product_id: {
            $first: '$product_id',
          },
          brand: {
            $first: '$result.brand',
          },
          type: {
            $first: '$result.type',
          },
          model: {
            $first: '$result.model',
          },
          color: {
            $first: '$result.color',
          },
          material: {
            $first: '$result.material',
          },
          price: {
            $first: '$result.price',
          },
          description: {
            $first: '$result.description',
          },
          price: {
            $first: '$price',
          },
          status: {
            $first: '$status',
          },
          quantity: {
            $first: '$quantity',
          },
          image: {
            $first: {
              $cond: {
                if: { $ne: ['$result.image', null] },
                then: '$result.image',
                else: 'default_image_url',
              },
            },
          },
        },
      },
      {
        $addFields: {
          subtotal: { $multiply: ['$price', '$quantity'] },
        },
      },
      {
        $match: {
          login_id: new mongoose.Types.ObjectId(user_id),
        },
      },
    ]);
    console.log(cartProducts);
    if (cartProducts) {
      return res.status(200).json({
        Success: true,
        Error: false,
        data: cartProducts.length > 0 ? cartProducts : [],
        Message: 'Product fetched from cart successfully',
      });
    } else {
      return res.status(400).json({
        Success: false,
        Error: true,
        Message: 'Product fetching from cart failed',
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

userRoutes.post('/place-order-prod/:login_id', async (req, res) => {
  try {
    // Retrieve data from the cart for the specified user ID
    const dataToCopy = await cartDB.find({ login_id: req.params.login_id });

    if (dataToCopy.length === 0) {
      return res
        .status(404)
        .json({ message: 'No data found for the specified user ID' });
    }

    // Retrieve address for the specified login_id
    const userAddress = await addressDB.findOne({
      login_id: req.params.login_id,
    });

    if (!userAddress) {
      return res
        .status(404)
        .json({ message: 'No address found for the specified user ID' });
    }

    // Create orders with order status as 'pending' and add the address
    const dataWithOrderStatus = dataToCopy.map((item) => ({
      ...item.toObject(),
      order_status: 'pending',
      login_id: req.params.login_id, // Add login_id to each order
      address: userAddress.toObject(), // Add address to each order
    }));

    // Insert orders into the ordersDB collection
    await ordersDB.insertMany(dataWithOrderStatus);

    // Delete the address from the addressDB collection
    await cartDB.deleteOne({ login_id: req.params.login_id });
    await addressDB.deleteOne({ login_id: req.params.login_id });

    return res.status(200).json({ message: 'Order added successfully!' });
  } catch (error) {
    return res.status(500).json({
      Success: false,
      Error: true,
      Message: 'Internal Server Error',
      ErrorMessage: error.message,
    });
  }
});

userRoutes.post('/add-address/:login_id', async (req, res) => {
  try {
    // const exAddress = await addressData.findOne({ login_id: req.params.id });
    const exAddress = await addressDB
      .findOne({ login_id: req.params.id })
      .sort({ _id: -1 })
      .limit(1);
    const Address = {
      login_id: req.params.login_id,
      name: req.body.name,
      phone: req.body.phone,
      address: req.body.address,
      addressType: exAddress ? '' : 'primary',
      pincode: req.body.pincode,
      state: req.body.state,
      city: req.body.city,
      landmark: req.body.landmark,
    };
    const Data = await addressDB(Address).save();
    // console.log(Data);
    if (Data) {
      return res.status(201).json({
        Success: true,
        Error: false,
        // data: Data.length > 0 ? Data : [],
        data: Data,
        Message: 'Address added successfully',
      });
    } else {
      return res.status(400).json({
        Success: false,
        Error: true,
        Message: 'Failed adding Address ',
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

userRoutes.get('/view-order/:login_id', async (req, res) => {
  try {
    const login_id = req.params.login_id;
    console.log(login_id);
    const result = await ordersDB.aggregate([
      {
        $match: {
          login_id: new mongoose.Types.ObjectId(login_id),
        },
      },
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

userRoutes.post('/add-complaint/:login_id', async (req, res) => {
  try {
    const Complaint = {
      login_id: req.params.login_id,
      complaint: req.body.complaint,
      date:req.body.date
    };
    const Data = await complaintsDB(Complaint).save();
    // console.log(Data);
    if (Data) {
      return res.status(201).json({
        Success: true,
        Error: false,
        data: Data,
        Message: 'Complaint added successfully',
      });
    } else {
      return res.status(400).json({
        Success: false,
        Error: true,
        Message: 'Failed adding Complaint ',
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

userRoutes.get('/view-complaint/:login_id', async (req, res) => {
  try {
    const Data = await complaintsDB.find({ login_id: req.params.login_id });
    if (Data) {
      return res.status(201).json({
        Success: true,
        Error: false,
        data: Data,
        Message: 'Complaint fetched successfully',
      });
    } else {
      return res.status(400).json({
        Success: false,
        Error: true,
        Message: 'Failed fetching Complaint ',
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

userRoutes.post('/doctor-booking/:login_id/:doc_id', async (req, res) => {
  try {
    const login_id = req.params.login_id;
    const doctorId = req.params.doc_id;
    const oldBooking = await docBookDB.findOne({
      login_id: login_id,
      doctor_id: doctorId,
      date: req.body.date,
    });
    if (oldBooking) {
      return res.status(400).json({
        Success: false,
        Error: true,
        Message: 'You have already booked this doctor',
      });
    } else {
      const bookingData = {
        login_id: login_id,
        doctor_id: doctorId,
        date: req.body.date,
      };
      const Data = await docBookDB(bookingData).save();
      if (Data) {
        return res.status(200).json({
          Success: true,
          Error: false,
          data: Data,
          Message: 'Doctor booked successfully',
        });
      } else {
        return res.status(400).json({
          Success: false,
          Error: true,
          Message: 'Doctor booking failed',
        });
      }
    }
  } catch (error) {
    return res.status(500).json({
      Success: false,
      Error: true,
      Message: 'Internal Server error',
      ErrorMessage: error.message,
    });
  }
});

userRoutes.get('/view-doc-booking/:login_id', async (req, res) => {
  try {
    const user_id = req.params.login_id;

    const bookData = await docBookDB.aggregate([
      {
        $lookup: {
          from: 'doctor_tbs',
          localField: 'doctor_id',
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
          name: {
            $first: '$result.name',
          },
          phone: {
            $first: '$result.phone',
          },
          place: {
            $first: '$result.place',
          },
          date: {
            $first: '$date',
          },
        },
      },
      {
        $match: {
          login_id: new mongoose.Types.ObjectId(user_id),
        },
      },
    ]);

    console.log(bookData);
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

userRoutes.post('/service-booking/:login_id', async (req, res) => {
  try {
    const login_id = req.params.login_id;
    const oldBooking = await serviceBookDB.findOne({
      login_id: login_id,
      date: req.body.date,
      complaint: req.body.complaint,
    });
    if (oldBooking) {
      return res.status(400).json({
        Success: false,
        Error: true,
        Message: 'You have already booked this doctor',
      });
    } else {
      const bookingData = {
        login_id: login_id,
        date: req.body.date,
        complaint: req.body.complaint,
      };
      const Data = await serviceBookDB(bookingData).save();
      if (Data) {
        return res.status(200).json({
          Success: true,
          Error: false,
          data: Data,
          Message: 'Doctor booked successfully',
        });
      } else {
        return res.status(400).json({
          Success: false,
          Error: true,
          Message: 'Doctor booking failed',
        });
      }
    }
  } catch (error) {
    return res.status(500).json({
      Success: false,
      Error: true,
      Message: 'Internal Server error',
      ErrorMessage: error.message,
    });
  }
});

userRoutes.get('/view-service-booking/:login_id', async (req, res) => {
  try {
    const user_id = req.params.login_id;

    const bookData = await serviceBookDB.find({ login_id: user_id });

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

userRoutes.post('/add-feedback/:login_id', async (req, res) => {
  try {
    const Complaint = {
      login_id: req.params.login_id,
      feedback: req.body.feedback,
    };
    const Data = await feedbacksDB(Complaint).save();
    // console.log(Data);
    if (Data) {
      return res.status(201).json({
        Success: true,
        Error: false,
        data: Data,
        Message: 'Complaint added successfully',
      });
    } else {
      return res.status(400).json({
        Success: false,
        Error: true,
        Message: 'Failed adding Complaint ',
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

userRoutes.get('/view-feedback/:login_id', async (req, res) => {
  try {
    const Data = await feedbacksDB.find({ login_id: req.params.login_id });
    if (Data) {
      return res.status(201).json({
        Success: true,
        Error: false,
        data: Data,
        Message: 'Feedback fetched successfully',
      });
    } else {
      return res.status(400).json({
        Success: false,
        Error: true,
        Message: 'Failed fetching Feedback ',
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

module.exports = userRoutes;
