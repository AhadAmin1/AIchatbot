import express from 'express';
import { getPublishedImage, getUser, loginWithGoogle } from '../controllers/userController.js';
import { protect } from '../middlewares/auth.js';

const userRouter = express.Router();

userRouter.post('/google', loginWithGoogle)
userRouter.get('/data', protect, getUser)
userRouter.get('/published-images', getPublishedImage)


export default userRouter;