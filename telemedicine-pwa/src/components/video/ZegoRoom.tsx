import { useEffect, useRef, useState } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

interface ZegoRoomProps {
  roomId: string;
  userId: string;
  userName: string;
}

function ZegoRoom({ roomId, userId, userName }: ZegoRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const zegoRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    const initZego = async () => {
      try {
        if (!containerRef.current) return;

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
          showPreJoinView: true,
          turnOnMicrophoneWhenJoining: false,
          turnOnCameraWhenJoining: false,
          showMyMicrophoneToggleButton: true,
          showMyCameraToggleButton: true,
          showAudioVideoSettingsButton: true,
          showTextChat: true,
          maxUsers: 2,
          layout: "Auto",
          onJoinRoom: () => {
            console.log('Joined room successfully');
          },
          onLeaveRoom: () => {
            console.log('Left room');
            if (zegoRef.current) {
              zegoRef.current.destroy();
            }
          }
        });
      } catch (error) {
        console.error('Zego initialization error:', error);
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
  }, [roomId, userId, userName]);

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        Error: {error}. Please refresh the page to try again.
      </div>
    );
  }

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}

export default ZegoRoom; 