import React, { useEffect, useRef } from "react";
import io from "socket.io-client";

function AudioChat({ socket, room, isConnected }) {
  const localAudioRef = useRef(null);

  useEffect(() => {
    let stream;

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((mediaStream) => {
        stream = mediaStream;

        const audioTracks = stream.getAudioTracks();
        const audioSender = new RTCPeerConnection();

        audioTracks.forEach((track) => {
          audioSender.addTrack(track, stream);
        });

        audioSender.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("iceCandidate", event.candidate, room);
          }
        };

        socket.on("iceCandidate", (candidate, room) => {
          audioSender.addIceCandidate(new RTCIceCandidate(candidate));
        });

        socket.on("call", (offer, room) => {
          audioSender.setRemoteDescription(new RTCSessionDescription(offer));

          audioSender
            .createAnswer()
            .then((answer) => {
              audioSender.setLocalDescription(answer);
              socket.emit("answer", answer, room);
            })
            .catch((error) => {
              console.error("Error creating answer:", error);
            });
        });

        socket.on("answer", (answer, room) => {
          audioSender.setRemoteDescription(new RTCSessionDescription(answer));
        });

        localAudioRef.current.srcObject = stream;
      })
      .catch((error) => {
        console.error("Error accessing microphone:", error);
      });

    return () => {
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

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
