const express = require('express')
const fetchuser = require('../middleware/fetchuser')
const router = express.Router()
const Product = require('../models/Product')
const userRoleCheck = require('../middleware/userRoleCheck')
const multer = require('multer');
const upload = multer({});
const v2 = require("../cloudinary");
const Orders = require('../models/Orders')
const Category = require('../models/Category')
const User = require('../models/User')


router.get("/stats", fetchuser, userRoleCheck, async (req, res) => {
  const totalOrders = await Orders.count()
  const dropshippers = await User.count({ isAdmin: false, role: 'dropshipper' })
  const wholesellers = await User.count({ isAdmin: false, role: 'wholeseller' })
  const pendingOrders = await Orders.count({ orderStatus: 'Pending' })
  const deliveredOrders = await Orders.count({ orderStatus: 'Delivered' })
  const returnedOrders = await Orders.count({ orderStatus: 'Returned' })
  const totalProducts = await Product.count()
  const OutOfStockProducts = await Product.count({ stock: { $lte: 0 } })
  const InStockProducts = await Product.count({ stock: { $gte: 1 } })
  const categories = await Category.count();
  res.status(200).json({ totalOrders, pendingOrders, deliveredOrders, returnedOrders, totalProducts, OutOfStockProducts, InStockProducts, categories, dropshippers, wholesellers })
})



router.post('/addproduct', fetchuser, userRoleCheck, upload.single('file'), async (req, res) => {
  try {
    const { category, skuNumber, title, stock, wholesalePrice, dropshipperPrice, discountedPriceW, discountedPriceD, purchasePrice, weight, featured, onSale, photo, description } = req.body;

    const result = await v2.uploader.upload(photo, { folder: 'mios-products', crop: "scale" });
    const { public_id, url } = result;
    if (!public_id) {
      return res.status(400).send("Server Error");
    }

    const product = await Product.create({ category, skuNumber, title, stock, wholesalePrice, dropshipperPrice, discountedPriceW, discountedPriceD, purchasePrice, weight, featured, onSale, photo: { public_id, url }, description })
    res.status(201).send({ message: 'Product added successfully' })
  } catch (error) {
    res.status(500).send(error)
  }
})

// get Featured Products 
router.get('/featured', fetchuser, async (req, res) => {
  try {
    const featuredProducts = await Product.find({ featured: true })
    res.json({ featuredProducts })
  } catch (error) {
    res.status(500).send(error.message)
  }
})


// in stock products
router.get('/instock', fetchuser, async (req, res) => {
  try {
    const products = await Product.find({ stock: { $gt: 0 } })
    res.json({ products })
  } catch (error) {
    res.status(500).send(error.message)
  }
}
)


// out of stock products
router.get('/outofstock', fetchuser, async (req, res) => {
  try {
    const products = await Product.find({ stock: { $lt: 1 } })
    res.json({ products })
  } catch (error) {
    res.status(500).send(error.message)
  }
}
)


