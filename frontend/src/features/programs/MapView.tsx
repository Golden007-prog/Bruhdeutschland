import { MapPin } from "lucide-react";

import type { Scored } from "@/lib/programs/search";
import { cn } from "@/lib/utils";

// Germany bounding box for a simple equirectangular plot (no tiles, no heavy GL dep).
const BBOX = { west: 5.8, east: 15.1, south: 47.2, north: 55.1 };

interface CityPin {
  city: string;
  lat: number;
  lng: number;
  count: number;
}

/**
 * A lightweight geographic plot: programmes clustered by city and positioned by their real lat/lng.
 * Clicking a city filters to it. (MapLibre + OSM tiles is the documented upgrade for a full basemap.)
 */
export function MapView({ items, onCity }: { items: Scored[]; onCity: (city: string) => void }) {
  const byCity = new Map<string, CityPin>();
  for (const { program: p } of items) {
    if (p.lat == null || p.lng == null) continue;
    const cur = byCity.get(p.city);
    if (cur) cur.count += 1;
    else byCity.set(p.city, { city: p.city, lat: p.lat, lng: p.lng, count: 1 });
  }
  const pins = [...byCity.values()];

  return (
    <div>
      <div className="relative mx-auto aspect-[3/4] w-full max-w-sm rounded-lg border bg-muted/20 bg-dossier-grid">
        {pins.map((pin) => {
          const x = ((pin.lng - BBOX.west) / (BBOX.east - BBOX.west)) * 100;
          const y = ((BBOX.north - pin.lat) / (BBOX.north - BBOX.south)) * 100;
          return (
            <button
              key={pin.city}
              type="button"
              onClick={() => onCity(pin.city)}
              style={{ left: `${x}%`, top: `${y}%` }}
              className="absolute -translate-x-1/2 -translate-y-full focus-visible:outline-none"
              aria-label={`${pin.city}: ${pin.count} programme${pin.count === 1 ? "" : "s"}`}
            >
              <span className="flex flex-col items-center">
                <span className={cn("inline-flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[0.6rem] font-semibold text-primary-foreground shadow")}>
                  {pin.city} · {pin.count}
                </span>
                <MapPin className="h-4 w-4 text-primary" aria-hidden />
              </span>
            </button>
          );
        })}
        {pins.length === 0 && (
          <p className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-muted-foreground">
            No locations to plot for the current filters.
          </p>
        )}
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Simplified plot by city — click a pin to filter. Positions from each programme&apos;s coordinates.
      </p>
    </div>
  );
}
