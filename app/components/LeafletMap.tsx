'use client';

import { Fragment } from 'react';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';

export type HotspotIntensity = 'LOW' | 'LOW-MED' | 'MED' | 'MED-HIGH' | 'HIGH';

export type HeatLayer = {
  id: string;
  label: string;
  color: string;
  hotspots: { position: [number, number]; intensity: HotspotIntensity }[];
};

const intensityToRadius: Record<HotspotIntensity, number> = {
  LOW: 400,
  'LOW-MED': 550,
  MED: 700,
  'MED-HIGH': 850,
  HIGH: 1000,
};

const intensityToOpacity: Record<HotspotIntensity, number> = {
  LOW: 0.25,
  'LOW-MED': 0.28,
  MED: 0.32,
  'MED-HIGH': 0.35,
  HIGH: 0.38,
};

interface LeafletMapProps {
  center: LatLngExpression;
  zoom?: number;
  layers: HeatLayer[];
  activeLayers: string[];
}

export function LeafletMap({ center, zoom = 13, layers, activeLayers }: LeafletMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={false}
      dragging={false}
      doubleClickZoom={false}
      touchZoom={false}
      boxZoom={false}
      zoomControl={false}
      keyboard={false}
      style={{ height: '420px', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contribuidores'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {layers
        .filter((layer) => activeLayers.includes(layer.id))
        .map((layer) => (
          <Fragment key={layer.id}>
            {layer.hotspots.map((spot, idx) => (
              <Circle
                key={`${layer.id}-${idx}`}
                center={spot.position}
                radius={intensityToRadius[spot.intensity]}
                pathOptions={{
                  color: layer.color,
                  fillColor: layer.color,
                  fillOpacity: intensityToOpacity[spot.intensity],
                  weight: 1.5,
                  opacity: 0.8,
                }}
              />
            ))}
          </Fragment>
        ))}
    </MapContainer>
  );
}
