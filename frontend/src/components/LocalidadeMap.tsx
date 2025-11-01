// src/components/LocalidadeMap.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L, { Map as LeafletMap } from "leaflet";
import { Clock, MapPin, Route, RefreshCw, Info, Crosshair } from "lucide-react";
import { mobilityApi, type Vehicle } from "@/api/mobilityApi";


import "leaflet/dist/leaflet.css";

/* ================================
   ⚙️ CONFIGURAÇÕES
=================================== */
const CAMPUS = { lat: -22.892172, lng: -43.3238892 }; // FAETERJ Quintino
const POLL_MS = 20000; // Atualizar a cada 20s
const WINDOW_SECONDS = 300; // Janela de 5 minutos
const RADIUS_M = 1200; // Raio de 1200 metros
const START_ZOOM = 15; // Zoom inicial

/* ================================
   🧭 FUNÇÕES ÚTEIS
=================================== */
function computeEtaMin(distMeters: number, kmh: number) {
  if (!Number.isFinite(kmh) || kmh < 2) return Infinity;
  const mps = (kmh * 1000) / 3600;
  return distMeters / mps / 60;
}

function formatEta(etaMin: number, kmh: number) {
  if (!Number.isFinite(etaMin)) return kmh < 2 ? "parado" : "—";
  if (etaMin < 0.5) return "< 1 min";
  return `${Math.round(etaMin)} min`;
}

function formatDistance(m?: number) {
  if (!Number.isFinite(m)) return "—";
  if (m! < 1000) return `${Math.round(m!)} m`;
  return `${(m! / 1000).toFixed(1)} km`;
}

/* ================================
   🖼️ ÍCONES DO MAPA
=================================== */
// Ícone do campus com glow
const campusIcon = new L.DivIcon({
  html: `
    <div style="
      position:relative; width:16px; height:16px;
      border-radius:999px; background:#2563eb;
      box-shadow:0 0 0 6px rgba(37,99,235,.25), 0 12px 28px rgba(2,6,23,.28);
      border:1px solid rgba(255,255,255,.45);
    "></div>
  `,
  className: "",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Paleta e hash para cor por linha (visual consistente)
const LINE_COLORS = [
  "#2563EB",
  "#0EA5E9",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
];
function hashLineToColor(linha: string) {
  let h = 0;
  for (let i = 0; i < linha.length; i++) h = (h * 31 + linha.charCodeAt(i)) | 0;
  return LINE_COLORS[Math.abs(h) % LINE_COLORS.length];
}
function hexToRgb(hex: string) {
  const m = hex.replace("#", "");
  const bigint = parseInt(
    m.length === 3
      ? m
          .split("")
          .map((c) => c + c)
          .join("")
      : m,
    16,
  );
  const r = (bigint >> 16) & 255,
    g = (bigint >> 8) & 255,
    b = bigint & 255;
  return { r, g, b };
}

// Ícone de ônibus moderno (pill com gradiente e SVG)
function makeBusIcon(linha: string) {
  const base = hashLineToColor(linha || "-");
  const { r, g, b } = hexToRgb(base);
  const grad = `linear-gradient(135deg, rgba(${r},${g},${b},0.95) 0%, rgba(${r},${g},${b},0.75) 100%)`;

  // SVG minimalista do ônibus (branco)
  const busSvg = `
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="5" y="4" width="14" height="12" rx="2.5" fill="white"/>
    <rect x="7" y="6" width="10" height="5" rx="1" fill="${`rgba(${r},${g},${b},0.28)`}"/>
    <circle cx="8.5" cy="17.5" r="1.5" fill="white"/>
    <circle cx="15.5" cy="17.5" r="1.5" fill="white"/>
  </svg>`;

  const html = `
    <div style="
      display:inline-flex;align-items:center;gap:8px;
      background:${grad};
      color:#fff;border-radius:999px;padding:6px 10px;
      font-weight:700;font-size:12px;line-height:1;
      box-shadow:0 10px 30px rgba(2,6,23,.35);
      border:1px solid rgba(255,255,255,.16);
      backdrop-filter:saturate(140%) blur(4px);
      transform:translateZ(0);
    ">
      <span style="
        display:inline-flex;align-items:center;justify-content:center;
        width:22px;height:22px;border-radius:999px;
        background:rgba(255,255,255,.18);
        border:1px solid rgba(255,255,255,.24);
      ">${busSvg}</span>
      <span style="letter-spacing:.2px">${linha || "-"}</span>
    </div>`;

  return new L.DivIcon({
    html,
    className: "",
    iconSize: [64, 32],
    iconAnchor: [32, 16],
  });
}

/* ================================
   📊 TIPOS
=================================== */
type LineSummary = {
  linha: string;
  etaMin: number;
  vehicles: number;
};

/* ================================
   🧩 SUBCOMPONENTES DE UI
=================================== */
function ControlButton({
  title,
  onClick,
  children,
}: React.PropsWithChildren<{ title: string; onClick?: () => void }>) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-background/90 border border-border shadow-lg backdrop-blur-md hover:bg-background transition"
      style={{ boxShadow: "0 10px 26px rgba(2,6,23,.18)" }}
      aria-label={title}
    >
      {children}
    </button>
  );
}

