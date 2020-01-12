export interface ILobbyMatchRequest {
  type: "match";
  application: string;
}

export interface ILobbyMatchResponse {
  type: "match";
  url: string;
  gameId: string;
}

export interface ILobbyChatRequest {
  type: "chat";
  application: string;
  text: string;
}

export interface ILobbyChatResponse {
  type: "chat";
  text: string;
}

export type LobbyRequest = ILobbyMatchRequest | ILobbyChatRequest;
export type LobbyResponse = ILobbyMatchResponse | ILobbyChatResponse;
