export type OidcLoginState = {
  state: string;
  nonce: string;
  codeVerifier: string;
  connection?: string;
  returnTo?: string;
};

export type UserSessionPayload = {
  sid: string;
  userId: string;
};