// Binder para garantir o mapRef (funciona em qualquer versão do react-leaflet)
function MapBinder({ onReady }: { onReady: (map: LeafletMap) => void }) {
  const map = useMap();
  React.useEffect(() => {
    onReady(map);
  }, [map, onReady]);
  return null;
}

/* ================================
   🗺️ COMPONENTE PRINCIPAL
=================================== */
export default function LocalidadeMap() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const timerRef = useRef<number | null>(null);

  const mapRef = useRef<LeafletMap | null>(null);

  // Busca dados dos veículos (sem mexer na API)
  useEffect(() => {
    let cancelled = false;

    async function loadVehicles() {
      try {
        if (!cancelled) setError(undefined);
        const data = await mobilityApi.getNearbyVehicles(
          WINDOW_SECONDS,
          RADIUS_M,
          false,
          1,
        );
        if (!cancelled) {
          setVehicles(data);
          setLastUpdated(new Date());
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Falha ao carregar dados");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadVehicles();
    timerRef.current = window.setInterval(loadVehicles, POLL_MS);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      cancelled = true;
    };
  }, []);

  // Processa os dados para exibição
  const { nearbyVehicles, lineSummary } = useMemo(() => {
    const validVehicles = vehicles
      .filter((vehicle) => vehicle.latitude && vehicle.longitude)
      .map((vehicle) => ({
        ...vehicle,
        etaMin: computeEtaMin(vehicle.dist, vehicle.velocidade),
      }))
      .filter((vehicle) => vehicle.dist <= RADIUS_M)
      .sort((a, b) => a.etaMin - b.etaMin);

    // Agrupa por linha para o resumo
    const byLine = new Map<string, LineSummary>();
    for (const vehicle of validVehicles) {
      const current = byLine.get(vehicle.linha);
      if (!current) {
        byLine.set(vehicle.linha, {
          linha: vehicle.linha,
          etaMin: vehicle.etaMin,
          vehicles: 1,
        });
      } else {
        byLine.set(vehicle.linha, {
          linha: vehicle.linha,
          etaMin: Math.min(current.etaMin, vehicle.etaMin),
          vehicles: current.vehicles + 1,
        });
      }
    }

    const summary = Array.from(byLine.values())
      .sort((a, b) => a.etaMin - b.etaMin)
      .slice(0, 14);

    return {
      nearbyVehicles: validVehicles,
      lineSummary: summary,
    };
  }, [vehicles]);

  // Atualização manual
  const handleManualRefresh = async () => {
    try {
      setLoading(true);
      setError(undefined);
      const data = await mobilityApi.getNearbyVehicles(
        WINDOW_SECONDS,
        RADIUS_M,
        false,
        1,
      );
      setVehicles(data);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e?.message ?? "Falha ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  // Centralizar no campus
  const recenterCampus = () => {
    mapRef.current?.setView([CAMPUS.lat, CAMPUS.lng], START_ZOOM, {
      animate: true,
    });
  };

  // Focar uma linha no mapa
  const focusLine = (line: string) => {
    const pts = nearbyVehicles
      .filter((v) => v.linha === line)
      .map((v) => L.latLng(v.latitude, v.longitude));
    if (pts.length > 0) {
      const bounds = L.latLngBounds(pts);
      mapRef.current?.fitBounds(bounds, { padding: [40, 40] });
    }
  };

  return (
    <div className="relative grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_250px] gap-4 md:gap-6 items-start">
      {/* 🔷 Grid: mapa em destaque e painel mais estreito; em telas pequenas empilha */}

      {/* ================== MAPA (maior e com mais destaque) ================== */}
      <div className="relative overflow-hidden rounded-2xl border bg-background shadow-md md:shadow-lg z-0">
        {/* Gradiente decorativo */}
        <div className="absolute inset-x-0 top-0 h-1.5" />

        {/* Cabeçalho do mapa */}
        <div className="px-4 pt-4 pb-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-foreground/80">
            <MapPin className="h-4 w-4 text-indigo-600" />
            <span className="font-semibold">FAETERJ Quintino</span>
          </div>
          {/* Botão desktop (no mobile usamos o flutuante) */}
          <button
            onClick={handleManualRefresh}
            className="hidden md:inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-medium hover:bg-muted text-foreground/80"
            title="Atualizar agora"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Atualizar
          </button>
        </div>

        {/* Área do mapa – mais alta para dar destaque */}
        <div className="relative h-[75vh] md:h-[620px] w-full">
          {/* Legendinha glass */}
          <div className="pointer-events-none absolute left-3 top-3 z-[2]">
            <div
              className="pointer-events-auto backdrop-blur-md bg-background/70 border border-white/60 rounded-xl px-3.5 py-2.5"
              style={{ boxShadow: "0 10px 28px rgba(2,6,23,.12)" }}
            >
              <div className="flex items-center gap-2 text-foreground/80 text-sm font-medium">
                <Info className="h-4 w-4 text-sky-600" />
                Monitoramento
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-indigo-600" />
                  <span>Campus</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-rose-600" />
                  <span>Raio {RADIUS_M} m</span>
                </div>
              </div>
            </div>
          </div>

          {/* Efeito visual topo */}
          <div
            className="pointer-events-none absolute inset-0 z-[1]"
            style={{
              background:
                "radial-gradient(1200px 60% at 10% 0%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 60%)",
            }}
          />

          {/* Skeleton de carregamento */}
          {loading && vehicles.length === 0 && (
            <div className="absolute inset-0 z-[2] animate-pulse bg-gradient-to-br from-slate-100 to-slate-200" />
          )}

          {/* Toast de erro */}
          {error && (
            <div className="absolute right-3 top-3 z-[3]">
              <div className="rounded-xl border border-rose-200/60 bg-rose-50/90 text-rose-800 px-3 py-2 text-sm shadow">
                Erro: {error}
              </div>
            </div>
          )}

          {/* Mapa Leaflet */}
          <MapContainer
            className="!z-0"
            center={[CAMPUS.lat, CAMPUS.lng]}
            zoom={START_ZOOM}
            zoomControl={false}
            scrollWheelZoom={true}
            doubleClickZoom={true}
            touchZoom={true}
            boxZoom={true}
            keyboard={true}
            dragging={true}
            style={{ height: "100%", width: "100%" }}
          >
            {/* Garante que mapRef funcione em qualquer versão */}
            <MapBinder onReady={(m) => (mapRef.current = m)} />

            {/* Tile branco e sem atribuição visível */}
            <TileLayer
              attribution="" // remove o texto "© OpenStreetMap contributors © CARTO"
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />

            {/* Círculo do raio */}
            <Circle
              center={[CAMPUS.lat, CAMPUS.lng]}
              radius={RADIUS_M}
              pathOptions={{
                color: "#ef4444",
                fillColor: "#fecaca",
                fillOpacity: 0.08,
                weight: 2,
              }}
            />

            {/* Marcador do campus */}
            <Marker position={[CAMPUS.lat, CAMPUS.lng]} icon={campusIcon}>
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">FAETERJ Quintino</div>
                  <div className="text-muted-foreground">
                    Rua Clarimundo de Melo, 847
                  </div>
                </div>
              </Popup>
            </Marker>

            {/* Marcadores dos ônibus */}
            {nearbyVehicles.map((vehicle) => {
              const etaLabel = formatEta(
                vehicle.etaMin as number,
                vehicle.velocidade,
              );
              const isParado = etaLabel === "parado";
              const lineColor = hashLineToColor(vehicle.linha);

              return (
                <Marker
                  key={`${vehicle.ordem}-${vehicle.datahora}`}
                  position={[vehicle.latitude, vehicle.longitude]}
                  icon={makeBusIcon(vehicle.linha)}
                >
                  <Popup>
                    <div className="text-[13px]">
                      {/* Cabeçalho */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="inline-flex items-center gap-2 font-semibold">
                          <span
                            className="inline-flex h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: lineColor }}
                          />
                          Linha {vehicle.linha}
                        </div>

                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full border"
                          style={{
                            backgroundColor: isParado
                              ? "rgba(251,191,36,.15)"
                              : "rgba(16,185,129,.12)",
                            color: isParado ? "#92400e" : "#065f46",
                            borderColor: isParado
                              ? "rgba(251,191,36,.35)"
                              : "rgba(16,185,129,.35)",
                          }}
                        >
                          {etaLabel}
                        </span>
                      </div>

                      {/* Cards de info */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg border bg-background/90 p-2 shadow-sm">
                          <div className="text-[10px] text-muted-foreground">
                            Veículo
                          </div>
                          <div className="font-medium">
                            {vehicle.ordem || "—"}
                          </div>
                        </div>

                        <div className="rounded-lg border bg-background/90 p-2 shadow-sm">
                          <div className="text-[10px] text-muted-foreground">
                            Velocidade
                          </div>
                          <div className="font-medium">
                            {Number(vehicle.velocidade).toFixed(0)} km/h
                          </div>
                        </div>

                        <div className="rounded-lg border bg-background/90 p-2 shadow-sm col-span-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">
                              Distância até o campus
                            </span>
                            <span className="font-medium">
                              {formatDistance(vehicle.dist)}
                            </span>
                          </div>
                          {/* Barra de progresso: quanto mais perto do campus, maior a barra */}
                          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.max(0, Math.min(100, (1 - vehicle.dist / RADIUS_M) * 100))}%`,
                                backgroundColor: lineColor,
                                opacity: 0.9,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Observação */}
                      <div className="mt-2 text-[11px] text-muted-foreground">
                        {isParado
                          ? "Veículo parado recentemente."
                          : "Tempo estimado de chegada com base na velocidade atual."}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Botões flutuantes */}
          <div className="absolute right-3 bottom-3 z-[3] flex flex-col gap-2">
            <ControlButton
              title="Centralizar no campus"
              onClick={recenterCampus}
            >
              <Crosshair className="h-5 w-5 text-foreground/80" />
            </ControlButton>
            <ControlButton
              title="Atualizar agora"
              onClick={handleManualRefresh}
            >
              <RefreshCw
                className={`h-5 w-5 text-foreground/80 ${loading ? "animate-spin" : ""}`}
              />
            </ControlButton>
          </div>
        </div>
      </div>

      {/* ================== PAINEL DE LINHAS (mais estreito; empilha abaixo no mobile) ================== */}
      <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
        <div className="px-3 pt-3 pb-2 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-sky-600" />
            <div className="font-semibold text-sm">Linhas próximas</div>
          </div>
          <div className="text-[11px] text-muted-foreground">
            {lastUpdated
              ? `Atualizado ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : ""}
          </div>
        </div>

        <div className="p-2 space-y-2">
          {loading && vehicles.length === 0 ? (
            <div className="text-xs text-muted-foreground p-3 rounded-md border bg-muted">
              Carregando posições...
            </div>
          ) : lineSummary.length === 0 ? (
            <div className="text-xs text-muted-foreground p-3 rounded-md border bg-muted">
              Nenhuma linha no raio de {RADIUS_M} metros
            </div>
          ) : (
            lineSummary.map((line) => (
              <button
                key={line.linha}
                onClick={() => focusLine(line.linha)}
                className="w-full text-left flex items-center justify-between rounded-xl border p-2 hover:bg-muted transition"
                style={{ boxShadow: "0 4px 14px rgba(2,6,23,.06)" }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex h-2 w-2 rounded-full"
                    style={{ backgroundColor: hashLineToColor(line.linha) }}
                  />
                  <div className="text-sm font-medium">Linha {line.linha}</div>
                  <div className="text-[11px] text-muted-foreground">
                    ({line.vehicles})
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-foreground/80">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {Number.isFinite(line.etaMin)
                    ? formatEta(line.etaMin, 30 /* rótulo */)
                    : "—"}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
