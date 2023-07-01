import { useState, useRef, useEffect } from "react";
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
  const [color, setColor] = useState("#000000");
  const [penSize, setPenSize] = useState<number>(4);
  const [room, setRoom] = useState("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  // --
  const localAudioRef = useRef(null);
  const audioSenderRef = useRef(null);
  // --
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
  const sendRoomName = (room: string) => {
    socket.current.emit("joinRoom", room);
    setIsConnected(true);
  };
  const clearAll = () => {
    socket.current.emit("clear", lines, room);
  };

  useEffect(() => {
    socket.current = io("https://server1-zfqe.onrender.com");
    return () => {
      socket.current.disconnect();
    };
  }, []);

  useEffect(() => {
    socket.current.on("drawing", (syncLines: LineData[]) => {
      setLines(syncLines);
    });
  }, []);

  useEffect(() => {
    let stream;

    const createAudioConnection = () => {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((mediaStream) => {
          stream = mediaStream;

          const audioTracks = stream.getAudioTracks();
          audioSenderRef.current = new RTCPeerConnection();

          audioTracks.forEach((track) => {
            audioSenderRef.current.addTrack(track, stream);
          });

          audioSenderRef.current.onicecandidate = (event) => {
            if (event.candidate) {
              socket.current.emit("iceCandidate", event.candidate, room);
            }
          };

          socket.current.on("iceCandidate", (candidate, room) => {
            console.log("Received ice candidate:", candidate);
            audioSenderRef.current.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          });

          socket.current.on("call", (offer, room) => {
            console.log("Received call offer:", offer);
            audioSenderRef.current.setRemoteDescription(
              new RTCSessionDescription(offer)
            );

            audioSenderRef.current
              .createAnswer()
              .then((answer) => {
                audioSenderRef.current.setLocalDescription(answer);
                socket.current.emit("answer", answer, room);
              })
              .catch((error) => {
                console.error("Error creating answer:", error);
              });
          });

          socket.current.on("answer", (answer, room) => {
            audioSenderRef.current.setRemoteDescription(
              new RTCSessionDescription(answer)
            );
          });

          localAudioRef.current.srcObject = stream;
        })
        .catch((error) => {
          console.error("Error accessing microphone:", error);
        });
    };

    const cleanupAudioConnection = () => {
      if (audioSenderRef.current) {
        audioSenderRef.current.close();
        audioSenderRef.current = null;
      }

      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
        stream = null;
      }
    };

    if (audioSenderRef.current && room) {
      cleanupAudioConnection();
    }

    if (room) {
      createAudioConnection();
    }

    return () => {
      cleanupAudioConnection();
    };
  }, [room]);

  return (
    <div style={{ border: "2px solid red" }}>
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
        value={penSize}
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
      <input
        type="text"
        value={room}
        onChange={(e) => setRoom(e.target.value)}
      />
      <button onClick={() => sendRoomName(room)}>connect</button>
      <button onClick={clearAll}>Clear</button>
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
      {socket.current && (
        <audio
          key={room}
          ref={localAudioRef}
          autoPlay
          controls
          muted={!isConnected}
        />
      )}
    </div>
  );
};

export default Draw;
