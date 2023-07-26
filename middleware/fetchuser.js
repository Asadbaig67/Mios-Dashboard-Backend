var jwt = require('jsonwebtoken');
const User = require('../models/User');
const JWT_SECRET = "secret170117862202";


const fetchuser = async (req, res, next) => {
    const { token } = await req.cookies;
    if (!token) {
        return res.status(401).json({ msg: 'Authorization Failed.' });
    }
    try {
        const data = jwt.verify(token, JWT_SECRET);
        req.user = await User.findById(data.user.id);
        next();

    } catch (err) {
        console.error(err.message);
        res.status(500).send(err.message);
    }
};

module.exports = fetchuser;