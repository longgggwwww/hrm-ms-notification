export interface ZaloWebhookMessageDto {
  app_id: string;
  user_id_by_app: string;
  oa_id: string;
  timestamp: string;
  event_name: string;
  message: {
    text?: string;
    msg_id: string;
    attachments?: Array<{
      type: string;
      payload: {
        url?: string;
        thumbnail?: string;
        description?: string;
        title?: string;
        coordinates?: {
          latitude: number;
          longitude: number;
        };
      };
    }>;
  };
  sender: {
    id: string;
  };
  recipient: {
    id: string;
  };
  group_info?: {
    group_id: string;
    group_name: string;
    group_type: string;
  };
}

export interface ZaloWebhookEventDto {
  app_id: string;
  timestamp: string;
  data: ZaloWebhookMessageDto[];
}

export interface ZaloWebhookVerificationDto {
  verifyToken: string;
  challenge: string;
}
