import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import WebSocketService from '../services/WebSocketService';
import './VideoCall.css';

const VideoCall = () => {
    const { roomId } = useParams();
    const [searchParams] = useSearchParams();
    const role = searchParams.get('role');
    const userId = searchParams.get('userId');
    const userName = searchParams.get('userName') || `${role.charAt(0).toUpperCase() + role.slice(1)}`;
    const navigate = useNavigate();

    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [error, setError] = useState(null);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [remoteUser, setRemoteUser] = useState(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnection = useRef(null);

    const configuration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
        
        ],
        iceCandidatePoolSize: 10,
    };

    const requestMediaPermissions = async () => {
        try {
            setIsLoading(true);
            
            // Check if running in HTTPS or localhost
            if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                throw new Error('Video calls require HTTPS in production environment');
            }
            
            // Try to access media devices
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: true
            });
            
            setLocalStream(stream);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            setIsLoading(false);
            return stream;
        } catch (err) {
            setIsLoading(false);
            
            if (err.name === 'NotAllowedError') {
                setError('Please allow camera and microphone access in your browser settings and click Retry.');
            } else if (err.name === 'NotFoundError') {
                setError('No camera or microphone found. Please connect a device and click Retry.');
            } else if (err.name === 'NotReadableError') {
                setError('Your camera or microphone is already in use by another application. Please close other applications and click Retry.');
            } else if (err.message.includes('HTTPS')) {
                setError('Video calls require a secure HTTPS connection in production. Please ensure you are using HTTPS.');
            } else {
                setError(`Failed to access media devices: ${err.message}`);
            }
            return null;
        }
    };

    useEffect(() => {
        if (!roomId || !role || !userId) {
            setError('Missing required parameters');
            return;
        }

        const initializeCall = async () => {
            try {
                const stream = await requestMediaPermissions();
                if (!stream) return;
                if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                    throw new Error('Video calls require HTTPS in production environment');
                }
                WebSocketService.connect(() => {
                    WebSocketService.subscribe(roomId, handleSignalingMessage);
                    startCall(stream);
                });
            } catch (err) {
                setError('Failed to initialize call: ' + err.message);
            }
        };

        initializeCall();
        return () => {
            cleanup();
        };
    }, [roomId, role, userId, cleanup, handleSignalingMessage, startCall]);

    const cleanup = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (peerConnection.current) {
            peerConnection.current.close();
        }
        WebSocketService.unsubscribe(roomId);
        WebSocketService.disconnect();
    };

    const startCall = async (stream) => {
        try {
            if (!stream) {
                return;
            }

            createPeerConnection();

            // Add tracks to peer connection
            stream.getTracks().forEach(track => {
                peerConnection.current.addTrack(track, stream);
            });

            if (role === 'doctor') {
                const offer = await peerConnection.current.createOffer();
                await peerConnection.current.setLocalDescription(offer);
                WebSocketService.sendMessage(roomId, {
                    type: 'offer',
                    sdp: offer,
                    from: userId,
                    userName: userName,
                    role: role
                });
            }
        } catch (err) {
            setError('Failed to start call: ' + err.message);
        }
    };

    const createPeerConnection = () => {
        peerConnection.current = new RTCPeerConnection(configuration);

        peerConnection.current.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                setRemoteStream(event.streams[0]);
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
            }
        };

        peerConnection.current.onicecandidate = (event) => {
            if (event.candidate) {
                WebSocketService.sendMessage(roomId, {
                    type: 'ice-candidate',
                    candidate: event.candidate,
                    from: userId
                });
            }
        };

        peerConnection.current.onconnectionstatechange = () => {
            switch(peerConnection.current.connectionState) {
                case 'connected':
                    break;
                case 'disconnected':
                    break;
                case 'failed':
                    setError('Connection failed. Please try refreshing the page.');
                    break;
                default:
                    break;
            }
        };

        peerConnection.current.oniceconnectionstatechange = () => {
        };
    };

    const handleSignalingMessage = async (message) => {
        try {
            if (message.from === userId) return; // Ignore messages from self

            // Update remote user info when received
            if (message.userName) {
                setRemoteUser({
                    id: message.from,
                    name: message.userName,
                    role: message.role
                });
            }

            switch (message.type) {
                case 'offer':
                    if (role === 'patient') {
                        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(message.sdp));
                        const answer = await peerConnection.current.createAnswer();
                        await peerConnection.current.setLocalDescription(answer);
                        WebSocketService.sendMessage(roomId, {
                            type: 'answer',
                            sdp: answer,
                            from: userId,
                            userName: userName,
                            role: role
                        });
                    }
                    break;

                case 'answer':
                    if (role === 'doctor') {
                        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(message.sdp));
                    }
                    break;

                case 'ice-candidate':
                    try {
                        await peerConnection.current.addIceCandidate(new RTCIceCandidate(message.candidate));
                    } catch (e) {
                    }
                    break;

                default:
            }
        } catch (e) {
        }
    };

    const toggleAudio = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsAudioEnabled(!isAudioEnabled);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoEnabled(!isVideoEnabled);
        }
    };

    const endCall = () => {
        cleanup();
        if(role==='patient'){
            navigate('/patient-dashboard');
        }else{
            navigate('/doctor-dashboard');
        }
    };

    const retryCall = async () => {
        setError(null);
        const stream = await requestMediaPermissions();
        if (stream) {
            startCall(stream);
        }
    };

    if (error) {
        return (
            <div className="video-call-container">
                <div className="error-container">
                    <div className="error">{error}</div>
                    <button 
                        onClick={retryCall} 
                        className="control-button"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="video-call-container">
            <div className="call-header">
                <h2>Video Consultation</h2>
                <div className="room-info">Room ID: {roomId}</div>
            </div>
            <div className="video-grid">
                <div className="video-wrapper">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        playsinline
                        muted
                        className="video-player"
                        onLoadedMetadata={() => {
                            localVideoRef.current.play().catch(e => {});
                        }}
                    />
                    <div className="video-label">
                        <span className="user-name">{userName}</span>
                        <span className="user-role">({role})</span>
                        {!isVideoEnabled && <span className="video-off-indicator">Camera Off</span>}
                        {!isAudioEnabled && <span className="audio-off-indicator">🎤</span>}
                    </div>
                    {isLoading && (
                        <div className="loading-prompt">
                            Connecting to camera and microphone...
                        </div>
                    )}
                </div>
                <div className="video-wrapper">
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        playsinline
                        className="video-player"
                        onLoadedMetadata={() => {
                            remoteVideoRef.current.play().catch(e => {});
                        }}
                    />
                    <div className="video-label">
                        {remoteUser ? (
                            <>
                                <span className="user-name">{remoteUser.name}</span>
                                <span className="user-role">({remoteUser.role})</span>
                            </>
                        ) : (
                            <span>Waiting for other participant...</span>
                        )}
                    </div>
                </div>
            </div>
            <div className="controls">
                <button onClick={toggleAudio} className={`control-button ${!isAudioEnabled ? 'disabled' : ''}`}>
                    {isAudioEnabled ? 'Mute' : 'Unmute'}
                </button>
                <button onClick={toggleVideo} className={`control-button ${!isVideoEnabled ? 'disabled' : ''}`}>
                    {isVideoEnabled ? 'Hide Video' : 'Show Video'}
                </button>
                <button onClick={endCall} className="control-button end-call">
                    End Call
                </button>
            </div>
        </div>
    );
};

export default VideoCall; 