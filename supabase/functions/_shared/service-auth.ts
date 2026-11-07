/** Raw message dispatch is a server capability, not a signed-in user capability. */
export function isServiceRequest(request: Request, serviceKey: string | undefined): boolean {
  if (!serviceKey) return false;
  const match = /^Bearer\s+(\S+)\s*$/i.exec(request.headers.get("authorization") ?? "");
  const credential = match?.[1] ?? "";
  if (credential.length !== serviceKey.length) return false;
  let difference = 0;
  for (let i = 0; i < serviceKey.length; i++) difference |= credential.charCodeAt(i) ^ serviceKey.charCodeAt(i);
  return difference === 0;
}
