import { getActiveRooms, getSocketServerInstance } from "../../serverStore.js";

export const updateRooms = (toSpecifiedSocketId: string | null = null) => {
    const io = getSocketServerInstance();

    const activeRooms = getActiveRooms();

    if (toSpecifiedSocketId) {
        io.to(toSpecifiedSocketId).emit("active-rooms", { activeRooms });
    } else {
        io.emit("active-rooms", { activeRooms });
    }
};
