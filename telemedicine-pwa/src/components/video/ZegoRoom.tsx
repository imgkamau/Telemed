import { useEffect, useRef, useState, useCallback } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useRouter } from 'next/router';

interface ZegoRoomProps {
  roomId: string;
  userId: string;
  userName: string;
  isDoctor?: boolean;
}

function ZegoRoom({ roomId, userId, userName, isDoctor }: ZegoRoomProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const zegoRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  const cleanupMediaDevices = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      mediaStreamRef.current = null;
    }
  };

  const handleLeaveRoom = useCallback(async () => {
    setIsLeaving(true);
    
    try {
      // Update consultation status
      if (!db) throw new Error('Database not initialized');
      const consultationRef = doc(db, 'consultations', roomId);
      await updateDoc(consultationRef, {
        status: 'completed',
        endTime: new Date(),
        completedAt: new Date()
      });

      // Redirect based on isDoctor prop
      router.push(isDoctor ? '/doctor/dashboard' : '/patient/dashboard');
    } catch (error) {
      console.error('Error completing consultation:', error);
      // Still redirect on error
      router.push(isDoctor ? '/doctor/dashboard' : '/patient/dashboard');
    }

    if (zegoRef.current) {
      try {
        zegoRef.current.destroy();
        zegoRef.current = null;
      } catch (e) {
        console.error('Cleanup error:', e);
      }
    }
    cleanupMediaDevices();
  }, [isDoctor, roomId, router]);

  const initZego = useCallback(async () => {
    try {
      if (!containerRef.current) return;

      // Mobile-specific styles
      containerRef.current.style.width = '100%';
      containerRef.current.style.height = '100vh';
      containerRef.current.style.position = 'fixed';
      containerRef.current.style.top = '0';
      containerRef.current.style.left = '0';
      containerRef.current.style.zIndex = '1000';

      // Test audio devices
      const audioContext = new AudioContext();
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = mediaStream;
      const source = audioContext.createMediaStreamSource(mediaStream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      const audioDetected = dataArray.some(value => value > 0);
      
      if (audioDetected) {
        console.log('Audio input detected and working');
      } else {
        console.warn('No audio input detected');
      }

      const appID = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID!);
      const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET!;
      
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomId,
        userId,
        userName
      );

      const zc = ZegoUIKitPrebuilt.create(kitToken);
      zegoRef.current = zc;

      zc.joinRoom({
        container: containerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.OneONoneCall,
          config: {
            role: ZegoUIKitPrebuilt.Host,
          },
        },
        showLeaveRoomConfirmDialog: true,
        onLeaveRoom: async () => {
          console.log('Leave room triggered');
          setIsLeaving(true);
          await handleLeaveRoom();
        },
        sharedLinks: [],
        showRoomDetailsButton: false,
        turnOnMicrophoneWhenJoining: true,
        turnOnCameraWhenJoining: true,
        showMyCameraToggleButton: true,
        showMyMicrophoneToggleButton: true,
        showAudioVideoSettingsButton: true,
        showPreJoinView: true,
        showTextChat: true,
        maxUsers: 2,
        layout: "Auto",
        showScreenSharingButton: false
      });
    } catch (error) {
      console.error('Error initializing Zego:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize video call');
    }
  }, [roomId, userId, userName, handleLeaveRoom]);

  useEffect(() => {
    let mounted = true;
    initZego();

    return () => {
      mounted = false;
      handleLeaveRoom();
    };
  }, [roomId, userId, userName, handleLeaveRoom, initZego]);

  const handleRejoin = async () => {
    if (!isLeaving) {
      try {
        setIsLeaving(false);
        await initZego();
      } catch (error) {
        console.error('Error rejoining room:', error);
        setError('Failed to rejoin the room');
      }
    }
  };

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        Error: {error}
        <button 
          onClick={handleRejoin}
          style={{
            marginLeft: '10px',
            padding: '5px 10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Rejoin Call
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      style={{
        width: '100%',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1000,
        backgroundColor: '#f0f0f0',
        overflow: 'hidden'
      }}
    >
      {/* Add backup leave button for mobile */}
      <button
        onClick={handleLeaveRoom}
        style={{
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10000,
          padding: '12px 24px',
          backgroundColor: '#ff4d4f',
          color: 'white',
          border: 'none',
          borderRadius: '24px',
          display: 'none' // Hidden by default
        }}
      >
        Leave Room
      </button>
      <style jsx global>{`
        .zego-uikit {
          height: 100vh !important;
          width: 100vw !important;
        }
        
        .call-button,
        .leave-button,
        .zego-uikit-prebuilt-hang-up-button {
          position: fixed !important;
          bottom: max(20px, env(safe-area-inset-bottom)) !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          z-index: 9999 !important;
          touch-action: manipulation !important;
          -webkit-tap-highlight-color: transparent !important;
        }
        
        /* Mobile-specific styles */
        @media (max-width: 768px) {
          .zego-uikit-prebuilt-video-conference-footer {
            padding-bottom: max(30px, env(safe-area-inset-bottom)) !important;
          }
          
          .leave-button,
          .zego-uikit-prebuilt-hang-up-button {
            padding: 12px 24px !important;
            border-radius: 24px !important;
            background: #ff4d4f !important;
            min-width: 120px !important;
            touch-action: manipulation !important;
          }
          
          /* Ensure buttons are clickable */
          .zego-uikit button {
            touch-action: manipulation !important;
            cursor: pointer !important;
          }

          /* Specific targeting for hang-up button */
          .zego-uikit-prebuilt-hang-up-button {
            pointer-events: auto !important;
            opacity: 1 !important;
            visibility: visible !important;
          }

          /* Show backup button only on mobile when Zego button fails */
          button {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}

export default ZegoRoom; 