export interface LobbyMatchRequest {
  type: "match";
  application: string;
}

export interface LobbyMatchResponse {
  type: "match";
  url: string;
  gameId: string;
  playerId: string;
}

export type LobbyRequest = LobbyMatchRequest;
export type LobbyResponse = LobbyMatchResponse;
