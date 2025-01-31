import { useEffect, useRef, useState } from 'react';

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

        const { ZegoUIKitPrebuilt } = await import('@zegocloud/zego-uikit-prebuilt');
        const appID = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID!);
        const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET!;
        
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID,
          serverSecret,
          roomId,
          userId,
          userName
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zegoRef.current = zp;

        zp.joinRoom({
          container: containerRef.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall,
            config: {
              role: ZegoUIKitPrebuilt.Host
            },
          },
          preJoinViewConfig: {
            title: 'Telemedicine Consultation'
          },
          showPreJoinView: false,
          showRoomTimer: true,
          showLeavingView: true,
          turnOnMicrophoneWhenJoining: true,
          turnOnCameraWhenJoining: true,
          showMyMicrophoneToggleButton: true,
          showMyCameraToggleButton: true,
          showAudioVideoSettingsButton: true,
          showTextChat: true,
          maxUsers: 2,
          layout: "Auto",
          showScreenSharingButton: false,
          showUserList: false,
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

  return <div ref={containerRef} style={{ width: '100%', height: '600px' }} />;
}

export default ZegoRoom; 