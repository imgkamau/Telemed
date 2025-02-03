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
  const [audioTestResult, setAudioTestResult] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initZego = async () => {
      try {
        if (!containerRef.current) return;

        // Add mobile-specific styles
        containerRef.current.style.width = '100%';
        containerRef.current.style.height = '100vh';
        containerRef.current.style.position = 'fixed';
        containerRef.current.style.top = '0';
        containerRef.current.style.left = '0';
        containerRef.current.style.zIndex = '1000';

        // Test audio devices
        const audioContext = new AudioContext();
        const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = audioContext.createMediaStreamSource(mediaStream);
        const analyser = audioContext.createAnalyser();
        source.connect(analyser);
        
        // Check if audio is being received
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const audioDetected = dataArray.some(value => value > 0);
        
        if (audioDetected) {
          console.log('Audio input detected and working');
        } else {
          console.warn('No audio input detected');
        }

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
          layout: "Auto"
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
  }, [roomId, userId, userName]);

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
      `}</style>
    </div>
  );
}

export default ZegoRoom; 