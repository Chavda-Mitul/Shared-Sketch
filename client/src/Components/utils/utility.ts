import { Socket } from "socket.io-client";

type LineData = {
  tool: string;
  points: number[];
  color: string;
};
export const clearAll = (
  socket: React.MutableRefObject<Socket>,
  lines: LineData[],
  room: string
) => {
  socket.current.emit("clear", lines, room);
};
export const sendRoomName = (
  socket: React.MutableRefObject<Socket>,
  setIsConnected: React.Dispatch<React.SetStateAction<boolean>>,
  room: string
) => {
  socket.current.emit("joinRoom", room);
  setIsConnected(true);
};
