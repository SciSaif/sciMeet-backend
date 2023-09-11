// messages[i].seenBy.find(
//     (d: { userId: string; date: string }) =>
//         d.userId.toString() === user._id
// )

import { Types } from "mongoose";

// function to check if message is seen by userId or not
export const isMessageSeen = (message: any, userId: string) => {
    return message.seenBy.find(
        (d: { userId: Types.ObjectId; date: string }) =>
            d.userId.toString() === userId
    );
};
