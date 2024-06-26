const express = require('express');
const doctorDB = require('../models/doctorSchema');
const RegisterDB = require('../models/registerSchema');
const { default: mongoose } = require('mongoose');
const staffDB = require('../models/staffSchema');
const productsDB = require('../models/productsSchema');
const commonRoutes = express.Router();

commonRoutes.get('/view-prod', async (req, res) => {
  try {
    const Data = await productsDB.find();
    if (Data) {
      return res.status(200).json({
        Success: true,
        Error: false,
        data: Data,
        Message: 'Products fetched successfully',
      });
    } else {
      return res.status(400).json({
        Success: false,
        Error: true,
        Message: 'Failed getting Products ',
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
commonRoutes.get('/view-prod/lens', async (req, res) => {
  try {
    const Data = await productsDB.find({ type: 'lens' });
    if (Data) {
      return res.status(200).json({
        Success: true,
        Error: false,
        data: Data,
        Message: 'Products fetched successfully',
      });
    } else {
      return res.status(400).json({
        Success: false,
        Error: true,
        Message: 'Failed getting Products ',
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
commonRoutes.get('/view-prod/frame', async (req, res) => {
  try {
    const Data = await productsDB.find({ type: 'frame' });
    if (Data) {
      return res.status(200).json({
        Success: true,
        Error: false,
        data: Data,
        Message: 'Products fetched successfully',
      });
    } else {
      return res.status(400).json({
        Success: false,
        Error: true,
        Message: 'Failed getting Products ',
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
commonRoutes.get('/view-prod/sunglass', async (req, res) => {
  try {
    const Data = await productsDB.find({ type: 'sunglass' });
    if (Data) {
      return res.status(200).json({
        Success: true,
        Error: false,
        data: Data,
        Message: 'Products fetched successfully',
      });
    } else {
      return res.status(400).json({
        Success: false,
        Error: true,
        Message: 'Failed getting Products ',
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

commonRoutes.get('/view-doctors', async (req, res) => {
  try {
    const doctorData = await doctorDB.aggregate([
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

          email: {
            $first: '$result.email',
          },
          // rawpassword: {
          //   $first: '$result.rawpassword',
          // },
        },
      },
    ]);

    if (doctorData.length > 0) {
      return res.json({
        Success: true,
        Error: false,
        data: doctorData,
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

commonRoutes.get('/profile/staff/:id', async (req, res) => {
  //   console.log(req.params.id);
  try {
    const id = req.params.id;

    // Check if the provided ID is a valid ObjectId
    // if (!mongoose.Types.ObjectId.isValid(id)) {
    //   return res.status(400).json({
    //     Success: false,
    //     Error: true,
    //     Message: 'Invalid ID format',
    //   });
    // }

    const profileData = await staffDB.aggregate([
      {
        $lookup: {
          from: 'login_tbs',
          localField: 'login_id',
          foreignField: '_id',
          as: 'results',
        },
      },
      {
        $unwind: '$results',
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
          // designation: {
          //   $first: '$designation',
          // },
          email: {
            $first: '$results.email',
          },
          rawpassword: {
            $first: '$results.rawpassword',
          },
          attendance: {
            $first: '$attendance',
          },
        },
      },

      {
        $match: {
          login_id: new mongoose.Types.ObjectId(id),
        },
      },
    ]);
    console.log('Profile', profileData);
    if (profileData.length > 0) {
      return res.json({
        Success: true,
        Error: false,
        data: profileData,
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
    console.log(error);
    return res.status(500).json({
      Success: false,
      Error: true,
      Message: 'Internal Server Error',
    });
  }
});

commonRoutes.get('/profile/doctor/:id', async (req, res) => {
  //   console.log(req.params.id);
  try {
    const id = req.params.id;

    // Check if the provided ID is a valid ObjectId
    // if (!mongoose.Types.ObjectId.isValid(id)) {
    //   return res.status(400).json({
    //     Success: false,
    //     Error: true,
    //     Message: 'Invalid ID format',
    //   });
    // }

    const profileData = await doctorDB.aggregate([
      {
        $lookup: {
          from: 'login_tbs',
          localField: 'login_id',
          foreignField: '_id',
          as: 'results',
        },
      },
      {
        $unwind: '$results',
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
            $first: '$results.email',
          },
          rawpassword: {
            $first: '$results.rawpassword',
          },
          attendance: {
            $first: '$attendance',
          },
        },
      },

      {
        $match: {
          login_id: new mongoose.Types.ObjectId(id),
        },
      },
    ]);
    console.log('Profile', profileData);
    if (profileData.length > 0) {
      return res.json({
        Success: true,
        Error: false,
        data: profileData,
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
    console.log(error);
    return res.status(500).json({
      Success: false,
      Error: true,
      Message: 'Internal Server Error',
    });
  }
});

commonRoutes.get('/profile/user/:id', async (req, res) => {
  //   console.log(req.params.id);
  try {
    const id = req.params.id;

    // Check if the provided ID is a valid ObjectId
    // if (!mongoose.Types.ObjectId.isValid(id)) {
    //   return res.status(400).json({
    //     Success: false,
    //     Error: true,
    //     Message: 'Invalid ID format',
    //   });
    // }

    const profileData = await RegisterDB.aggregate([
      {
        $lookup: {
          from: 'login_tbs',
          localField: 'login_id',
          foreignField: '_id',
          as: 'results',
        },
      },
      {
        $unwind: '$results',
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
            $first: '$results.email',
          },
          rawpassword: {
            $first: '$results.rawpassword',
          },
          attendance: {
            $first: '$attendance',
          },
        },
      },

      {
        $match: {
          login_id: new mongoose.Types.ObjectId(id),
        },
      },
    ]);
    console.log('Profile', profileData);
    if (profileData.length > 0) {
      return res.json({
        Success: true,
        Error: false,
        data: profileData,
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
    console.log(error);
    return res.status(500).json({
      Success: false,
      Error: true,
      Message: 'Internal Server Error',
    });
  }
});

module.exports = commonRoutes;
