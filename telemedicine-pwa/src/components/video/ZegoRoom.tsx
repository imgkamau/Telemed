import { useEffect, useRef, useState, useCallback } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface ZegoRoomProps {
  roomId: string;
  userId: string;
  userName: string;
  role?: 'Host' | 'Cohost';
}

function ZegoRoom({ roomId, userId, userName, role = 'Host' }: ZegoRoomProps) {
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
    if (zegoRef.current) {
      try {
        // Update consultation status
        if (!db) throw new Error('Database not initialized');
        const consultationRef = doc(db, 'consultations', roomId);
        await updateDoc(consultationRef, {
          status: 'completed',
          endTime: new Date()
        });

        zegoRef.current.destroy();
        zegoRef.current = null;
      } catch (e) {
        console.error('Cleanup error:', e);
      }
    }
    cleanupMediaDevices();
  }, [roomId]);

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

      const appID = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID!);
      const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET!;
      
      console.log('Joining room with:', { roomId, userId, userName, role });

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
            role: role === 'Host' ? ZegoUIKitPrebuilt.Host : ZegoUIKitPrebuilt.Cohost,
          },
        },
        onLeaveRoom: () => {
          handleLeaveRoom();
          if (!isLeaving) {
            handleRejoin();
          }
        },
        turnOnMicrophoneWhenJoining: true,
        turnOnCameraWhenJoining: true,
        showMyCameraToggleButton: true,
        showMyMicrophoneToggleButton: true,
        showAudioVideoSettingsButton: true,
        showPreJoinView: true,
        showTextChat: true,
        maxUsers: 2,
        layout: "Auto",
        showScreenSharingButton: false,
        videoResolutionDefault: window.innerWidth < 768 ? 
          ZegoUIKitPrebuilt.VideoResolution_360P : 
          ZegoUIKitPrebuilt.VideoResolution_720P,
      });
    } catch (error) {
      console.error('Error initializing Zego:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize video call');
    }
  }, [roomId, userId, userName, role, isLeaving, handleLeaveRoom]);

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
        backgroundColor: '#f0f0f0'
      }}
    >
      <style jsx global>{`
        .call-button {
          position: fixed !important;
          bottom: 20px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          z-index: 1001 !important;
        }
        
        /* Mobile-specific styles */
        @media (max-width: 768px) {
          .zego-uikit-prebuilt-video-conference-footer {
            padding-bottom: env(safe-area-inset-bottom) !important;
          }
          
          .leave-button {
            position: fixed !important;
            bottom: 30px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            z-index: 1002 !important;
            padding: 12px 24px !important;
            border-radius: 24px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default ZegoRoom; 