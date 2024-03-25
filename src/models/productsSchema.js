const mongoose = require('mongoose');
const productsSchema = new mongoose.Schema({
  brand: { type: String, required: true },
  model: { type: String, required: true }, //polarized, UV protection, mirrored in lens
  color: { type: String, required: true },
  material: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
});

var lensDB = mongoose.model('products_tb', productsSchema);
module.exports = lensDB;

