export type Message = {
  id: number;
  text: string;
  sender: "user" | "ai";
  /** Unix ms for message time display */
  sentAt?: number;
  audioBase64?: string;
  audioMimeType?: string;
};
