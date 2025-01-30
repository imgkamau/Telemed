declare module 'africastalking' {
  interface SMS {
    send: (options: {
      to: string;
      message: string;
      from?: string;
    }) => Promise<any>;
  }

  interface AfricasTalking {
    SMS: SMS;
  }

  export default function(config: {
    apiKey: string;
    username: string;
  }): AfricasTalking;
} 