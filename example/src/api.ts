import { Region } from "./region";

const base = "https://oss-token-server.netless.link";

function makeURL(path: string, query: Record<string, string>) {
  const q = new URLSearchParams(query);
  return `${base}${path}?${q.toString()}`;
}

async function post(path: string, query: Record<string, string>) {
  const r = await fetch(makeURL(path, query), { method: "POST" });
  if (r.ok) {
    return await r.json();
  }
  const message = await r.text();
  try {
    throw new Error(message);
  } finally {
    alert(message);
  }
}

export interface RoomInfo {
  roomUUID: string;
  roomToken: string;
  region: Region;
}

export function createRoom(region: Region): Promise<RoomInfo> {
  return post("/room/create", { region });
}

export function joinRoom(uuid: string, region: Region): Promise<RoomInfo> {
  return post("/room/join", { uuid, region });
}
