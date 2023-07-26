const express = require('express')
const fetchuser = require('../middleware/fetchuser')
const userRoleCheck = require('../middleware/userRoleCheck')
const router = express.Router()
const Category = require('../models/Category')
const Product = require('../models/Product')
require("dotenv").config();




// Add a new category using : POST "/api/categories/addcategory", Requires a auth token
router.post('/addcategory', fetchuser, userRoleCheck, async (req, res) => {
  try {
    const { name } = req.body;
    const found = await Category.find({ name });
    if (found.length >= 1) {
      return res.status(404).json({ message: 'A Category already exists with this name.' })
    }
    const category = new Category({
      user: req.user.id,
      name
    })
    await category.save();
    res.json({ message: 'Category added successfully' })
  } catch (error) {
    console.error(error.message)
    res.status(500).send(error.message)
  }
}
)

// fetch all categories using : GET "/api/categories/allcategories", Requires a auth token
router.get('/allcategories', async (req, res) => {
  try {
    const categories = await Category.find()
    res.json({ categories })
  } catch (error) {
    console.error(error.message)
    res.status(500).send(error.message)
  }
}
)

//Find by ID
router.get('/category/:id', fetchuser, userRoleCheck, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
    if (!category) {
      return res.status(404).send('Category not found')
    }
    res.json({ category });
  } catch (error) {
    console.error(error.message)
    res.status(500).send(error.message)
  }
}
)

// Delete Product using : DELETE "/api/products/deleteproduct/:id", Requires a auth token
router.delete('/deletecategory/:id', fetchuser, userRoleCheck, async (req, res) => {
  try {
    const category = await Category.findById({ _id: req.params.id })
    if (!category) {
      return res.status(404).send('Category not found')
    }
    const products = await Product.find({ category: category._id });

    if (products.length >= 1) {
      return res.status(400).send('Products with requested Category found. Deletion Unsuccessful.');
    }

    await Category.findByIdAndDelete({ _id: req.params.id });
    res.json({ message: 'Category removed' })
  } catch (error) {
    console.error(error.message)
    res.status(500).send(error.message)
  }
}
)

// edit categories using : PUT "/api/categories/editcategory/:id", Requires a auth token
router.put('/editcategory/:id', fetchuser, userRoleCheck, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
    if (!category) {
      return res.status(404).json({ message: 'Category not found' })
    }
    const { name } = req.body;
    const found = await Category.find({ name });

    if (found.length >= 1 && found[0].id !== category.id) {
      return res.status(404).json({ message: 'A Category already exists with this name.' })
    }
    category.name = name
    category.user = req.user.id;
    const savedCategory = await category.save()
    res.json(savedCategory);
  } catch (error) {
    console.error(error.message)
    res.status(500).send(error.message)
  }
}
)



module.exports = router