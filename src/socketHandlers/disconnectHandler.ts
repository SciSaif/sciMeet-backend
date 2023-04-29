import { removeConnectedUser } from "../serverStore.js";

export const disconnectHandler = (socket: any) => {
    removeConnectedUser(socket.id);
};
