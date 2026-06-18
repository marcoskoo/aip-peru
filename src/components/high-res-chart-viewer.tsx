"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from "react-zoom-pan-pinch";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize2,
  Minimize2,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ChartItem {
  type: string;
  name: string;
  file: string;
  url: string;
}

interface HighResChartViewerProps {
  charts: ChartItem[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  airportIcao?: string;
  airportName?: string;
}

const TYPE_COLORS: Record<string, string> = {
  SID: "bg-emerald-600",
  STAR: "bg-blue-600",
  IAC: "bg-red-600",
  ADC: "bg-purple-600",
  TMA: "bg-amber-600",
  VAC: "bg-cyan-600",
  HELO: "bg-orange-600",
  NADP: "bg-slate-600",
};

/**
 * ZoomControls must be rendered INSIDE <TransformWrapper> because it uses useControls().
 */
function ZoomControls({
  onRotateLeft,
  onRotateRight,
  onResetRotation,
  rotation,
  onDownload,
  chartName,
}: {
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onResetRotation: () => void;
  rotation: number;
  onDownload: () => void;
  chartName: string;
}) {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <div className="flex items-center gap-1 flex-wrap justify-center">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => zoomIn(0.3)}
        className="text-white hover:bg-white/20 h-9 w-9 p-0"
        title="Acercar (+)"
      >
        <ZoomIn className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => zoomOut(0.3)}
        className="text-white hover:bg-white/20 h-9 w-9 p-0"
        title="Alejar (-)"
      >
        <ZoomOut className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => resetTransform()}
        className="text-white hover:bg-white/20 h-9 w-9 p-0"
        title="Restablecer vista (R)"
      >
        <RefreshCw className="size-4" />
      </Button>
      <div className="w-px h-6 bg-white/20 mx-1" />
      <Button
        variant="ghost"
        size="sm"
        onClick={onRotateLeft}
        className="text-white hover:bg-white/20 h-9 w-9 p-0"
        title="Rotar izquierda"
      >
        <RotateCcw className="size-4" />
      </Button>
      <span className="text-white/70 text-xs font-mono w-12 text-center">
        {rotation}°
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRotateRight}
        className="text-white hover:bg-white/20 h-9 w-9 p-0"
        title="Rotar derecha"
      >
        <RotateCw className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onResetRotation}
        className="text-white hover:bg-white/20 h-9 px-2 text-xs"
        title="Reset rotación"
      >
        0°
      </Button>
      <div className="w-px h-6 bg-white/20 mx-1" />
      <Button
        variant="ghost"
        size="sm"
        onClick={onDownload}
        className="text-white hover:bg-white/20 h-9 px-3 text-xs gap-1.5"
        title="Descargar PNG"
      >
        <Download className="size-3.5" />
        <span className="hidden sm:inline">Descargar</span>
      </Button>
      <span className="text-white/50 text-xs ml-2 hidden md:inline truncate max-w-[300px]">
        {chartName}
      </span>
    </div>
  );
}