// get all on sale products 
router.get('/onsale', fetchuser, async (req, res) => {
  try {
    let onSaleProducts = new Array();
    if (req.user.role === "wholeseller") {
      onSaleProducts = await Product.find({ discountedPriceW: { $gt: 0 } })
    } else if (req.user.role === "dropshipper") {
      onSaleProducts = await Product.find({ discountedPriceD: { $gt: 0 } })
    }
    res.json({ onSaleProducts })
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.get('/allonsale', fetchuser, async (req, res) => {
  try {
    let onSaleProducts = new Array();
    onSaleProducts = await Product.find({
      $or: [
        { discountedPriceW: { $gt: 0 } },
        { discountedPriceD: { $gt: 0 } }
      ]
    })

    res.json({ onSaleProducts })
  } catch (error) {
    res.status(500).send(error.message)
  }
})


// Fetch all USER SPECIFIC Products from the database  : GET "/api/notes/userproducts", Require a auth token
router.get('/userproducts', fetchuser, userRoleCheck, async (req, res) => {
  try {
    const products = await Product.find({ user: req.user._id });
    res.json({ products })
  } catch (error) {
    res.status(500).send(error.message)
  }
})


// Fetch all Products from the database  : GET "/api//products"
router.get('/allproducts', async (req, res) => {
  try {
    const products = await Product.find({ deActivated: false }).populate({ path: 'category', select: ['name'] });
    res.json({ products })
  } catch (error) {
    res.status(500).send(error.message)
  }
})

// New Api Made
router.get('/allactiveproducts', async (req, res) => {
  try {
    const products = await Product.find().populate({ path: 'category', select: ['name'] });
    res.json({ products })
  } catch (error) {
    res.status(500).send(error.message)
  }
})

// New Edit Api
router.put('/changeActivation/:id', async (req, res) => {
  try {
    const product = await Product.findById({ _id: req.params.id });
    if (product.deActivated === false) {
      product.deActivated = true;
    } else {
      product.deActivated = false;
    }
    await product.save();
    res.json(product)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

// Edit Product using : PUT "/api/products/editproduct/:id", Requires a auth token
router.put('/editproduct/:id', fetchuser, async (req, res) => {
  try {
    const { category, skuNumber, title, stock, wholesalePrice, dropshipperPrice, discountedPriceW, discountedPriceD, purchasePrice, weight, featured, onSale, photo, description } = req.body;
    const data = await Product.findById({ _id: req.params.id })
    if (!(photo?.url)) {
      await v2.uploader.destroy(data?.photo?.public_id, async function (error, result) {
        if (result?.result === 'ok') {
          const result = await v2.uploader.upload(photo, { folder: 'mios-products', crop: "scale" });
          const { public_id, url } = result;
          if (!public_id) {
            return res.status(400).send("Server Error");
          }
          const product = await Product.findByIdAndUpdate({ _id: req.params.id }, { category, skuNumber, title, stock, wholesalePrice, dropshipperPrice, discountedPriceW, discountedPriceD, purchasePrice, weight, featured, onSale, photo: { public_id, url }, description })
          res.status(201).send({ message: 'Product updated successfully' })

        } else {
          res.status(400).send('Image Not Found');
        }
      });
    } else {
      const product = await Product.findByIdAndUpdate({ _id: req.params.id }, { category, skuNumber, title, stock, wholesalePrice, dropshipperPrice, discountedPriceW, discountedPriceD, purchasePrice, weight, featured, onSale, description })
      res.status(201).send({ message: 'Product updated successfully' })
    }
  } catch (error) {
    res.status(500).send(error)
  }

}
)


// Delete Product using : DELETE "/api/products/deleteproduct/:id", Requires a auth token
router.delete('/deleteproduct/:id', fetchuser, async (req, res) => {
  try {
    const _id = req.params.id;
    const data = await Product.findById({ _id });
    if (!data) {
      res.send("Product Not Found");
    }

    if (data?.photo?.public_id === undefined || data?.photo?.public_id === "no id") {
      await Product.findByIdAndDelete({ _id: req.params.id })
      res.send('Product removed');
    }

    await v2.uploader.destroy(data?.photo?.public_id, async function (error, result) {
      if (result?.result === 'ok') {
        await Product.findByIdAndDelete({ _id: req.params.id })
        res.send('Product removed');
      } else {
        res.status(400).send('Image Not Found');
      }
    });

  } catch (error) {
    res.status(500).send(error.message)
  }
}
)


// get products by category 
router.get('/categoryProducts/:id', async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.id }).populate({ path: 'category', select: ['name'] })
    res.json({ products })
  } catch (error) {
    res.status(500).send(error.message)
  }
}
)

// get products by id
router.get('/product/:id', async (req, res) => {
  try {
    const product = await Product.find({ _id: req.params.id })
    res.json(product[0])
  } catch (error) {
    res.status(500).send(error.message)
  }
}
)
router.get('/catCount', async (req, res) => {
  try {
    const count = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      }
    ])

    const result = count.reduce((obj, item) => {
      obj[item._id] = item.count;
      return obj;
    }, {});
    res.json({ count: result });
  } catch (error) {
    res.send(error);
  }
})


router.post('/importproduct', fetchuser, userRoleCheck, async (req, res) => {

  try {
    let products = await req.body;
    products = products.map(async (product) => {
      let category = '';
      const findCategory = await Category.findOne({ name: product.category });
      if (findCategory) {
        category = findCategory._id;
      } else {
        const newCategory = new Category({
          user: req.user.id,
          name: product.category
        })
        await newCategory.save();
        category = newCategory._id;
      }

      let featured = product.featured === 'yes' ? true : false;
      let onSale = product.onSale === 'yes' ? true : false;
      return {
        title: product.title,
        description: product.description,
        skuNumber: product.skuNumber,
        category: category,
        stock: product.stock,
        wholesalePrice: product.wholesalePrice,
        dropshipperPrice: product.dropshipperPrice,
        discountedPriceW: product.discountedPriceW,
        discountedPriceD: product.discountedPriceD,
        weight: product.weight,
        featured: featured,
        onSale: onSale,
        photo: {
          public_id: "no id",
          url: product.photo
        }
      }
    })
    products = await Promise.all(products);
    const result = await Product.insertMany(products);
    res.status(201).send({ message: 'Products imported successfully', result })
  } catch (error) {
    res.status(500).send(error)
  }
})



module.exports = router