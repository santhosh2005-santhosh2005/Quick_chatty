import { useState, useCallback, useRef, useEffect } from "react";
import toast from "react-hot-toast";

export const useWebRTC = (socket, userId, type = "collab") => {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    const peerConnection = useRef(null);
    const pendingCandidates = useRef([]);

    const cleanup = useCallback(() => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
        if (remoteStream) {
            remoteStream.getTracks().forEach(track => track.stop());
            setRemoteStream(null);
        }
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        pendingCandidates.current = [];
        setIsAudioMuted(false);
        setIsVideoOff(false);
    }, [localStream, remoteStream]);

    const initWebRTC = useCallback(async (isCaller, targetId, sessionId = null) => {
        try {
            // 1. Get Local Stream
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            setLocalStream(stream);

            // 2. Create Peer Connection
            const config = {
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                    { urls: "stun:stun1.l.google.com:19302" },
                ],
            };

            const pc = new RTCPeerConnection(config);
            peerConnection.current = pc;

            // 3. Add tracks to Peer Connection
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            // 4. Handle remote stream
            pc.ontrack = (event) => {
                setRemoteStream(event.streams[0]);
            };

            // 5. Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    const signalEvent = type === "collab" ? "webrtc-signal" : "webrtc:signal";
                    const payload = type === "collab"
                        ? { sessionId, to: targetId, signal: { type: "candidate", candidate: event.candidate } }
                        : { to: targetId, signal: { type: "candidate", candidate: event.candidate } };

                    socket.emit(signalEvent, payload);
                }
            };

            // 6. Create Offer if Caller
            if (isCaller) {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                const signalEvent = type === "collab" ? "webrtc-signal" : "webrtc:signal";
                const payload = type === "collab"
                    ? { sessionId, to: targetId, signal: offer }
                    : { to: targetId, signal: offer };

                socket.emit(signalEvent, payload);
            }

            return pc;
        } catch (error) {
            console.error("WebRTC Init Error:", error);
            toast.error("Could not access camera/microphone");
            return null;
        }
    }, [socket, type]);

    const handleSignal = useCallback(async (signal, sessionId = null, from) => {
        if (!peerConnection.current) return;

        try {
            if (signal.type === "offer") {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal));
                const answer = await peerConnection.current.createAnswer();
                await peerConnection.current.setLocalDescription(answer);

                const signalEvent = type === "collab" ? "webrtc-signal" : "webrtc:signal";
                const payload = type === "collab"
                    ? { sessionId, to: from, signal: answer }
                    : { to: from, signal: answer };

                socket.emit(signalEvent, payload);
            } else if (signal.type === "answer") {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal));
            } else if (signal.type === "candidate") {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
            }
        } catch (error) {
            console.error("Signal Handling Error:", error);
        }
    }, [socket, type]);

    const toggleAudio = useCallback(() => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioMuted(!audioTrack.enabled);
            }
        }
    }, [localStream]);

    const toggleVideo = useCallback(() => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    }, [localStream]);

    return {
        localStream,
        remoteStream,
        isAudioMuted,
        isVideoOff,
        initWebRTC,
        handleSignal,
        cleanup,
        toggleAudio,
        toggleVideo
    };
};
