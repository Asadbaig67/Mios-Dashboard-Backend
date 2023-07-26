//Role check Pass
const userRoleCheck = (req, res, next) => {
    
    if (req.user.isAdmin === true) {
        next();
    } else {
        return res.status(403).json({ msg: 'You as a user cannot access this page.' });
    }

};


module.exports = userRoleCheck;