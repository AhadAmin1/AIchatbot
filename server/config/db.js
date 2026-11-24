import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => console.log('DB connected successfully'))
        mongoose.connection.on('error', (err) => console.error(`DB connection error: ${err.message}`))

        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is missing')
        }

        if (!process.env.MONGODB_DB) {
            throw new Error('MONGODB_DB is missing')
        }

        const mongoUri = new URL(process.env.MONGODB_URI)
        mongoUri.pathname = `/${process.env.MONGODB_DB}`

        await mongoose.connect(mongoUri.toString(), {
            serverSelectionTimeoutMS: 10000,
        });
        return true
    } catch (err) {
        console.error(`MongoDB unavailable: ${err.message}`)
        return false
    }
}

export const requireDatabase = (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            success: false,
            message: 'Database is unavailable. Check the MongoDB connection and try again.',
        })
    }

    next()
}

export default connectDB;