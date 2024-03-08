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

    const handleInitSharing = useCallback(async () => {
        console.log("init");
        const localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = new MediaStream([localStream.getVideoTracks()[0]]);
        }
        setLocalStream(localStream);
        console.log("Stream Stored");
        for (const track of localStream.getTracks()) {
            pc.addTrack(track, localStream);
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

    const createNegotiationOffer = useCallback(async () => {
        if (userType === "owner") {
            console.log("Creating Negotiation Offer");
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket?.emit("create:negotiation:offer", { roomId, offer });
        }
    }, [socket]);

    const handleNegotiationOffer = useCallback(
        async (offer: RTCSessionDescriptionInit) => {
            console.log("Negotiation Offer Received");
            await pc.setRemoteDescription(offer);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            console.log("Sending Negotiation Answer");
            socket?.emit("send:negotiation:answer", { roomId, answer });
        },
        [socket]
    );

    const handleNegotiationAnswer = useCallback(
        async (answer: RTCSessionDescriptionInit) => {
            console.log("Negotiation Answer Received");
            await pc.setRemoteDescription(answer);
            socket?.emit("negotiation:completed", roomId);
        },
        [socket]
    );

    const handleNegotiationCompletion = useCallback(async () => {
        if (!localStream) {
            return;
        }
        for (const track of localStream.getTracks()) {
            pc.addTrack(track, localStream);
        }
    }, [pc, localStream]);

    useEffect(() => {
        //Todo use function version
        if (userType === "owner") {
            pc.addEventListener("negotiationneeded", createNegotiationOffer);
        }
        pc.addEventListener("track", handleTrack);
    }, [pc]);

    useEffect(() => {
        socket?.on("init:sharing", handleInitSharing);
        socket?.on("negotiation:completion", handleNegotiationCompletion);
        if (userType === "owner") {
            socket?.on("room:ready", createOffer);
            socket?.on("answer", handleAnswer);
            socket?.on("negotiation:answer", handleNegotiationAnswer);
            return () => {
                socket?.off("room:ready", createOffer);
                socket?.off("answer", handleAnswer);
                socket?.off("init:sharing", handleInitSharing);
                socket?.off("negotiation:answer", handleNegotiationAnswer);
                socket?.off("negotiation:completion", handleNegotiationCompletion);
            };
        } else {
            socket?.on("offer", handleOffer);
            socket?.on("negotiation:offer", handleNegotiationOffer);
            socket?.emit("room:ready", roomId);
            return () => {
                socket?.off("offer", handleOffer);
                socket?.off("init:sharing", handleInitSharing);
                socket?.off("negotiation:offer", handleNegotiationOffer);
                socket?.off("negotiation:completion", handleNegotiationCompletion);
            };
        }
    }, [
        socket,
        handleInitSharing,
        handleNegotiationCompletion,
        createOffer,
        handleAnswer,
        handleNegotiationAnswer,
        handleOffer,
        handleNegotiationOffer,
    ]);

    return (
        <div>
            <h1>{`Room ID: ${roomId}`}</h1>
            <video ref={localVideoRef} autoPlay></video>
            <video ref={remoteVideoRef} autoPlay></video>
        </div>
    );
}