export function HighResChartViewer({
  charts,
  initialIndex = 0,
  isOpen,
  onClose,
  airportIcao,
  airportName,
}: HighResChartViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [rotation, setCurrentRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [lastInitialIndex, setLastInitialIndex] = useState(initialIndex);
  const [wasOpen, setWasOpen] = useState(isOpen);

  // Sync internal state with prop changes (React 19 pattern - no useEffect+setState)
  if (isOpen && (!wasOpen || lastInitialIndex !== initialIndex)) {
    setWasOpen(true);
    setLastInitialIndex(initialIndex);
    if (currentIndex !== initialIndex) {
      setCurrentIndex(initialIndex);
    }
    if (rotation !== 0) {
      setCurrentRotation(0);
    }
    if (imageLoaded) {
      setImageLoaded(false);
    }
  } else if (!isOpen && wasOpen) {
    setWasOpen(false);
  }

  const currentChart = charts[currentIndex];

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % charts.length);
    setCurrentRotation(0);
    setImageLoaded(false);
  }, [charts.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + charts.length) % charts.length);
    setCurrentRotation(0);
    setImageLoaded(false);
  }, [charts.length]);

  const rotateLeft = () => setCurrentRotation((r) => (r - 90 + 360) % 360);
  const rotateRight = () => setCurrentRotation((r) => (r + 90) % 360);
  const resetRotation = () => setCurrentRotation(0);

  const handleDownload = useCallback(async () => {
    if (!currentChart) return;
    try {
      const response = await fetch(currentChart.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${airportIcao || "chart"}_${currentChart.type}_${currentChart.file}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(currentChart.url, "_blank");
    }
  }, [currentChart, airportIcao]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          goPrev();
          break;
        case "ArrowRight":
          e.preventDefault();
          goNext();
          break;
        case "Escape":
          if (!document.fullscreenElement) {
            onClose();
          }
          break;
        case "r":
        case "R":
          rotateRight();
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, goNext, goPrev, onClose]);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  if (!isOpen || !currentChart) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between p-3 bg-black/60 backdrop-blur-sm border-b border-white/10 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {airportIcao && (
            <Badge className="bg-navy text-white font-bold tracking-wider shrink-0">
              {airportIcao}
            </Badge>
          )}
          <Badge
            className={`${
              TYPE_COLORS[currentChart.type] || "bg-slate-600"
            } text-white font-bold shrink-0`}
          >
            {currentChart.type}
          </Badge>
          <div className="text-white text-sm font-medium truncate hidden sm:block">
            {currentChart.name}
          </div>
          {airportName && (
            <div className="text-white/40 text-xs truncate hidden lg:block">
              · {airportName}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-white/50 text-xs hidden sm:inline">
            {currentIndex + 1} / {charts.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-white hover:bg-white/20 h-9 w-9 p-0"
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFullscreen ? (
              <Minimize2 className="size-4" />
            ) : (
              <Maximize2 className="size-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20 h-9 w-9 p-0"
            title="Cerrar (Esc)"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Main viewer area with zoom/pan - controls INSIDE TransformWrapper */}
      <TransformWrapper
        key={`${currentChart.url}-${currentIndex}`}
        initialScale={1}
        minScale={0.5}
        maxScale={8}
        centerOnInit
        centerZoomedOut
        doubleClick={{ mode: "zoomIn", step: 0.7 }}
        wheel={{ step: 0.1 }}
        pinch={{ step: 5 }}
        panning={{ velocityDisabled: true }}
        className="flex-1 flex flex-col"
      >
        {/* Image area */}
        <div className="flex-1 flex relative overflow-hidden">
          {/* Prev button */}
          {charts.length > 1 && (
            <button
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              title="Anterior (←)"
              aria-label="Carta anterior"
            >
              <ChevronLeft className="size-6" />
            </button>
          )}

          <div className="w-full h-full flex items-center justify-center relative">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex flex-col items-center gap-3">
                  <div className="size-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <p className="text-white/60 text-sm">Cargando carta...</p>
                </div>
              </div>
            )}
            <TransformComponent
              wrapperClass="!w-full !h-full !cursor-grab active:!cursor-grabbing"
              contentClass="!w-full !h-full flex items-center justify-center"
            >
              <img
                src={currentChart.url}
                alt={`${currentChart.type} - ${currentChart.name}`}
                onLoad={() => setImageLoaded(true)}
                className="max-w-none select-none pointer-events-none"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: "transform 0.3s ease",
                  maxHeight: rotation === 90 || rotation === 270 ? "100vw" : "none",
                  maxWidth: rotation === 90 || rotation === 270 ? "100vh" : "none",
                }}
                draggable={false}
              />
            </TransformComponent>
          </div>

          {/* Next button */}
          {charts.length > 1 && (
            <button
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              title="Siguiente (→)"
              aria-label="Carta siguiente"
            >
              <ChevronRight className="size-6" />
            </button>
          )}
        </div>

        {/* Bottom controls bar - INSIDE TransformWrapper so useControls() works */}
        <div className="p-3 bg-black/60 backdrop-blur-sm border-t border-white/10 flex items-center justify-center">
          <ZoomControls
            onRotateLeft={rotateLeft}
            onRotateRight={rotateRight}
            onResetRotation={resetRotation}
            rotation={rotation}
            onDownload={handleDownload}
            chartName={currentChart.name}
          />
        </div>
      </TransformWrapper>

      {/* Help hint */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/70 text-white/60 text-xs px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-none">
        Rueda = zoom · Arrastra = mover · Doble click = zoom rápido · ← → = navegar · R = rotar
      </div>
    </div>
  );
}
