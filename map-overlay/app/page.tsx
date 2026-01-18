"use client";

import React, { useState, useRef, useEffect } from "react";

export default function Home() {
  const [transform, setTransform] = useState({
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
    opacity: 0.7,
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startX: transform.x,
      startY: transform.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;

    const { startX, startY, x: initialMouseX, y: initialMouseY } = dragStartRef.current;
    const dx = e.clientX - initialMouseX;
    const dy = e.clientY - initialMouseY;

    setTransform((prev) => ({
      ...prev,
      x: startX + dx,
      y: startY + dy,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        dragStartRef.current = null;
      }
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [isDragging]);

  const handleWheel = (e: React.WheelEvent) => {
    if (!containerRef.current) return;
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Vector from the current transformed center to the mouse
    const vecX = mouseX - (centerX + transform.x);
    const vecY = mouseY - (centerY + transform.y);

    const zoomIntensity = 0.001;
    const delta = -e.deltaY * zoomIntensity;
    const newScale = Math.max(0.1, Math.min(5, transform.scale * (1 + delta)));

    const scaleRatio = newScale / transform.scale;

    setTransform((prev) => ({
      ...prev,
      scale: newScale,
      x: prev.x + vecX * (1 - scaleRatio),
      y: prev.y + vecY * (1 - scaleRatio),
    }));
  };

  const handleChange = (key: keyof typeof transform, value: number) => {
    setTransform((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div
      className="flex min-h-screen bg-gray-100 overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Sidebar Controls */}
      <div className="w-80 bg-white shadow-lg p-6 flex flex-col gap-6 z-10 overflow-y-auto border-r border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">Map Overlay Tool</h1>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Translate X (px)</label>
            <div className="flex gap-2">
              <input
                type="range"
                min="-1000"
                max="1000"
                value={transform.x}
                onChange={(e) => handleChange("x", Number(e.target.value))}
                className="w-full"
              />
              <input
                type="number"
                value={Math.round(transform.x)}
                onChange={(e) => handleChange("x", Number(e.target.value))}
                className="w-20 p-1 border rounded text-sm text-black"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Translate Y (px)</label>
            <div className="flex gap-2">
              <input
                type="range"
                min="-1000"
                max="1000"
                value={transform.y}
                onChange={(e) => handleChange("y", Number(e.target.value))}
                className="w-full"
              />
              <input
                type="number"
                value={Math.round(transform.y)}
                onChange={(e) => handleChange("y", Number(e.target.value))}
                className="w-20 p-1 border rounded text-sm text-black"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Rotation (deg)</label>
            <div className="flex gap-2">
              <input
                type="range"
                min="-180"
                max="180"
                step="0.1"
                value={transform.rotate}
                onChange={(e) => handleChange("rotate", Number(e.target.value))}
                className="w-full"
              />
              <input
                type="number"
                value={transform.rotate}
                onChange={(e) => handleChange("rotate", Number(e.target.value))}
                className="w-20 p-1 border rounded text-sm text-black"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Scale</label>
            <div className="flex gap-2">
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.01"
                value={transform.scale}
                onChange={(e) => handleChange("scale", Number(e.target.value))}
                className="w-full"
              />
              <input
                type="number"
                step="0.01"
                value={transform.scale}
                onChange={(e) => handleChange("scale", Number(e.target.value))}
                className="w-20 p-1 border rounded text-sm text-black"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Opacity</label>
            <div className="flex gap-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={transform.opacity}
                onChange={(e) => handleChange("opacity", Number(e.target.value))}
                className="w-full"
              />
              <span className="w-12 text-sm text-gray-600 text-right">
                {Math.round(transform.opacity * 100)}%
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded border border-gray-200">
          <h3 className="font-semibold mb-2 text-gray-800">Current Parameters:</h3>
          <pre className="text-xs overflow-auto bg-gray-100 p-2 rounded text-gray-700">
            {JSON.stringify(transform, null, 2)}
          </pre>
        </div>
        
        <p className="text-xs text-gray-500 mt-auto">
          Tip: You can drag the overlay directly with your mouse. Use mouse wheel to zoom.
        </p>
      </div>

      {/* Map Area */}
      <div 
        className="flex-1 relative overflow-hidden bg-gray-200 cursor-grab active:cursor-grabbing flex items-center justify-center"
      >
        <div 
          ref={containerRef}
          onWheel={handleWheel}
          className="relative inline-block border border-gray-400 shadow-2xl bg-white"
        >
          {/* Base Map */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/mit_campus.png" 
            alt="MIT Campus Map" 
            className="block max-w-none pointer-events-none select-none"
            style={{ maxHeight: "90vh", maxWidth: "none" }} // Let it be large, scrollable if needed? Actually let's constrain it to fit view or be scrollable?
            // The user said "find the right fit", implying the map is the reference.
            // Let's just display the map as is. If it's huge, maybe we want pan/zoom on the map too?
            // For now, let's assume the map is static and we move the overlay. 
            // Better to have the map fit or be scrollable.
          />
          
          {/* Overlay */}
          <div
            className="absolute top-0 left-0 origin-center cursor-move"
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) rotate(${transform.rotate}deg) scale(${transform.scale})`,
              opacity: transform.opacity,
              width: "100%", // Initial assumption, but svg might have its own size
              height: "100%", 
              // We need the overlay to be unconstrained so it can move anywhere. 
              // Actually, putting it absolute top-0 left-0 means it starts aligned with the map.
            }}
            onMouseDown={handleMouseDown}
          >
             {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/overlay.svg" 
              alt="Overlay"
              className="pointer-events-none select-none"
              // The SVG has intrinsic size 1200x600. 
              // If we don't set width/height, it should render at intrinsic size.
            />
          </div>
        </div>
      </div>
    </div>
  );
}