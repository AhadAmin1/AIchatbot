import jwt from 'jsonwebtoken';
import User from '../modals/User.js';

export const protect = async (req, res, next) => {
    let token = req.headers.authorization;

    try {
        if (!token) {
            return res.status(401).json({ success: false, message: "Please sign in with Google" })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const user = await User.findById(userId)

        if (!user || !user.googleId) {
            return res.status(401).json({ success: false, message: "Please sign in with Google" })
        }

        req.user = user;
        next();

    } catch (err) {
        res.status(401).json({ message: "not authorized, token failed" })
    }
}

export default protect;