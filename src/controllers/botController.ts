import { z } from "zod";
import asyncRequestHandler from "../utils/asyncRequestHandler.js";
import User from "../models/userModal.js";
import Bot from "../models/botModel.js";
import Conversation from "../models/conversationModal.js";
import {
    getActiveConnections,
    getOnlineUsers,
    getSocketServerInstance,
} from "../serverStore.js";
import messageModal from "../models/messageModal.js";

// @DESC Create a new bot
// @ROUTE POST /bots
// @ACCESS Private
export const createBot = asyncRequestHandler(
    z.object({
        bot_name: z.string().min(1),
        participants: z.array(z.string()),
        avatar: z.string(),
        api_key: z.string().optional(),
    }),
    async (req, res) => {
        let { bot_name, participants, avatar, api_key } = req.body;
        const user = req.user;

        // check if bot name already exists
        const botExists = await Bot.findOne({ bot_name });
        if (botExists) {
            return res.status(400).json({ toast: "Bot name already exists" });
        }

        // create a bot with the given botName
        const bot = await Bot.create({
            bot_name,
            creator_id: user._id,
            avatar,
            api_key,
        });

        // add current userid to participants
        participants.push(user._id);
        // create a new conversation
        const conversation = await Conversation.create({
            participants,
            isBot: true,
            botId: bot._id,
        });

        // add conversation id to bot
        bot.conversation_id = conversation._id;
        await bot.save();

        const curr_conversation: any = await Conversation.findById(
            conversation._id
        ).populate({
            path: "messages",
            model: "Message",
            populate: {
                path: "author",
                model: "User",
                select: "username _id avatar",
            },
        });

        const io = getSocketServerInstance();

        // find all active connections of specific userId
        const onlineUsers = getOnlineUsers();
        // get all online participants
        const receiverList = onlineUsers.filter((onlineUser) =>
            participants.includes(onlineUser.userId)
        );

        receiverList.forEach((receiverSocketId) => {
            io.to(receiverSocketId.socketId).emit("new-bot", {
                bot,
                conversation: curr_conversation,
            });
        });

        return res.status(201).json({ toast: "Bot created successfully!" });
    }
);

// @DESC update a bot
// @ROUTE PUT /bots
// @ACCESS Private
export const updateBot = asyncRequestHandler(
    z.object({
        bot_id: z.string(),
        bot_name: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        api_key: z.string().optional(),
    }),
    async (req, res) => {
        let { bot_name, description, bot_id, api_key } = req.body;
        const user = req.user;

        // check if bot exists
        const bot = await Bot.findById(bot_id);

        if (!bot) {
            return res.status(400).json({ toast: "Bot does not exist" });
        }

        // check if current user is the creator of the bot
        if (bot.creator_id.toString() !== user._id) {
            return res.status(401).json({ toast: "You are not the creator" });
        }

        const updatedBot = await Bot.findByIdAndUpdate(
            { _id: bot_id },
            {
                bot_name,
                description,
                api_key,
            },
            { new: true }
        );
        // get the conversation
        const conversation = await Conversation.findOne({
            botId: bot_id,
        });

        if (!conversation) {
            return res
                .status(400)
                .json({ toast: "Conversation does not exist" });
        }

        const participants = conversation.participants;
        const io = getSocketServerInstance();

        // find all active connections of specific userId
        const onlineUsers = getOnlineUsers();
        // get all online participants
        const receiverList = onlineUsers.filter((onlineUser) =>
            participants.includes(onlineUser.userId as any)
        );

        receiverList.forEach((receiverSocketId) => {
            io.to(receiverSocketId.socketId).emit("bot-updated", {
                bot: updatedBot,
            });
        });

        return res.status(200).json({ toast: "Bot updated successfully!" });
    }
);

// @DESC delete a bot
// @ROUTE DELETE /bots/:botId
// @ACCESS Private
export const deleteBot = asyncRequestHandler(null, async (req, res) => {
    const { botId } = req.params;
    const user = req.user;

    const bot = await Bot.findById(botId);
    if (!bot) {
        return res.status(400).json({ toast: "Bot does not exist" });
    }

    // check if current user is the creator of the bot
    if (bot.creator_id.toString() !== user._id) {
        return res.status(401).json({ toast: "You are not the creator" });
    }

    // delete bot
    await Bot.findByIdAndDelete(botId);

    // get the conversation
    const conversation = await Conversation.findOne({
        botId,
    });

    if (!conversation) {
        return res.status(400).json({ toast: "Conversation does not exist" });
    }

    // delete conversation
    await Conversation.findOneAndDelete({
        botId,
    });

    // delete the messages of the conversation
    const messageIds = conversation.messages.map((m) => m.toString());
    await messageModal.deleteMany({
        _id: { $in: messageIds },
    });

    // remove files from s3 @TODO

    const participants = conversation.participants;

    // send bot deleted event to all participants
    const onlineUsers = getOnlineUsers();
    const receiverList = onlineUsers.filter((onlineUser) =>
        participants.includes(onlineUser.userId as any)
    );

    const io = getSocketServerInstance();

    receiverList.forEach((receiverSocketId) => {
        io.to(receiverSocketId.socketId).emit("bot-deleted", {
            botId,
        });
    });

    return res.status(200).json({ toast: "Bot deleted successfully!" });
});

// @DESC get all bot types available
// @ROUTE GET /bots/types
// @ACCESS Private
export const getBotTypes = asyncRequestHandler(null, async (req, res) => {
    const botTypes = await User.find({ is_bot: true });
    const result = botTypes.map((botType) => {
        return {
            _id: botType._id,
            bot_type: botType.username,
            avatar: botType.avatar,
            username: botType.username,
        };
    });
    return res.status(200).json(result);
});
