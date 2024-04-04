const express = require('express');
const staffDB = require('../models/staffSchema');
const loginDB = require('../models/loginSchema');
const bcrypt = require('bcryptjs');
const { default: mongoose } = require('mongoose');
const complaintsDB = require('../models/complaintSchema');
const adminRoutes = express.Router();
adminRoutes.use(express.static('./public'));
require('dotenv').config();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const productsDB = require('../models/productsSchema');
const feedbacksDB = require('../models/feedbackSchema');

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

adminRoutes.post('/login', async (req, res, next) => {
  try {
    console.log(req.body.email, req.body.password);
    if (req.body.email && req.body.password) {
      const oldUser = await loginDB.findOne({
        email: req.body.email,
      });
      if (!oldUser) {
        return res.render('login.ejs', { Message: 'Email Incorrect' });
      }
      const isPasswordCorrect = await bcrypt.compare(
        req.body.password,
        oldUser.password
      );
      console.log(isPasswordCorrect);
      if (!isPasswordCorrect) {
        return res.render('login.ejs', { Message: 'Password Incorrect' });
      }
      return res.redirect('/api/admin/');
    } else {
      return res.render('login.ejs', { Message: 'All field are required' });
    }
  } catch (error) {
    return res.render('login.ejs', { Message: 'Something went wrong' });
  }
});

// ------------------------------Product--------------------------------------

