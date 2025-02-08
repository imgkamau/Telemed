import { useEffect, useRef, useState } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';

interface ZegoRoomProps {
  roomId: string;
  userId: string;
  userName: string;
}

function ZegoRoom({ roomId, userId, userName }: ZegoRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const zegoRef = useRef<any>(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;

    const initZego = async () => {
      try {
        if (!containerRef.current) return;

        // Mobile-specific styles
        containerRef.current.style.width = '100%';
        containerRef.current.style.height = '100vh';
        containerRef.current.style.position = 'fixed';
        containerRef.current.style.top = '0';
        containerRef.current.style.left = '0';
        containerRef.current.style.zIndex = '1000';

        // Debug logs
        console.log('Zego Init:', {
          appID: process.env.NEXT_PUBLIC_ZEGO_APP_ID,
          roomId,
          userId,
          userName
        });

        const appID = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID!);
        const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET!;
        
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID,
          serverSecret,
          roomId,
          userId,
          userName
        );

        console.log('Generated Token:', kitToken);

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
          turnOnMicrophoneWhenJoining: true,
          turnOnCameraWhenJoining: true,
          showMyCameraToggleButton: true,
          showMyMicrophoneToggleButton: true,
          showAudioVideoSettingsButton: true,
          showPreJoinView: true,
          showTextChat: true,
          maxUsers: 2,
          layout: "Auto",
          onLeaveRoom: async () => {
            try {
              // Update consultation status
              if (!db) throw new Error('Database not initialized');
              const consultationRef = doc(db, 'consultations', roomId);
              await updateDoc(consultationRef, {
                status: 'completed',
                endTime: new Date()
              });

              // Redirect based on user role
              if (user?.role === 'doctor') {
                router.push('/doctor/dashboard');
              } else {
                router.push('/patient/dashboard');
              }
            } catch (e) {
              console.error('Error updating consultation status:', e);
              // Still redirect even if update fails
              if (user?.role === 'doctor') {
                router.push('/doctor/dashboard');
              } else {
                router.push('/patient/dashboard');
              }
            }
          }
        });
      } catch (error) {
        console.error('Error initializing Zego:', error);
        if (mounted) {
          setError(error instanceof Error ? error.message : 'Failed to initialize video call');
        }
      }
    };

    initZego();

    return () => {
      mounted = false;
      if (zegoRef.current) {
        try {
          zegoRef.current.destroy();
        } catch (e) {
          console.error('Cleanup error:', e);
        }
      }
    };
  }, [roomId, userId, userName, router, user?.role]);

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        Error: {error}. Please refresh the page to try again.
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
        }
      `}</style>
    </div>
  );
}

export default ZegoRoom;