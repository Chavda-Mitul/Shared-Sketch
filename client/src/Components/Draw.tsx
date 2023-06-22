import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Line, Text } from "react-konva";
import { io } from "socket.io-client";

const Draw = () => {
  const [tool, setTool] = useState<string>("pen");
  const [lines, setLines] = useState<any[]>([]);
  const [lines_, setLines_] = useState<any[]>([]);
  const stageRef = useRef<any>(null);
  const isDrawing = useRef<boolean>(false);
  const socket = useRef<any>(null);

  const handleMouseDown = () => {
    isDrawing.current = true;
    const stage = stageRef.current;
    const pos = stage.getPointerPosition();
    const newLine = { tool, points: [pos.x, pos.y] };
    setLines((prevLines) => [...prevLines, newLine]);
    // socket.current.emit("draw", newLine);
    // console.log("down", lines);
    // console.log(newLine);
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
    // console.log("updated", lines);
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    console.log("lines up", lines);
    socket.current.emit("drawing", lines);
  };

  useEffect(() => {
    socket.current = io("http://localhost:3000");

    return () => {
      socket.current.disconnect();
    };
  }, []);
  useEffect(() => {
    socket.current.on("drawing", (syncLines: any[]) => {
      setLines(syncLines);
    });
    console.log("line updated ", lines);
  }, [lines]);

  return (
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
          <Text text="Just start drawing" x={5} y={30} />
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke="#df4b26"
              strokeWidth={5}
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
      <select
        value={tool}
        onChange={(e) => {
          setTool(e.target.value);
        }}
      >
        <option value="pen">Pen</option>
        <option value="eraser">Eraser</option>
      </select>
    </div>
  );
};

export default Draw;
