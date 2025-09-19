import Chat from "../modals/Chat.js"


// API Controller for creating a new chat
export const createChat = async (req, res) => {
    try {
        const userId = req.user._id

        const chatData = {
            userId,
            messages: [],
            name: "New Chat",
            userName: req.user.name
        }

        await Chat.create(chatData)
        res.json({ success: true, message: "Chat Created" })

    } catch (err) {
        res.json({ success: false, message: err.message })
    }
}
// API Controller for getting all chat
export const getChat = async (req, res) => {
    try {
        const userId = req.user._id

        const chats = await Chat.find({ userId }).sort({ updatedAt: -1 })

        res.json({ success: true, chats })

    } catch (err) {
        res.json({ success: false, message: err.message })
    }
}
// API Controller for delete a chat
export const deleteChat = async (req, res) => {
    try {
        const userId = req.user._id
        const { chatId } = req.body

        await Chat.deleteOne({ _id: chatId, userId })

        res.json({ success: true, message: "Chat Deleted" })

    } catch (err) {
        res.json({ success: false, message: err.message })
    }
}