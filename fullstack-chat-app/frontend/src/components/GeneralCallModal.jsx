import { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useWebRTC } from "../hooks/useWebRTC";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";

const GeneralCallModal = () => {
    const {
        incomingCall,
        calling,
        activeCall,
        acceptCall,
        rejectCall,
        endCall
    } = useChatStore();
    const { authUser, socket } = useAuthStore();

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const {
        localStream,
        remoteStream,
        isAudioMuted,
        isVideoOff,
        initWebRTC,
        handleSignal,
        cleanup,
        toggleAudio,
        toggleVideo
    } = useWebRTC(socket, authUser?._id, "general");

    // Handle signal events from socket
    useEffect(() => {
        if (!socket) return;

        const onSignal = ({ from, signal }) => {
            handleSignal(signal, null, from);
        };

        socket.on("webrtc:signal", onSignal);
        return () => socket.off("webrtc:signal", onSignal);
    }, [socket, handleSignal]);

    // Attach streams to video elements
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // Start WebRTC when call is accepted
    useEffect(() => {
        if (activeCall && !localStream) {
            const isCaller = calling;
            const targetId = activeCall.from;
            initWebRTC(isCaller, targetId);
        }

        if (!activeCall && localStream) {
            cleanup();
        }
    }, [activeCall, calling, localStream, initWebRTC, cleanup]);

    if (!incomingCall && !calling && !activeCall) {
        return null;
    }

    // Incoming call UI
    if (incomingCall && !activeCall) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
                <div className="bg-base-100 rounded-lg p-6 w-96 shadow-2xl border border-primary/20">
                    <div className="text-center">
                        <div className="avatar placeholder mb-4">
                            <div className="bg-primary text-primary-content rounded-full w-20 h-20 ring ring-primary ring-offset-base-100 ring-offset-2 animate-pulse">
                                <span className="text-3xl font-bold">
                                    {incomingCall.callerInfo?.fullName?.charAt(0)?.toUpperCase() || "U"}
                                </span>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-1">Incoming {incomingCall.type || 'Video'} Call</h3>
                        <p className="text-base-content/70 mb-8">
                            {incomingCall.callerInfo?.fullName || "Someone"} is calling...
                        </p>
                        <div className="flex justify-center gap-6">
                            <button
                                className="btn btn-error btn-circle btn-lg"
                                onClick={() => rejectCall(incomingCall.from)}
                            >
                                <PhoneOff size={28} />
                            </button>
                            <button
                                className="btn btn-success btn-circle btn-lg"
                                onClick={() => acceptCall(incomingCall.from)}
                            >
                                <Phone size={28} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Outgoing call UI
    if (calling && !activeCall) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
                <div className="bg-base-100 rounded-lg p-6 w-96 shadow-2xl border border-primary/20">
                    <div className="text-center">
                        <div className="loading loading-spinner loading-lg text-primary scale-150 mb-6"></div>
                        <h3 className="text-2xl font-bold mb-1">Calling...</h3>
                        <p className="text-base-content/70 mb-8">Waiting for answer</p>
                        <button
                            className="btn btn-error btn-circle btn-lg mx-auto"
                            onClick={() => endCall("unknown")}
                        >
                            <PhoneOff size={28} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Active call UI
    if (activeCall) {
        return (
            <div className="fixed bottom-6 right-6 bg-base-100 rounded-2xl shadow-2xl z-[100] w-80 overflow-hidden border border-base-300">
                <div className="relative aspect-video bg-black">
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                    {!remoteStream && (
                        <div className="absolute inset-0 flex items-center justify-center text-white/50 bg-neutral-900">
                            <VideoOff size={48} />
                        </div>
                    )}

                    <div className="absolute top-2 right-2 w-24 aspect-video bg-neutral-800 rounded-lg border border-white/20 overflow-hidden z-10 shadow-lg">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover mirror"
                        />
                    </div>
                </div>

                <div className="p-4 flex items-center justify-center gap-4 bg-base-200/50 backdrop-blur-md">
                    <button
                        className={`btn btn-circle btn-sm ${isAudioMuted ? 'btn-error' : 'btn-ghost'}`}
                        onClick={toggleAudio}
                    >
                        {isAudioMuted ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>

                    <button
                        className="btn btn-error btn-circle"
                        onClick={() => endCall(activeCall.from)}
                    >
                        <PhoneOff size={24} />
                    </button>

                    <button
                        className={`btn btn-circle btn-sm ${isVideoOff ? 'btn-error' : 'btn-ghost'}`}
                        onClick={toggleVideo}
                    >
                        {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default GeneralCallModal;
