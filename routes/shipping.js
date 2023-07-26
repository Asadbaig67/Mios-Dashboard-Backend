const { Router } = require('express')
const express = require('express')
const fetchuser = require('../middleware/fetchuser')
const router = express.Router()
const Shipping = require('../models/ShippingDetails')
const Shippingcalc = require('../models/ShippingCalc')
// add shipping details
router.post('/addshipping', fetchuser, async (req, res) => {
    try {
        const { name, address, city, email, phoneNo, zipCode } = req.body
        if (req.errors) {
            return res.status(400).json({ errors: req.errors })
        }

        const shipping = new Shipping({
            user: req.user.id,
            name,
            email,
            address,
            city,
            phoneNo,
            zipCode
        })
        const savedShipping = await shipping.save()
        res.json(savedShipping)
    } catch (error) {
        console.error(error.message)
        res.status(500).send(error.message)
    }
})

// shipping calculations 
router.post('/addshippingcalc', async (req, res) => {
    try {
        const { weight, incity, outcity } = req.body
        if (req.errors) {
            return res.status(400).json({ errors: req.errors })
        }

        const shippingcalc = new Shippingcalc({
            weight,
            outcity,
            incity
        })

        await shippingcalc.save()
        res.json({
            msg: "Shipping Cost Added Successfully!"
        })
    } catch (error) {
        console.error(error.message)
        res.status(500).send(error.message)
    }
}
)


// edit shipping calculations
router.put('/editshippingcalc/:id', async (req, res) => {
    try {
        const { weight, incity, outcity } = req.body
        if (req.errors) {
            return res.status(400).json({ errors: req.errors })
        }
        const shippingcalc = {
            weight,
            outcity,
            incity
        }

        await Shippingcalc.findByIdAndUpdate(req.params.id, shippingcalc)
        res.json({
            msg: "Shipping Cost Updated Successfully!"
        })
    } catch (error) {
        console.error(error.message)
        res.status(500).send(error.message)
    }

}
)


// delete shipping calculations

router.delete('/deleteshippingcalc/:id', async (req, res) => {
    try {
        const shippingcalc = await Shippingcalc.findById(req.params.id)
        await shippingcalc.remove()
        res.json({ msg: 'Shipping calculation deleted' })
    } catch (error) {
        console.error(error.message)
        res.status(500).send(error.message);
    }
}
)

// get shipping calculations
router.get('/shippingcalc', async (req, res) => {
    try {
        const shippingcalc = await Shippingcalc.find().sort({ incity: 1 });
        res.json(shippingcalc)
    } catch (error) {
        console.error(error.message)
        res.status(500).send(error.message)
    }
}
)






//fetch shipping details by id get 
router.get('/shippingdetails/:id', async (req, res) => {
    try {
        const shipping = await Shipping.findById(req.params.id)
        res.json(shipping)
    } catch (error) {
        console.error(error.message)
        res.status(500).send(error.message)
    }
})




module.exports = router