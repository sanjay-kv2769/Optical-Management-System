const express = require('express');
const medicineDB = require('../models/productsSchema');
const ordersDB = require('../models/ordersSchema');
const { default: mongoose } = require('mongoose');
const complaintsDB = require('../models/complaintSchema');
const userRoutes = express.Router();

userRoutes.post('/add-cart/:login_id/:prod_id', async (req, res) => {
  try {
    const login_id = req.params.user_id;
    const productId = req.params.prod_id;

    const existingProduct = await cartData.findOne({
      product_id: productId,
      login_id: login_id,
    });
    if (existingProduct) {
      const quantity = existingProduct.quantity;
      const updatedQuantity = quantity + 1;

      const updatedData = await cartData.updateOne(
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
      const Data = await cartData(cartDatas).save();
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

userRoutes.post('/order-prod/:login_id/:prod_id', async (req, res) => {
  try {
    const loginId = req.params.login_id;
    const productId = req.params.prod_id;
    const Medicine = {
      login_id: loginId,
      product_id: productId,
      unit: req.body.unit,
    };
    const Data = await ordersDB(Medicine).save();
    if (Data) {
      return res.status(201).json({
        Success: true,
        Error: false,
        data: Data,
        Message: 'Order successful',
      });
    } else {
      return res.status(400).json({
        Success: false,
        Error: true,
        Message: 'Order Failed',
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
          from: 'medicine_tbs',
          localField: 'medicine_id',
          foreignField: '_id',
          as: 'medicine_data',
        },
      },
      {
        $unwind: '$medicine_data',
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

module.exports = userRoutes;
