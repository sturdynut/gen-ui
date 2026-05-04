import { useState, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Nav } from './components/Nav';
import { ApiKeyGate } from './components/ApiKeyGate';
import { Chat } from './pages/Chat';
import { Dashboard } from './pages/Dashboard';
import { Wizard } from './pages/Wizard';

const STORAGE_KEY = 'genui_demo_api_key';

function loadKey(): string | null {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

function saveKey(key: string) {
  try { localStorage.setItem(STORAGE_KEY, key); } catch { /* ignore */ }
}

function clearKey() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

export default function App() {
  const [apiKey, setApiKey] = useState<string | null>(loadKey);

  const handleKey = useCallback((key: string) => {
    saveKey(key);
    setApiKey(key);
  }, []);

  const handleClearKey = useCallback(() => {
    clearKey();
    setApiKey(null);
  }, []);

  if (!apiKey) {
    return <ApiKeyGate onKey={handleKey} />;
  }

  return (
    <div className="app">
      <Nav onClearKey={handleClearKey} />
      <main className="app-main">
        <Routes>
          <Route path="/"          element={<Chat      apiKey={apiKey} />} />
          <Route path="/dashboard" element={<Dashboard apiKey={apiKey} />} />
          <Route path="/wizard"    element={<Wizard    apiKey={apiKey} />} />
        </Routes>
      </main>
    </div>
  );
}
