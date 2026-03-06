export type Message = {
  id: number;
  text: string;
  sender: "user" | "ai";
  audioBase64?: string;
  audioMimeType?: string;
};
