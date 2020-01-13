export interface ILobbyMatchRequest {
  type: "match";
  application: string;
}

export interface ILobbyMatchResponse {
  type: "match";
  url: string;
  gameId: string;
  playerId: string;
}

export type LobbyRequest = ILobbyMatchRequest;
export type LobbyResponse = ILobbyMatchResponse;
