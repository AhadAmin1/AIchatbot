import User from "../modals/User.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import Chat from "../modals/Chat.js";

const googleOAuthClient = new OAuth2Client();

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    })
}

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const loginWithGoogle = async (req, res) => {
    const credential = req.body?.credential
    const clientId = process.env.GOOGLE_CLIENT_ID

    if (!clientId) {
        return res.status(503).json({ success: false, message: 'Google sign-in is not configured.' })
    }
    if (typeof credential !== 'string' || !credential.trim()) {
        return res.status(400).json({ success: false, message: 'A Google credential is required.' })
    }

    let profile
    try {
        const ticket = await googleOAuthClient.verifyIdToken({
            idToken: credential,
            audience: clientId,
        })
        profile = ticket.getPayload()
    } catch {
        return res.status(401).json({ success: false, message: 'Google sign-in failed. Please try again.' })
    }

    const email = typeof profile?.email === 'string' ? profile.email.trim().toLowerCase() : ''
    if (!profile?.sub || !email || profile.email_verified !== true) {
        return res.status(401).json({ success: false, message: 'Use a Google account with a verified email address.' })
    }

    try {
        let user = await User.findOne({ googleId: profile.sub })
        if (!user) {
            user = await User.findOne({
                email: new RegExp(`^${escapeRegex(email)}$`, 'i'),
            })

            if (user) {
                if (user.googleId && user.googleId !== profile.sub) {
                    return res.status(409).json({ success: false, message: 'This email is linked to another Google account.' })
                }
                user.googleId = profile.sub
                if (!user.name) user.name = profile.name || email.split('@')[0]
                await user.save()
            } else {
                user = await User.create({
                    name: profile.name || email.split('@')[0],
                    email,
                    googleId: profile.sub,
                })
            }
        }

        return res.json({ success: true, token: generateToken(user._id) })
    } catch (error) {
        console.error('Google sign-in failed:', error.message)
        return res.status(500).json({ success: false, message: 'Could not sign in with Google.' })
    }
}

// API to get user data
export const getUser = async (req, res) => {
    try {
        const { _id, name, email, credits } = req.user;
        const user = { _id, name, email, credits };
        return res.json({ success: true, user })

    } catch (err) {
        return res.json({ success: false, message: err.message })
    }
}

// API to get published images

export const getPublishedImage = async (req, res) => {
    try {
        const publishedImageMessage = await Chat.aggregate([
            { $unwind: "$messages" },
            {
                $match: {
                    "messages.isImage": true,
                    "messages.isPublished": true
                }
            },
            {
                $project: {
                    _id: 0,
                    imageUrl: "$messages.content",
                    userName: "$userName"
                }
            }
        ])

        res.json({
            success: true, images: publishedImageMessage.reverse()
        })


    } catch (err) {
                return res.json({ success: false, message: err.message })
    }

}