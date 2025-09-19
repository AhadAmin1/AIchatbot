import jwt from 'jsonwebtoken';
import User from '../modals/User.js';

export const protect = async (req, res, next) => {
    let token = req.headers.authorization;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const user = await User.findById(userId)

        if (!user) {
            return res.json({ success: false, message: "not authorized, User Not Found" })
        }

        req.user = user;
        next();

    } catch (err) {
        res.status(401).json({ message: "not authorized, token failed" })
    }
}

export default protect;