import React, { useEffect, useRef } from "react";
import io from "socket.io-client";

function AudioChat({ socket, room, isConnected }) {
  const localAudioRef = useRef(null);
  const audioSenderRef = useRef(null);

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
              socket.emit("iceCandidate", event.candidate, room);
            }
          };

          socket.on("iceCandidate", (candidate, room) => {
            audioSenderRef.current.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          });

          socket.on("call", (offer, room) => {
            audioSenderRef.current.setRemoteDescription(
              new RTCSessionDescription(offer)
            );

            audioSenderRef.current
              .createAnswer()
              .then((answer) => {
                audioSenderRef.current.setLocalDescription(answer);
                socket.emit("answer", answer, room);
              })
              .catch((error) => {
                console.error("Error creating answer:", error);
              });
          });

          socket.on("answer", (answer, room) => {
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
    <audio
      key={room}
      ref={localAudioRef}
      autoPlay
      controls
      muted={!isConnected}
    />
  );
}

export default AudioChat;
