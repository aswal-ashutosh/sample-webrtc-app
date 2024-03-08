import { ReactNode, createContext, useContext, useMemo } from "react";
import { Socket, io } from "socket.io-client";

const SocketContext = createContext<Socket | null>(null);

export const useSocket: () => Socket | null = () => useContext(SocketContext);

export default function SocketProvider({ children }: { children: ReactNode }) {
    const socket = useMemo(() => io("ws://localhost:3000"), []);
    return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}
