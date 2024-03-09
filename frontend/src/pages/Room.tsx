import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSocket } from "../providers/SocketProvider";
import { useParams } from "react-router-dom";

export default function Room() {
    const pc = useMemo(() => new RTCPeerConnection(), []);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const { roomId, userType } = useParams<{ roomId: string; userType: string }>();
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    const socket = useSocket();

    const createOffer = useCallback(async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log("Creating Offer");
        socket?.emit("create:offer", { roomId, offer });
    }, [socket]);

    const handleOffer = useCallback(
        async (offer: RTCSessionDescriptionInit) => {
            console.log("Offer Received");
            await pc.setRemoteDescription(offer);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            console.log("Sending Answer");
            socket?.emit("send:answer", { roomId, answer });
        },
        [socket]
    );

    const handleAnswer = useCallback(
        async (answer: RTCSessionDescriptionInit) => {
            console.log("Answer Received");
            await pc.setRemoteDescription(answer);
            socket?.emit("connection:ready", roomId);
        },
        [socket]
    );

    const addTrack = useCallback(
        (stream: MediaStream) => {
            for (const track of stream.getTracks()) {
                pc.addTrack(track, stream);
            }
        },
        [pc]
    );

    const handleAddTrack = useCallback(async () => {
        console.log("Sharing Track");
        if (localStream) {
            //negotiation-needed
            addTrack(localStream);
        } else {
            const localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = new MediaStream([localStream.getVideoTracks()[0]]);
            }
            setLocalStream(localStream);
            addTrack(localStream);
        }
    }, [localStream]);

    const handleTrack = useCallback(
        (e: RTCTrackEvent) => {
            const remoteStream = e.streams[0];
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = new MediaStream([
                    remoteStream.getAudioTracks()[0],
                    remoteStream.getVideoTracks()[0],
                ]);
            }
        },
        [remoteVideoRef]
    );

    useEffect(() => {
        if (userType === "owner") {
            pc.addEventListener("negotiationneeded", createOffer);
        }
        pc.addEventListener("track", handleTrack);
    }, [pc]);

    useEffect(() => {
        socket?.on("add:track", handleAddTrack);
        if (userType === "owner") {
            socket?.on("room:ready", createOffer);
            socket?.on("answer", handleAnswer);
            return () => {
                socket?.off("room:ready", createOffer);
                socket?.off("answer", handleAnswer);
                socket?.off("add:track", handleAddTrack);
            };
        } else {
            socket?.on("offer", handleOffer);
            socket?.emit("room:ready", roomId);
            return () => {
                socket?.off("offer", handleOffer);
                socket?.off("add:track", handleAddTrack);
            };
        }
    }, [socket, handleAddTrack, createOffer, handleAnswer, handleOffer]);

    return (
        <div>
            <h1>{`Room ID: ${roomId}`}</h1>
            <video ref={localVideoRef} autoPlay></video>
            <video ref={remoteVideoRef} autoPlay></video>
        </div>
    );
}
