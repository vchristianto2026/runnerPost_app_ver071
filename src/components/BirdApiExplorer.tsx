import React, { useState, useEffect } from 'react';
import {
  Radio,
  ExternalLink,
  Code2,
  Terminal,
  Copy,
  Check,
  RefreshCw,
  Cpu,
  Layers,
} from 'lucide-react';

export const BirdApiExplorer: React.FC = () => {
  const [activeEndpoint, setActiveEndpoint] = useState<
    '/api/bird' | '/api/bird/messages' | '/api/bird/transmissions' | '/api/bird/logs' | '/api/bird/openapi.json'
  >('/api/bird/transmissions');
  const [jsonResponse, setJsonResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchEndpoint = async (url: string) => {
    setLoading(true);
    try {
      const res = await fetch(url);
      const data = await res.json();
      setJsonResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setJsonResponse(JSON.stringify({ error: 'Failed to fetch Bird API endpoint', details: String(err) }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEndpoint(activeEndpoint);
  }, [activeEndpoint]);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const curlCommand = `curl -X GET "${window.location.origin}${activeEndpoint}" \\
  -H "Accept: application/json" \\
  -H "X-Client: bird-api-evangelist-monitor"`;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-[#FAF8F3] border border-[#E4DEC9] rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-purple-700 animate-pulse" />
              <h2 className="text-xl font-serif-royal font-semibold text-[#1C1F26]">
                Bird API Monitoring &amp; Telemetry Gateway
              </h2>
            </div>
            <p className="text-xs text-[#6F675A] mt-1">
              Compliant with the API Evangelist Bird specification (
              <a
                href="https://github.com/api-evangelist/bird"
                target="_blank"
                rel="noreferrer"
                className="underline text-amber-900 hover:text-amber-950 inline-flex items-center gap-0.5"
              >
                https://github.com/api-evangelist/bird
                <ExternalLink className="w-3 h-3" />
              </a>
              ) for seamless message transmission monitoring and logging.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono-code px-2.5 py-1 rounded-md bg-purple-100 text-purple-900 border border-purple-300">
              CHANNEL: human_runner
            </span>
          </div>
        </div>
      </div>

      {/* Endpoint Selector Tabs */}
      <div className="bg-white rounded-xl border border-[#DDD6C8] p-3 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveEndpoint('/api/bird/transmissions')}
            className={`text-xs px-3 py-1.5 rounded-lg font-mono-code transition ${
              activeEndpoint === '/api/bird/transmissions'
                ? 'bg-[#1C1F26] text-white font-bold'
                : 'text-[#6F675A] hover:bg-[#F3EFE7]'
            }`}
          >
            GET /api/bird/transmissions
          </button>

          <button
            onClick={() => setActiveEndpoint('/api/bird/messages')}
            className={`text-xs px-3 py-1.5 rounded-lg font-mono-code transition ${
              activeEndpoint === '/api/bird/messages'
                ? 'bg-[#1C1F26] text-white font-bold'
                : 'text-[#6F675A] hover:bg-[#F3EFE7]'
            }`}
          >
            GET /api/bird/messages
          </button>

          <button
            onClick={() => setActiveEndpoint('/api/bird/logs')}
            className={`text-xs px-3 py-1.5 rounded-lg font-mono-code transition ${
              activeEndpoint === '/api/bird/logs'
                ? 'bg-[#1C1F26] text-white font-bold'
                : 'text-[#6F675A] hover:bg-[#F3EFE7]'
            }`}
          >
            GET /api/bird/logs
          </button>

          <button
            onClick={() => setActiveEndpoint('/api/bird')}
            className={`text-xs px-3 py-1.5 rounded-lg font-mono-code transition ${
              activeEndpoint === '/api/bird'
                ? 'bg-[#1C1F26] text-white font-bold'
                : 'text-[#6F675A] hover:bg-[#F3EFE7]'
            }`}
          >
            GET /api/bird (Index)
          </button>

          <button
            onClick={() => setActiveEndpoint('/api/bird/openapi.json')}
            className={`text-xs px-3 py-1.5 rounded-lg font-mono-code transition ${
              activeEndpoint === '/api/bird/openapi.json'
                ? 'bg-[#1C1F26] text-white font-bold'
                : 'text-[#6F675A] hover:bg-[#F3EFE7]'
            }`}
          >
            GET /api/bird/openapi.json
          </button>
        </div>

        <button
          onClick={() => fetchEndpoint(activeEndpoint)}
          className="text-xs px-2.5 py-1.5 rounded-lg border border-[#DDD6C8] bg-[#FAF8F3] hover:bg-[#EFECE2] text-[#3D362B] transition flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Execute Request
        </button>
      </div>

      {/* cURL Snippet */}
      <div className="bg-[#1C1F26] text-[#E5E0D5] rounded-xl p-4 font-mono-code text-xs space-y-2 shadow-xs">
        <div className="flex items-center justify-between text-[#8E97A6] border-b border-[#303744] pb-2 text-[11px]">
          <span className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" />
            cURL Terminal Call
          </span>
          <span>HTTP 1.1 / JSON</span>
        </div>
        <div className="text-amber-200 overflow-x-auto whitespace-pre">{curlCommand}</div>
      </div>

      {/* Live JSON Response Viewer */}
      <div className="bg-white rounded-xl border border-[#DDD6C8] overflow-hidden shadow-xs">
        <div className="bg-[#FAF8F3] px-4 py-2.5 border-b border-[#E8E2D5] flex items-center justify-between text-xs font-mono-code">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1C1F26]">{activeEndpoint}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
              200 OK
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-[#DDD6C8] text-[#554E44] hover:bg-[#F6F4EE] transition"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy JSON</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-4 bg-[#FAF9F5] text-[#1E232A] text-xs font-mono-code overflow-x-auto max-h-[500px] leading-relaxed">
          {loading ? 'Transmitting request to Bird API gateway...' : jsonResponse}
        </pre>
      </div>

      {/* Explanation of Bird API & Avian/Human Network */}
      <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E0DACD] text-xs text-[#554E41] space-y-2">
        <h4 className="font-serif-royal font-semibold text-sm text-[#1C1F26] flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-amber-800" />
          <span>Integration Architecture Note</span>
        </h4>
        <p className="leading-relaxed">
          The Bird API specification standardizes messaging channels. In runnerPost, the transmission channel is classified as <code>human_runner</code> (with velocities strictly bound to 8.0–12.0 km/h). Telemetry monitors track speed, terrain degradation, waypoint clearing, and automatic ephemeral cryptographic destructions in real time.
        </p>
      </div>
    </div>
  );
};
