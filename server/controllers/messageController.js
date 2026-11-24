import axios from "axios"
import Chat from "../modals/Chat.js"
import User from "../modals/User.js"
import imagekit from "../config/imageKit.js"


// Text-based AI Chat Message Controller

export const textMessageController = async (req, res) => {
    try {
        const userId = req.user._id

        // Check Credits
        if (req.user.credits < 1) {
            return res.json({ success: false, message: "You don't have enough credits to use this feature" })
        }

        const { chatId, prompt } = req.body


        const chat = await Chat.findOne({ userId, _id: chatId })
        chat.messages.push({
            role: "user", content: prompt, timestamp: Date.now(), isImage: false
        })

        const conversationMessages = chat.messages
            .filter(message => !message.isImage && ['user', 'assistant'].includes(message.role))
            .slice(-20)
            .map(({ role, content }) => ({ role, content }))
        const shouldUseWebSearch = /\b(?:search|browse|look up|find online|latest|current|today|news|weather|forecast|price|rate|stock|score)\b|(?:web par|internet par|aaj ki khabar|aaj ka rate|mausam|taaza khabar)/i.test(prompt)

        if (!process.env.OPENROUTER_API_KEY) {
            return res.status(503).json({
                success: false,
                message: 'OPENROUTER_API_KEY is missing. Add your key to server/.env to use the free model.',
            })
        }

        const { data: completion } = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'openrouter/free',
                messages: [
                    {
                        role: 'system',
                        content: `Today is ${new Date().toISOString().slice(0, 10)}. You are QuickGPT, a helpful conversational assistant. Reply naturally and directly in the user's language. Keep greetings and small talk brief; don't define them or search for them unless asked. Use the conversation history. For normal conversation, do not add links or source lists. For current or time-sensitive facts, use web search when available and cite its results.`,
                    },
                    ...conversationMessages,
                ],
                ...(shouldUseWebSearch ? { plugins: [{ id: 'web', max_results: 3 }] } : {}),
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:5173',
                    'X-Title': 'QuickGPT',
                },
            }
        )

        const assistantMessage = completion.choices?.[0]?.message
        const answer = typeof assistantMessage?.content === 'string' ? assistantMessage.content.trim() : ''
        if (!answer) {
            throw new Error('OpenRouter returned no text output.')
        }

        const citations = shouldUseWebSearch
            ? [...new Map(
                (assistantMessage.annotations || [])
                    .filter(annotation => annotation.type === 'url_citation' && annotation.url_citation?.url)
                    .map(({ url_citation: citation }) => [
                        citation.url,
                        { title: citation.title || citation.url, url: citation.url },
                    ])
            ).values()]
            : []
        const sourceList = citations
            .filter(citation => !answer.includes(citation.url))
            .map(citation => `- [${citation.title}](${citation.url})`)
        const content = sourceList.length > 0
            ? `${answer}\n\nSources:\n${sourceList.join('\n')}`
            : answer

        const reply = { role: 'assistant', content, timestamp: Date.now(), isImage: false }

        chat.messages.push(reply)
        await chat.save()

        await User.updateOne({ _id: userId }, { $inc: { credits: -1 } })

        res.json({ success: true, reply })

    } catch (err) {
        const status = err.status || err.response?.status
        if (status === 429 || status === 402) {
            return res.status(status).json({
                success: false,
                message: status === 429
                    ? 'OpenRouter free-model or web-search rate limit reached. Check your OpenRouter limits and retry later.'
                    : 'OpenRouter web search requires available account credits. Check your OpenRouter usage and billing settings.',
            })
        }

        return res.status(502).json({ success: false, message: err.message })
    }
}

// Image Generation Message Controller

export const imageMessageController = async (req, res) => {
    try {
        const userId = req.user._id;

        // Check Credits
        if (req.user.credits < 2) {
            return res.json({ success: false, message: "You don't have enough credits to use this feature" })
        }
        const { prompt, chatId, isPublished } = req.body;
        // Find Chat
        const chat = await Chat.findOne({ userId, _id: chatId })
        // Push user message
        chat.messages.push({
            role: "user", content: prompt, timestamp: Date.now(), isImage: false
        })

        // Encode Prompt
        const imageKitEndpoint = process.env.IMAGEKIT_URL_ENDPOINT?.trim().replace(/\/+$/, '')
        if (!imageKitEndpoint) {
            throw new Error('IMAGEKIT_URL_ENDPOINT is missing.')
        }

        const encodedPrompt = encodeURIComponent(prompt)
        const generateImageUrl = `${imageKitEndpoint}/ik-genimg-prompt-${encodedPrompt}/quickgpt/${Date.now()}.png?tr=w-800,h-800`
        let aiImageResponse

        for (let attempt = 0; attempt < 15; attempt++) {
            aiImageResponse = await axios.get(generateImageUrl, { responseType: 'arraybuffer' })
            if (aiImageResponse.headers['is-intermediate-response'] !== 'true') {
                break
            }
            if (attempt === 14) {
                throw new Error('ImageKit is still preparing the image. Please try again shortly.')
            }
            await new Promise(resolve => setTimeout(resolve, 4000))
        }

        const contentType = aiImageResponse.headers['content-type']?.split(';')[0]
        if (!contentType?.startsWith('image/')) {
            throw new Error('ImageKit did not return an image.')
        }

        const base64Image = `data:${contentType};base64,${Buffer.from(aiImageResponse.data).toString('base64')}`

        // Upload to imageKit media liberary
        const uploadResponse = await imagekit.upload({
            file: base64Image,
            fileName: `${Date.now()}.png`,
            folder: "quickgpt"
        })

        const reply = { role: 'assistant', content: uploadResponse.url, timestamp: Date.now(), isImage: true, isPublished }

        chat.messages.push(reply)
        await chat.save()

        await User.updateOne({ _id: userId }, { $inc: { credits: -2 } })

        res.json({ success: true, reply })



    } catch (err) {
        return res.status(502).json({ success: false, message: err.message })
    }

}