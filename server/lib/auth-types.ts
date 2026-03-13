export type OidcLoginState = {
  state: string;
  nonce: string;
  codeVerifier: string;
  connection?: string;
};

export type UserSessionPayload = {
  sid: string;
  userId: string;
};
