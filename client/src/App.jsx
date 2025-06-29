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
  const [initiative, setInitiative] = useState([]);
  const stageRef = useRef();
  const map = useImage(mapUrl);

  useEffect(() => {
    socket.emit('join', sessionId);
    const onInit = (state) => {
      setMapUrl(state.map);
      setTokens(state.tokens || []);
      setInitiative(state.initiative || []);
    };
    const onMap = (url) => setMapUrl(url);
    const onToken = (token) => {
      setTokens((tks) => {
        const idx = tks.findIndex((t) => t.id === token.id);
        if (idx === -1) return [...tks, token];
        const copy = [...tks];
        copy[idx] = token;
        return copy;
      });
    };
    const onRemove = (id) => {
      setTokens((tks) => tks.filter(t => t.id !== id));
    };
    const onInitUpdate = (order) => setInitiative(order);

    socket.on('session:init', onInit);
    socket.on('map:update', onMap);
    socket.on('token:update', onToken);
    socket.on('token:remove', onRemove);
    socket.on('initiative:update', onInitUpdate);

    return () => {
      socket.off('session:init', onInit);
      socket.off('map:update', onMap);
      socket.off('token:update', onToken);
      socket.off('token:remove', onRemove);
      socket.off('initiative:update', onInitUpdate);
    };
  }, [sessionId]);

  const handleDragEnd = (e, id) => {
    const token = tokens.find(t => t.id === id);
    const newToken = { ...token, x: e.target.x(), y: e.target.y() };
    socket.emit('token:update', { sessionId, token: newToken });
  };

  const handleMapUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('map', file);
    const res = await fetch(`/api/session/${sessionId}/map`, {
      method: 'POST',
      body: form
    });
    const data = await res.json();
    setMapUrl(data.url);
  };

  const genId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

  const handleAddToken = () => {
    const token = {
      id: genId(),
      name: `Token ${tokens.length + 1}`,
      x: 100 + tokens.length * 30,
      y: 100,
      initiative: 0
    };
    socket.emit('token:update', { sessionId, token });
    updateOrder([...tokens, token]);
  };

  const handleInitiativeChange = (id, value) => {
    const token = tokens.find(t => t.id === id);
    const newToken = { ...token, initiative: Number(value) };
    socket.emit('token:update', { sessionId, token: newToken });
    updateOrder([...tokens.map(t => t.id === id ? newToken : t)]);
  };

  const updateOrder = (updatedTokens) => {
    const sorted = [...updatedTokens].sort((a, b) => b.initiative - a.initiative).map(t => t.id);
    socket.emit('initiative:update', { sessionId, order: sorted });
  };

  const handleNextTurn = () => {
    socket.emit('initiative:next', sessionId);
  };

  useEffect(() => {
    const ids = tokens.map(t => t.id);
    if (ids.some(id => !initiative.includes(id))) {
      updateOrder(tokens);
    }
  }, [tokens]);

  return (
    <div>
      <h1>Virtual Tabletop</h1>
      <div style={{ marginBottom: 10 }}>
        <input type="file" accept="image/*" onChange={handleMapUpload} />
        <button onClick={handleAddToken}>Add Token</button>
        <button onClick={handleNextTurn}>Next Turn</button>
      </div>
      <Stage width={800} height={600} ref={stageRef} style={{ border: '1px solid black' }}>
        <Layer>
          {map && <KonvaImage image={map} x={0} y={0} />}
          {tokens.map(token => (
            <Circle key={token.id} x={token.x} y={token.y} radius={20} fill="red" draggable onDragEnd={(e) => handleDragEnd(e, token.id)} />
          ))}
        </Layer>
      </Stage>
      <h2>Initiative</h2>
      <ul>
        {initiative.map(id => {
          const t = tokens.find(tok => tok.id === id);
          if (!t) return null;
          return (
            <li key={id}>
              {t.name}
              <input
                type="number"
                value={t.initiative || 0}
                onChange={(e) => handleInitiativeChange(id, e.target.value)}
                style={{ width: 40, marginLeft: 8 }}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
