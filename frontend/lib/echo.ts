import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Make Pusher available globally
if (typeof window !== 'undefined') {
  (window as any).Pusher = Pusher;
}

let echoInstance: Echo<any> | null = null;

export const initEcho = (): Echo<any> => {
  if (!echoInstance && typeof window !== 'undefined') {
    console.log('🔌 Initializing Laravel Echo...');
    
    echoInstance = new Echo({
      broadcaster: 'pusher',
      key: process.env.NEXT_PUBLIC_SOKETI_KEY || 'app-key',
      wsHost: process.env.NEXT_PUBLIC_SOKETI_HOST || 'localhost',
      wsPort: parseInt(process.env.NEXT_PUBLIC_SOKETI_PORT || '6001'),
      wssPort: parseInt(process.env.NEXT_PUBLIC_SOKETI_PORT || '6001'),
      forceTLS: false,
      encrypted: false,
      disableStats: true,
      enabledTransports: ['ws', 'wss'],
      cluster: process.env.NEXT_PUBLIC_SOKETI_CLUSTER || 'mt1',
      authEndpoint: `${process.env.NEXT_PUBLIC_LARAVEL_BASE_URL || 'http://localhost'}/broadcasting/auth`,
    });

    // Connection events
    echoInstance.connector.pusher.connection.bind('connected', () => {
      console.log('✅ WebSocket connected to Soketi');
    });

    echoInstance.connector.pusher.connection.bind('disconnected', () => {
      console.log('❌ WebSocket disconnected');
    });

    echoInstance.connector.pusher.connection.bind('error', (err: any) => {
      console.error('❌ WebSocket error:', err);
    });

    echoInstance.connector.pusher.connection.bind('state_change', (states: any) => {
      console.log('🔄 WebSocket state:', states.current);
    });
  }

  return echoInstance!;
};

export const disconnectEcho = () => {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
    console.log('🔌 Echo disconnected');
  }
};

export default initEcho;