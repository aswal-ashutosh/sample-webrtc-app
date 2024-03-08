import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../providers/SocketProvider";

export default function Home() {
    const [roomId, setRoomId] = useState<string>("");
    const socket = useSocket();
    const navigate = useNavigate();

    const handleRoomCreated = useCallback((roomId: string) => {
        navigate(`/room/${roomId}/owner`);
    }, []);

    const handleRoomJoined = useCallback((roomId: string) => {
        navigate(`/room/${roomId}/joiner`);
    }, []);

    const handleInvalidRoomId = useCallback((message: string) => {
        alert(message);
    }, []);

    useEffect(() => {
        socket?.on("room:created", handleRoomCreated);
        socket?.on("room:joined", handleRoomJoined);
        socket?.on("invalid:roomId", handleInvalidRoomId);
        return () => {
            socket?.off("room:created", handleRoomCreated);
            socket?.off("room:joined", handleRoomJoined);
            socket?.off("invalid:roomId", handleInvalidRoomId);
        };
    }, [socket, handleRoomCreated, handleRoomJoined, handleInvalidRoomId]);

    return (
        <div>
            <input
                value={roomId}
                onChange={(e) => {
                    setRoomId(e.target.value);
                }}
                type="text"
            />
            <button
                onClick={() => {
                    socket?.emit("join:room", roomId);
                }}
            >
                Join Room
            </button>
            <button
                onClick={() => {
                    socket?.emit("create:room");
                }}
            >
                Create Room
            </button>
        </div>
    );
}
