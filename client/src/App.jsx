import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Circle } from 'react-konva';
import io from 'socket.io-client';

const socket = io();

function useImage(url) {
  const [image, setImage] = useState(null);
  useEffect(() => {
    if (!url) return;
    const img = new window.Image();
    img.src = url;
    img.onload = () => setImage(img);
  }, [url]);
  return image;
}

export default function App() {
  const [sessionId, setSessionId] = useState('demo');
  const [mapUrl, setMapUrl] = useState(null);
  const [tokens, setTokens] = useState([]);
  const stageRef = useRef();
  const map = useImage(mapUrl);

  useEffect(() => {
    socket.emit('join', sessionId);
    socket.on('session:init', (state) => {
      setMapUrl(state.map);
      setTokens(state.tokens || []);
    });
    socket.on('map:update', (url) => setMapUrl(url));
    socket.on('token:update', (token) => {
      setTokens((tks) => {
        const idx = tks.findIndex((t) => t.id === token.id);
        if (idx === -1) return [...tks, token];
        const copy = [...tks];
        copy[idx] = token;
        return copy;
      });
    });
    socket.on('token:remove', (id) => {
      setTokens((tks) => tks.filter(t => t.id !== id));
    });
  }, [sessionId]);

  const handleDragEnd = (e, id) => {
    const token = tokens.find(t => t.id === id);
    const newToken = { ...token, x: e.target.x(), y: e.target.y() };
    socket.emit('token:update', { sessionId, token: newToken });
  };

  return (
    <div>
      <h1>Virtual Tabletop</h1>
      <Stage width={800} height={600} ref={stageRef} style={{ border: '1px solid black' }}>
        <Layer>
          {map && <KonvaImage image={map} x={0} y={0} />}
          {tokens.map(token => (
            <Circle key={token.id} x={token.x} y={token.y} radius={20} fill="red" draggable onDragEnd={(e) => handleDragEnd(e, token.id)} />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
