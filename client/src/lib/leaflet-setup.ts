import L from 'leaflet';

// Fix default marker icons (common Leaflet issue with bundlers)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Location coordinates for Ontario, Canada
export const LOCATION_COORDS: Record<string, [number, number]> = {
  Toronto: [43.6532, -79.3832],
  Mississauga: [43.5890, -79.6441],
  Brampton: [43.7315, -79.7624],
  Ottawa: [45.4215, -75.6972]
};
