import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => console.log('DB connected successfully'))
        await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.MONGODB_DB}`);
    } catch (err) {
        console.log(err.message)
    }
}

export default connectDB;