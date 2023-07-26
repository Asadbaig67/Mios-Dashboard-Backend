const { Router } = require('express')
const express = require('express')
const fetchuser = require('../middleware/fetchuser')
const OrderDetails = require('../models/OrderDetails')
const router = express.Router()
const Order = require('../models/Orders')
const ShippingDetails = require('../models/ShippingDetails')

// calculate dropshippers profit
router.get('/dropshippending', async (req, res) => {
    try {
        const orders = await OrderDetails.find({profitStatus: false})
        let profit = 0
        orders.forEach(order => {
            if(order.orderStatus === true){
                if(order.discountedprice === 0){
                    profit += (order.dropshipprice - order.wholesaleprice) * order.qty
                }
                else{
                    profit += (order.dropshipprice - order.discountedprice) * order.qty
                }
            }
            // add profit in orders.profit
            order.profit = profit
            order.save()
        }
        )
        res.json(orders)
    } catch (error) {
        console.error(error.message)
        res.status(500).send('Internal Server Error')
    }
})



// fetch all paid profit orders
router.get('/paidprofit', async (req, res) => {
    try {
        const orders = await OrderDetails.find({profitStatus: true})
        res.json(orders)
    } catch (error) {
        console.error(error.message)
        res.status(500).send('Internal Server Error')
    }
}
)



// change profit status to true
router.put('/profitstatus/:id', async (req, res) => {
    try {
        const order = await OrderDetails.findById(req.params.id)
        order.profitStatus = true
        const savedOrder = await order.save()
        res.json(savedOrder)
    } catch (error) {
        console.error(error.message)
        res.status(500).send('Internal Server Error')
    }
}
)


module.exports = router
