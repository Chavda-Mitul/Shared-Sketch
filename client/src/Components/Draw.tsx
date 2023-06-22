import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Line, Text } from "react-konva";
import { io } from "socket.io-client";

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
  const socket = useRef<any>(null);
  const [color, setColor] = useState("black");

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
    socket.current.emit("drawing", lines);
  };

  useEffect(() => {
    socket.current = io("http://localhost:3000");

    return () => {
      socket.current.disconnect();
    };
  }, []);

  useEffect(() => {
    socket.current.on("drawing", (syncLines: LineData[]) => {
      setLines(syncLines);
    });
  }, []);

  return (
    <div>
      <select
        value={tool}
        onChange={(e) => {
          setTool(e.target.value);
        }}
      >
        <option value="pen">Pen</option>
        <option value="eraser">Eraser</option>
      </select>
      <select
        value={color}
        onChange={(e) => {
          setColor(e.target.value);
        }}
      >
        <option value="black">Black</option>
        <option value="red">Red</option>
        <option value="green">Green</option>
      </select>
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        ref={stageRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer>
          <Text text="Just start drawing" x={5} y={30} />
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke={line.color}
              strokeWidth={4}
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
  );
};

export default Draw;
