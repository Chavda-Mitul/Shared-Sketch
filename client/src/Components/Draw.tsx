import { useState, useRef, useEffect } from "react";
import { Stage, Layer, Line, Text } from "react-konva";
import { io } from "socket.io-client";
import { clearAll } from "./utils/utility";
import { sendRoomName } from "./utils/utility";
type LineData = {
  tool: string;
  points: number[];
  color: string;
};

const Draw = () => {
  const [tool, setTool] = useState<string>("pen");
  const [lines, setLines] = useState<LineData[]>([]);
  const stageRef = useRef<any>(null);
  const isDrawing = useRef<boolean>(false);
  const touchRef = useRef<any>(null); // Ref to keep track of touch events
  const socket = useRef<any>(null);
  const [color, setColor] = useState("#000000");
  const [penSize, setPenSize] = useState<number>(4);
  const [room, setRoom] = useState("");
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const handleMouseDown = () => {
    isDrawing.current = true;
    const stage = stageRef.current;
    const pos = stage.getPointerPosition();
    const newLine = { tool, points: [pos.x, pos.y], color };
    setLines((prevLines) => [...prevLines, newLine]);
  };

  const handleMouseMove = () => {
    if (!isDrawing.current) {
      return;
    }
    const stage = stageRef.current;
    const point = stage.getPointerPosition();
    const lastLine = lines[lines.length - 1];
    const updatedLastLine = {
      ...lastLine,
      points: lastLine.points
        ? lastLine.points.concat([point.x, point.y])
        : [point.x, point.y],
    };
    const updatedLines = [...lines];
    updatedLines.splice(lines.length - 1, 1, updatedLastLine);
    setLines(updatedLines);
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    socket.current.emit("drawing", lines, room);
  };

  // Event handlers for touch events
  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    touchRef.current = e.touches[0];
    const stage = stageRef.current;
    const pos = stage.getPointerPosition();
    const newLine = { tool, points: [pos.x, pos.y], color };
    setLines((prevLines) => [...prevLines, newLine]);
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (!touchRef.current) {
      return;
    }
    const stage = stageRef.current;
    const point = stage.getPointerPosition();
    const lastLine = lines[lines.length - 1];
    const updatedLastLine = {
      ...lastLine,
      points: lastLine.points
        ? lastLine.points.concat([point.x, point.y])
        : [point.x, point.y],
    };
    const updatedLines = [...lines];
    updatedLines.splice(lines.length - 1, 1, updatedLastLine);
    setLines(updatedLines);
  };

  const handleTouchEnd = () => {
    touchRef.current = null;
    socket.current.emit("drawing", lines, room);
  };

  useEffect(() => {
    socket.current = io("https://server1-zfqe.onrender.com");
    // socket.current = io("http://localhost:3000");
    socket.current.on("drawing", (syncLines: LineData[]) => {
      setLines(syncLines);
    });
    return () => {
      socket.current.disconnect();
    };
  }, []);

  useEffect(() => {
    // Add event listeners for touch events
    const stage = stageRef.current;
    stage.addEventListener("touchstart", handleTouchStart);
    stage.addEventListener("touchmove", handleTouchMove);
    stage.addEventListener("touchend", handleTouchEnd);
    return () => {
      // Remove event listeners on component unmount
      stage.removeEventListener("touchstart", handleTouchStart);
      stage.removeEventListener("touchmove", handleTouchMove);
      stage.removeEventListener("touchend", handleTouchEnd);
    };
  }, [lines]);

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          background: "#BEDA",
        }}
      >
        <select
          value={tool}
          onChange={(e) => {
            setTool(e.target.value);
          }}
          style={{ margin: "5px" }}
        >
          <option value="pen">Pen</option>
          <option value="eraser">Eraser</option>
        </select>
        <select
          value={penSize}
          style={{ margin: "5px" }}
          onChange={(e) => {
            setPenSize(Number(e.target.value));
          }}
        >
          <option value={10}>10</option>
          <option value={20}>15</option>
        </select>

        <input
          type="color"
          id="colorpicker"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <button
          style={{ margin: "5px" }}
          onClick={() => clearAll(socket, lines, room)}
        >
          Clear
        </button>
        <input
          type="text"
          value={room}
          style={{ margin: "5px" }}
          onChange={(e) => setRoom(e.target.value)}
        />
        <button
          style={{ margin: "5px" }}
          onClick={() => sendRoomName(socket, setIsConnected, room)}
        >
          connect
        </button>
      </div>
      <div>
        <Stage
          width={window.innerWidth}
          height={window.innerHeight}
          ref={stageRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <Layer>
            <Text text="Just start drawing" x={650} y={30} />
            {lines.map((line, i) => (
              <Line
                key={i}
                points={line.points}
                stroke={line.color}
                strokeWidth={penSize}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={
                  line.tool === "eraser" ? "destination-out" : "source-over"
                }
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </>
  );
};

export default Draw;