adminRoutes.get('/', async (req, res) => {
  try {
    const staffCount = await staffDB.countDocuments();
    const productCount = await productsDB.countDocuments();
    const reviewCount = await feedbacksDB.countDocuments();
    const complaintCount = await complaintsDB.countDocuments();

    res.render('dashboard', {
      staffCount,
      productCount,
      reviewCount,
      complaintCount,
    });
    // Send the counts as a response
    //  res.json({ staffCount, medicineCount, reviewCount, complaintCount });
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

adminRoutes.get('/add-product', async (req, res) => {
  const data = {};
  res.render('add-product', { data });
});

adminRoutes.post('/add-prod', upload.single('image'), async (req, res) => {
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
      const data = {
        Success: true,
        Error: false,
        Message: 'Product added successfully',
      };
      // return res.status(201).json({
      //   Success: true,
      //   Error: false,
      //   data: Data,
      //   Message: 'Product added successfully',
      return res.render('add-product', { data });
      // });
    } else {
      // return res.status(400).json({
      //   Success: false,
      //   Error: true,
      //   Message: 'Failed adding Product ',
      // });
      const data = {
        Success: false,
        Error: true,
        Message: 'Failed adding product ',
      };
      return res.render('add-product', { data });
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

adminRoutes.get('/view-prod', async (req, res) => {
  try {
    const Data = await productsDB.find();

    if (Data) {
      const data = {};
      return res.render('view-products', { Data, data });
    }

    // if (Data) {
    //   return res.status(200).json({
    //     Success: true,
    //     Error: false,
    //     data: Data,
    //     Message: 'Products fetched successfully',
    //   });
    // } else {
    //   return res.status(400).json({
    //     Success: false,
    //     Error: true,
    //     Message: 'Failed getting Products ',
    //   });
    // }
  } catch (error) {
    const data = {
      Message: ' Error',
    };
    const Data = [];
    return res.render('view-products', { Data, data });

    // return res.status(500).json({
    //   Success: false,
    //   Error: true,
    //   Message: 'Internal Server Error',
    //   ErrorMessage: error.message,
    // });
  }
});
adminRoutes.get('/edit-prod/:id', async (req, res) => {
  try {
    const Data = await productsDB.findOne({ _id: req.params.id });

    if (Data) {
      const data = {};

      res.render('edit-product', { Data, data });
    }
  } catch (error) {
    const data = {
      Message: 'Error',
    };
    const Data = [];
    return res.render('view-products', { Data, data });
  }
});

adminRoutes.post(
  '/update-prod/:id',
  upload.single('image'),
  async (req, res) => {
    try {
      const previousData = await productsDB.findOne({ _id: req.params.id });

      var Products = {
        brand: req.body ? req.body.brand : previousData.brand,
        type: req.body ? req.body.type : previousData.type,
        model: req.body ? req.body.model : previousData.model,
        color: req.body ? req.body.color : previousData.color,
        material: req.body ? req.body.material : previousData.material,
        price: req.body ? req.body.price : previousData.price,
        description: req.body ? req.body.description : previousData.description,
        image: req.file ? req.file.path : previousData.image,
      };
      console.log(Products);
      const Data = await productsDB.updateOne(
        { _id: req.params.id },
        { $set: Products }
      );

      // if (Data) {
      // return res.status(200).json({
      //   Success: true,
      //   Error: false,
      //   data: Data,
      //   Message: 'Product updated successfully',
      // });
      // }
      if (Data.modifiedCount == 1) {
        // const Data = await loginData.deleteOne({ _id: id });
        return res.redirect('/api/admin/view-prod');
      } else {
        // return res.status(400).json({
        //   Success: false,
        //   Error: true,
        //   Message: 'Failed while updating Product',
        // });
        return res.redirect('/api/admin/view-prod');
      }
    } catch (error) {
      return res.status(500).json({
        Success: false,
        Error: true,
        Message: 'Internal Server Error',
        ErrorMessage: error.message,
      });
    }
  }
);

adminRoutes.get('/delete-prod/:id', async (req, res) => {
  try {
    const Data = await productsDB.deleteOne({ _id: req.params.id });
    // if (Data) {
    //   return res.status(200).json({
    //     Success: true,
    //     Error: false,
    //     data: Data,
    //     Message: 'Product deleted successfully',
    //   });
    // } else {
    //   return res.status(400).json({
    //     Success: false,
    //     Error: true,
    //     Message: 'Failed to delete product',
    //   });
    // }
    if (Data.deletedCount == 1) {
      // const Data = await loginData.deleteOne({ _id: id });
      return res.redirect('/api/admin/view-prod');
    } else {
      return res.redirect('/api/admin/view-prod');
    }
  } catch (error) {
    return res.redirect('/api/admin/view-prod');

    // return res.status(500).json({
    //   Success: false,
    //   Error: true,
    //   Message: 'Internal Server Error',
    //   ErrorMessage: error.message,
    // });
  }
});

// ------------------------------Staff--------------------------------------

adminRoutes.get('/new-staff', async (req, res) => {
  const data = {};
  res.render('add-staff', { data });
});

//Staff Registration
adminRoutes.post('/staff', async (req, res) => {
  console.log(req.body);
  try {
    console.log(req.body);
    const oldStaff = await loginDB.findOne({ email: req.body.email });
    if (oldStaff) {
      // return res.status(400).json({
      //   Success: false,
      //   Error: true,
      //   Message: 'Email already exist, Please Log In',
      // });
      const data = {
        Success: false,
        Error: true,
        Message: 'Email already exist',
      };
      return res.render('add-staff', { data });
    }
    const oldStaffPhone = await staffDB.findOne({ phone: req.body.phone });
    if (oldStaffPhone) {
      // return res.status(400).json({
      //   Success: false,
      //   Error: true,
      //   Message: 'Phone already exist',
      // });

      const data = {
        Success: false,
        Error: true,
        Message: 'Phone already exist',
      };
      return res.render('add-staff', { data });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 12);
    let log = {
      email: req.body.email,
      password: hashedPassword,
      rawpassword: req.body.password,
      role: 3,
    };
    const result3 = await loginDB(log).save();
    let reg = {
      login_id: result3._id,
      name: req.body.name,
      phone: req.body.phone,
      place: req.body.place,
      // designation: req.body.designation,
    };
    const result4 = await staffDB(reg).save();

    if (result4) {
      // return res.json({
      //   Success: true,
      //   Error: false,
      //   logdata: result3,
      //   regdata: result4,
      //   Message: 'Staff Registration Successful',
      // });
      const data = {
        Success: true,
        Error: false,
        Message: 'Staff added successfully',
      };
      return res.render('add-staff', { data });
    } else {
      // return res.json({
      //   Success: false,
      //   Error: true,
      //   Message: 'Registration Failed',
      // });
      const data = {
        Success: false,
        Error: true,
        Message: 'Failed adding staff ',
      };
      return res.render('add-staff', { data });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      Success: false,
      Error: true,
      Message: 'Internal Server Error',
    });
  }
});

adminRoutes.get('/view-staff', async (req, res) => {
  try {
    // const staffData = await staffDB.aggregate([
    const Data = await staffDB.aggregate([
      {
        $lookup: {
          from: 'login_tbs',
          localField: 'login_id',
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
          name: {
            $first: '$name',
          },
          phone: {
            $first: '$phone',
          },
          place: {
            $first: '$place',
          },
          designation: {
            $first: '$designation',
          },
          email: {
            $first: '$result.email',
          },
          rawpassword: {
            $first: '$result.rawpassword',
          },
        },
      },
    ]);

    // if (staffData.length > 0) {
    if (Data.length > 0) {
      // return res.json({
      //   Success: true,
      //   Error: false,
      //   data: staffData,
      //   Message: 'Success',
      // });
      const data = {};
      return res.render('view-staff', { Data, data });
    } else {
      // return res.json({
      //   Success: false,
      //   Error: true,
      //   Message: 'Failed',
      // });
      const data = {
        Message: ' Error',
      };
      const Data = [];
      return res.render('view-staff', { Data, data });
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

adminRoutes.get('/view-staff/:id', async (req, res) => {
  try {
    const user_id = req.params.id;
    const staffData = await staffDB.aggregate([
      {
        $lookup: {
          from: 'login_tbs',
          localField: 'login_id',
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
          name: {
            $first: '$name',
          },
          phone: {
            $first: '$phone',
          },
          place: {
            $first: '$place',
          },
          designation: {
            $first: '$designation',
          },
          email: {
            $first: '$result.email',
          },
          rawpassword: {
            $first: '$result.rawpassword',
          },
        },
      },
      {
        $match: {
          login_id: new mongoose.Types.ObjectId(user_id),
        },
      },
    ]);

    if (staffData.length > 0) {
      return res.json({
        Success: true,
        Error: false,
        data: staffData,
        Message: 'Success',
      });
    } else {
      return res.json({
        Success: false,
        Error: true,
        Message: 'Failed',
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

adminRoutes.get('/edit-staff/:id', async (req, res) => {
  try {
    const Data = await staffDB.findOne({ login_id: req.params.id });
    var logData = await loginDB.findOne({ _id: req.params.id });
    console.log(logData);
    if (Data) {
      const data = {};

      res.render('edit-staff', { Data, logData, data });
    }
  } catch (error) {
    const data = {
      Message: 'Error',
    };
    const Data = [];
    return res.render('view-staff', { Data, logData, data });
  }
});

adminRoutes.get('/update-staff/:id', async (req, res) => {
  console.log('email', req.query.email);
  try {
    var loginID = req.params.id;
    const previousData = await staffDB.findOne({
      login_id: loginID,
    });
    const previousloginData = await loginDB.findOne({
      _id: loginID,
    });
    var Staff = {
      login_id: previousData.login_id,
      name: req.query.name ? req.query.name : previousData.name,
      phone: req.query.phone ? req.query.phone : previousData.phone,
      place: req.query.place ? req.query.place : previousData.place,
      //  image:
      //    req.file && req.file.length > 0
      //      ? req.file.path)
      //      : previousData.image,
    };
    if (req.query.password !== undefined) {
      var hashedPassword = await bcrypt.hash(req.query.password, 10);
    }
    var StaffLoginDetails = {
      email: req.query.email ? req.query.email : previousloginData.email,
      password: req.query.password
        ? hashedPassword
        : previousloginData.password,
      rawpassword: req.query.password
        ? req.query.password
        : previousloginData.rawpassword,
    };

    const Data = await staffDB.updateOne(
      { login_id: loginID },
      { $set: Staff }
    );
    const LoginData = await loginDB.updateOne(
      { _id: loginID },
      { $set: StaffLoginDetails }
    );
    if (Data && LoginData) {
      // const Data = await loginData.deleteOne({ _id: id });
      console.log('Data', Data);
      console.log('LoginData', LoginData);
      return res.redirect('/api/admin/view-staff');
    } else {
      // return res.status(400).json({
      //   Success: false,
      //   Error: true,
      //   Message: 'Failed while updating Product',
      // });
      return res.redirect('/api/admin/view-staff');
    }
    // if (Data && LoginData) {
    //   return res.status(200).json({
    //     Success: true,
    //     Error: false,
    //     data: Data,
    //     loginData: LoginData,
    //     Message: 'Staff details updated successfully ',
    //   });
    // } else {
    //   return res.status(400).json({
    //     Success: false,
    //     Error: true,
    //     Message: 'Failed while updating Staff details',
    //   });
    // }
  } catch (error) {
    return res.status(500).json({
      Success: false,
      Error: true,
      Message: 'Internal Server Error',
      ErrorMessage: error.message,
    });
  }
});

adminRoutes.get('/delete-staff/:login_id', async (req, res) => {
  try {
    // const staffData = await staffDB.deleteOne({
    const Data = await staffDB.deleteOne({
      login_id: req.params.login_id,
    });
    const logData = await loginDB.deleteOne({ _id: req.params.login_id });
    // if (staffData && logData) {
    //   return res.status(200).json({
    //     Success: true,
    //     Error: false,
    //     Message: 'Deleted staff data',
    //   });
    // }
    if (Data.deletedCount == 1 && logData.deletedCount == 1) {
      return res.redirect('/api/admin/view-staff');
    } else {
      return res.redirect('/api/admin/view-staff');
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

adminRoutes.get('/view-complaints', async (req, res) => {
  try {
    const Data = await complaintsDB.aggregate([
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
      {
        $lookup: {
          from: 'register_tbs',
          localField: 'login_id',
          foreignField: 'login_id',
          as: 'register_data',
        },
      },
      {
        $unwind: '$register_data',
      },
    ]);
    if (Data) {
      // return res.status(201).json({
      //   Success: true,
      //   Error: false,
      //   data: Data,
      //   Message: 'Complaint fetched successfully',
      // });
      const data = {};
      return res.render('view-complaints', { Data, data });
    } else {
      // return res.status(400).json({
      //   Success: false,
      //   Error: true,
      //   Message: 'Failed fetching Complaint ',
      // });
      const data = {
        Message: ' Error',
      };
      const Data = [];
      return res.render('view-complaints', { Data, data });
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

adminRoutes.get('/reply-complaint/:id/:date', async (req, res) => {
  try {
    console.log(req.query.reply);
    var loginID = req.params.id;
    var date = req.params.date;

    const Data = await complaintsDB.updateOne(
      { login_id: loginID, date: date },
      { $set: { reply: req.query.reply } }
    );

    if (Data) {
      console.log('Data', Data);
      return res.redirect('/api/admin/view-complaints');
    } else {
      // return res.status(400).json({
      //   Success: false,
      //   Error: true,
      //   Message: 'Failed while updating complaint',
      // });
      return res.redirect('/api/admin/view-complaints');
    }
    // if (Data && LoginData) {
    //   return res.status(200).json({
    //     Success: true,
    //     Error: false,
    //     data: Data,
    //     loginData: LoginData,
    //     Message: 'Staff details updated successfully ',
    //   });
    // } else {
    //   return res.status(400).json({
    //     Success: false,
    //     Error: true,
    //     Message: 'Failed while updating Staff details',
    //   });
    // }
  } catch (error) {
    return res.status(500).json({
      Success: false,
      Error: true,
      Message: 'Internal Server Error',
      ErrorMessage: error.message,
    });
  }
});

adminRoutes.get('/view-attendance', async (req, res) => {
  try {
    // const staffData = await staffDB.aggregate([
    const Data = await staffDB.aggregate([
      {
        $lookup: {
          from: 'login_tbs',
          localField: 'login_id',
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
          name: {
            $first: '$name',
          },
          phone: {
            $first: '$phone',
          },
          place: {
            $first: '$place',
          },
          designation: {
            $first: '$designation',
          },
          email: {
            $first: '$result.email',
          },
          rawpassword: {
            $first: '$result.rawpassword',
          },
          attendanceCount: { $first: { $size: '$attendance' } },
        },
      },
    ]);

    // if (staffData.length > 0) {
    if (Data.length > 0) {
      // return res.json({
      //   Success: true,
      //   Error: false,
      //   data: staffData,
      //   Message: 'Success',
      // });
      const data = {};
      console.log(Data);
      return res.render('attendance', { Data, data });
    } else {
      // return res.json({
      //   Success: false,
      //   Error: true,
      //   Message: 'Failed',
      // });
      const data = {
        Message: ' Error',
      };
      const Data = [];
      return res.render('attendance', { Data, data });
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

adminRoutes.get('/view-attendance/:login_id', async (req, res) => {
  try {
    const loginId = req.params.login_id;
    const Data = await staffDB.findOne({ login_id: loginId });
    console.log(Data.name);
    if (Data) {
      const data = {};
      res.render('staff-attendance', { Data, data });
      // return res.status(404).json({ message: 'Staff not found' });
    } else {
      const data = {
        Message: ' Error',
      };
      const Data = [];
      return res.render('staff-attendance', { Data, data });
    }
    // res.json({ attendance: staff.attendance });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      Success: false,
      Error: true,
      Message: 'Internal Server Error',
      ErrorMessage: error.message,
    });
  }
});

module.exports = adminRoutes;
