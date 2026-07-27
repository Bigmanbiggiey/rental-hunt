import { Checkbox, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui';
import { useAmenities, useCounties, usePropertyTypes } from '../hooks/useReferenceData';
import type { PropertyFiltersRawInput } from '../schemas/propertyFilters.schema';

export interface FilterFieldsProps {
  rawFilters: PropertyFiltersRawInput;
  setFilter: (key: keyof PropertyFiltersRawInput, value: string | string[] | undefined) => void;
}

/**
 * DISC-003 — the actual filter controls, shared verbatim between the
 * desktop `FilterBar` and the mobile `FilterDrawer` (`ui-guidelines.md`
 * §13.3: "same filter set, bar vs drawer").
 */
export function FilterFields({ rawFilters, setFilter }: FilterFieldsProps) {
  const { data: counties } = useCounties();
  const { data: propertyTypes } = usePropertyTypes();
  const { data: amenities } = useAmenities();

  const selectedAmenities = new Set(rawFilters.amenities ?? []);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex flex-col gap-1">
        <Label htmlFor="filter-county">County</Label>
        <Select
          value={rawFilters.county ?? ''}
          onValueChange={(value) => setFilter('county', value)}
        >
          <SelectTrigger id="filter-county" className="w-full sm:w-40">
            <SelectValue placeholder="Any county" />
          </SelectTrigger>
          <SelectContent>
            {(counties ?? []).map((county) => (
              <SelectItem key={county.id} value={county.id}>
                {county.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="filter-property-type">Property type</Label>
        <Select
          value={rawFilters.propertyType ?? ''}
          onValueChange={(value) => setFilter('propertyType', value)}
        >
          <SelectTrigger id="filter-property-type" className="w-full sm:w-40">
            <SelectValue placeholder="Any type" />
          </SelectTrigger>
          <SelectContent>
            {(propertyTypes ?? []).map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="filter-bedrooms-min">Bedrooms</Label>
        <div className="flex items-center gap-2">
          <Input
            id="filter-bedrooms-min"
            type="number"
            min={0}
            placeholder="Min"
            className="w-20"
            value={rawFilters.bedroomsMin ?? ''}
            onChange={(event) => setFilter('bedroomsMin', event.target.value)}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            aria-label="Bedrooms max"
            type="number"
            min={0}
            placeholder="Max"
            className="w-20"
            value={rawFilters.bedroomsMax ?? ''}
            onChange={(event) => setFilter('bedroomsMax', event.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="filter-min-price">Rent (KES)</Label>
        <div className="flex items-center gap-2">
          <Input
            id="filter-min-price"
            type="number"
            min={0}
            placeholder="Min"
            className="w-28"
            value={rawFilters.minPrice ?? ''}
            onChange={(event) => setFilter('minPrice', event.target.value)}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            aria-label="Maximum rent"
            type="number"
            min={0}
            placeholder="Max"
            className="w-28"
            value={rawFilters.maxPrice ?? ''}
            onChange={(event) => setFilter('maxPrice', event.target.value)}
          />
        </div>
      </div>

      <fieldset className="flex flex-col gap-1">
        <legend className="text-body-sm mb-1 font-medium text-foreground">Amenities</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {(amenities ?? []).map((amenity) => (
            <div key={amenity.id} className="flex items-center gap-2">
              <Checkbox
                id={`amenity-${amenity.id}`}
                checked={selectedAmenities.has(amenity.id)}
                onCheckedChange={(checked) => {
                  const next = new Set(selectedAmenities);
                  if (checked) next.add(amenity.id);
                  else next.delete(amenity.id);
                  setFilter('amenities', Array.from(next));
                }}
              />
              <Label htmlFor={`amenity-${amenity.id}`} className="font-normal">
                {amenity.name}
              </Label>
            </div>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
