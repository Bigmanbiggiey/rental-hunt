import {
  Car,
  Droplet,
  Shield,
  Wifi,
  DoorOpen,
  Sofa,
  PawPrint,
  Waves,
  Zap,
  Dumbbell,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';

// A small hand-built map, not lucide-react's dynamic-icon-import mechanism —
// this is a fixed, curated catalogue (database.md §5.10/§12's seeded ~10
// amenities), not an open-ended icon set that would benefit from per-icon
// async chunks. `HelpCircle` is the fallback for any future amenity added
// via a later migration whose icon key isn't mapped here yet, so a new
// amenity degrades gracefully instead of crashing.
const AMENITY_ICONS: Record<string, LucideIcon> = {
  car: Car,
  droplet: Droplet,
  shield: Shield,
  wifi: Wifi,
  'door-open': DoorOpen,
  sofa: Sofa,
  'paw-print': PawPrint,
  waves: Waves,
  zap: Zap,
  dumbbell: Dumbbell,
};

export function getAmenityIcon(icon: string | null): LucideIcon {
  return (icon && AMENITY_ICONS[icon]) || HelpCircle;
}
