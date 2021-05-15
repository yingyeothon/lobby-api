// This should be the form of {[key: string]: string}
// due to pass via `event.requestContext.authorizer`.
export default interface Authorization {
  name: string;
  email: string;
  application: string;
}
