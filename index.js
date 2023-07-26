require('dotenv').config();
const functions = require("firebase-functions");

const ConnectToMongo = require('./db');
const express = require('express')
var cors = require('cors')
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
ConnectToMongo();


const app = express();
const port = 30000 || process.env.PORT;


// app.use(function (req, res, next) {
//   res.header("Access-Control-Allow-Origin", "https://miostrader.com");
//   res.header("Access-Control-Allow-Credentials", true);
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, credentials");
//   next();
// });


app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000"); // Replace with your front-end URL
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, credentials");
  next();
});


app.use(express.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
// app.use(cors({ origin: ['https://miostrader.com'], credentials: true }));
app.use(cors({ origin: ['https://http://localhost:3000'], credentials: true }));


//Avaialble Routes
app.use('/server/api/auth', require('./routes/auth'))
app.use('/server/api/product', require('./routes/products'))
app.use('/server/api/category', require('./routes/categories'))
app.use('/server/api/order', require('./routes/order'))
app.use('/server/api/shipping', require('./routes/shipping'))
app.use('/server/api/payment', require('./routes/payment'))
app.use('/server/api/profit', require('./routes/profit'))
app.use('/server/api/profitrecords', require('./routes/profitHistory'))
app.use('/server/api/cart', require('./routes/cart'))
app.use('/server/api/myshop', require('./routes/myshop'))
app.use('/server/api/bankDetails', require('./routes/bankDetails'))



// app.use(cors({ origin: ['https://miostrader.com'], credentials: true }));
app.use(cors({ origin: ['http://localhost:3000'], credentials: true }));


app.get('/', (req, res) => {
  res.send('Hello World!')
})


app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})

// exports.api = functions.https.onRequest(app)