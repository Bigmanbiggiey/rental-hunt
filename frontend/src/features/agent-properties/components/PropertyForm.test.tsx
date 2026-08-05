import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Property } from '@/entities/property';
import { AppError } from '@/shared/lib/errors';
import { PropertyForm } from './PropertyForm';

const mockCreateMutate = vi.fn();
const createIsPending = false;
let createError: unknown = null;
vi.mock('../hooks/useCreateProperty', () => ({
  useCreateProperty: () => ({ mutate: mockCreateMutate, isPending: createIsPending, error: createError }),
}));

const mockUpdateMutate = vi.fn();
const updateIsPending = false;
const updateError: unknown = null;
vi.mock('../hooks/useUpdateProperty', () => ({
  useUpdateProperty: () => ({ mutate: mockUpdateMutate, isPending: updateIsPending, error: updateError }),
}));

// Same ids BASE_PROPERTY below uses for countyId/locationId — a prior
// version of this mock used unrelated placeholder ids ('c1'/'l1') that
// never matched, which nothing caught because no test asserted on the
// county/location combobox's displayed text before this pass.
const mockNairobiId = '3ff9bcab-8633-485c-ab51-d3ff579e22e0';
const mockKilimaniId = '188c3f4b-a18b-424d-ae59-a63def850522';
const mockKiambuId = 'a6f2e6b1-df3b-4a2a-9b3c-1a2b3c4d5e6f';

const mockCreateLocationMutateAsync = vi.fn();
vi.mock('../hooks/useReferenceData', () => ({
  useCounties: () => ({
    data: [
      { id: mockNairobiId, name: 'Nairobi' },
      { id: mockKiambuId, name: 'Kiambu' },
    ],
  }),
  useLocations: () => ({ data: [{ id: mockKilimaniId, name: 'Kilimani', countyId: mockNairobiId }] }),
  usePropertyTypes: () => ({ data: [{ id: 'pt1', name: 'Apartment' }] }),
  useAmenities: () => ({ data: [{ id: 'am1', name: 'Parking' }] }),
  useCreateLocation: () => ({ mutateAsync: mockCreateLocationMutateAsync, isPending: false }),
}));

// LocationPickerMap owns a real Leaflet instance + Nominatim network calls
// (LocationPickerMapCanvas, React.lazy-loaded) — not something a fast,
// mocked-mutations component test should depend on. Stubbed with a button
// that fires the same onChange callback the real map would, so the
// "picking a point updates the form" wiring is still covered.
vi.mock('./LocationPickerMap', () => ({
  LocationPickerMap: ({ onChange }: { onChange: (lat: number, lng: number) => void }) => (
    <button type="button" onClick={() => onChange(-1.3, 36.8)}>
      Simulate map pick
    </button>
  ),
}));

const BASE_PROPERTY: Property = {
  id: 'p1',
  slug: 'test-2br-kilimani',
  title: 'Test 2BR in Kilimani',
  description: 'A spacious two bedroom apartment near the CBD.',
  agencyId: 'ag1',
  agentId: 'agent1',
  propertyTypeId: '75832978-1de8-4862-87ff-1835ead2dfa4',
  propertyTypeName: 'Apartment',
  countyId: '3ff9bcab-8633-485c-ab51-d3ff579e22e0',
  countyName: 'Nairobi',
  locationId: '188c3f4b-a18b-424d-ae59-a63def850522',
  locationName: 'Kilimani',
  latitude: -1.29,
  longitude: 36.78,
  bedrooms: 2,
  bathrooms: 2,
  rentAmount: 55000,
  depositAmount: 55000,
  currency: 'KES',
  availabilityStatus: 'available',
  verificationStatus: 'unverified',
  lastVerifiedAt: null,
  isFeatured: false,
  isArchived: false,
  viewCount: 3,
  images: [],
  amenities: [],
  agent: {
    id: 'agent1',
    fullName: 'James Mwangi',
    avatarUrl: null,
    jobTitle: 'Leasing Agent',
    bio: null,
    agencyId: 'ag1',
    agencyName: 'Nairobi Homes',
  },
  createdAt: '2026-07-20T00:00:00.000Z',
  updatedAt: '2026-07-20T00:00:00.000Z',
};

describe('PropertyForm (component)', () => {
  it('pre-fills every plain input from the given property in edit mode (AGENT-003)', () => {
    render(<PropertyForm property={BASE_PROPERTY} />);

    expect(screen.getByLabelText(/title/i)).toHaveValue('Test 2BR in Kilimani');
    expect(screen.getByLabelText(/description/i)).toHaveValue(
      'A spacious two bedroom apartment near the CBD.',
    );
    expect(screen.getByLabelText(/latitude/i)).toHaveValue(-1.29);
    expect(screen.getByLabelText(/longitude/i)).toHaveValue(36.78);
    expect(screen.getByLabelText(/bedrooms/i)).toHaveValue(2);
    expect(screen.getByLabelText(/bathrooms/i)).toHaveValue(2);
    expect(screen.getByLabelText(/monthly rent/i)).toHaveValue(55000);
    expect(screen.getByLabelText(/deposit/i)).toHaveValue(55000);
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('submits the pre-filled values to the update mutation, unchanged, in edit mode', async () => {
    const user = userEvent.setup();
    render(<PropertyForm property={BASE_PROPERTY} />);

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(mockUpdateMutate).toHaveBeenCalledWith(
      {
        id: 'p1',
        input: expect.objectContaining({
          title: 'Test 2BR in Kilimani',
          propertyTypeId: '75832978-1de8-4862-87ff-1835ead2dfa4',
          countyId: '3ff9bcab-8633-485c-ab51-d3ff579e22e0',
          locationId: '188c3f4b-a18b-424d-ae59-a63def850522',
          latitude: -1.29,
          longitude: 36.78,
          bedrooms: 2,
          bathrooms: 2,
          rentAmount: 55000,
          depositAmount: 55000,
          availabilityStatus: 'available',
        }),
      },
      expect.anything(),
    );
    expect(mockCreateMutate).not.toHaveBeenCalled();
  });

  it('shows a validation error and does not call the create mutation when required fields are missing', async () => {
    const user = userEvent.setup();
    render(<PropertyForm />);

    await user.click(screen.getByRole('button', { name: /create listing/i }));

    expect(await screen.findByText(/title must be at least 5 characters/i)).toBeInTheDocument();
    expect(mockCreateMutate).not.toHaveBeenCalled();
  });

  it('shows the submission error from the create mutation', () => {
    createError = new AppError('VALIDATION_ERROR', 'A listing with this title already exists.');
    render(<PropertyForm />);

    expect(screen.getByText('A listing with this title already exists.')).toBeInTheDocument();
    createError = null;
  });

  it('lets the county combobox be searched by typing, not just clicked through', async () => {
    const user = userEvent.setup();
    render(<PropertyForm />);

    await user.click(screen.getByRole('combobox', { name: /county/i }));
    await user.type(screen.getByPlaceholderText(/search counties/i), 'Kiambu');

    expect(screen.getByRole('option', { name: 'Kiambu' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Nairobi' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('option', { name: 'Kiambu' }));
    expect(screen.getByRole('combobox', { name: /county/i })).toHaveTextContent('Kiambu');
  });

  it('creates a new location on the fly when the typed neighborhood has no match', async () => {
    mockCreateLocationMutateAsync.mockResolvedValueOnce({ id: 'l-new', countyId: mockNairobiId, name: 'Runda' });
    const user = userEvent.setup();
    render(<PropertyForm />);

    await user.click(screen.getByRole('combobox', { name: /county/i }));
    await user.click(screen.getByRole('option', { name: 'Nairobi' }));

    await user.click(screen.getByRole('combobox', { name: /location/i }));
    await user.type(screen.getByPlaceholderText(/search or type a new neighborhood/i), 'Runda');

    const createOption = await screen.findByText('Add "Runda" as a new location');
    await user.click(createOption);

    expect(mockCreateLocationMutateAsync).toHaveBeenCalledWith({ countyId: mockNairobiId, name: 'Runda' });
    // The mocked useLocations always returns the same static list (it
    // doesn't simulate the real cache invalidation useCreateLocation
    // triggers on success), so the newly "created" id genuinely has no
    // matching option here — asserting the popover closed cleanly is the
    // meaningful proof the create-then-select flow completed without error.
    await waitFor(() =>
      expect(screen.queryByText('Add "Runda" as a new location')).not.toBeInTheDocument(),
    );
  });

  it('clears the selected location when the county changes, since it no longer applies', async () => {
    const user = userEvent.setup();
    render(<PropertyForm property={BASE_PROPERTY} />);

    expect(screen.getByRole('combobox', { name: /location/i })).toHaveTextContent('Kilimani');

    await user.click(screen.getByRole('combobox', { name: /county/i }));
    await user.click(screen.getByRole('option', { name: 'Kiambu' }));

    expect(screen.getByRole('combobox', { name: /location/i })).not.toHaveTextContent('Kilimani');
  });

  it('updates the latitude/longitude fields when a point is picked on the map', async () => {
    const user = userEvent.setup();
    render(<PropertyForm />);

    await user.click(screen.getByRole('button', { name: /simulate map pick/i }));

    expect(screen.getByLabelText(/latitude/i)).toHaveValue(-1.3);
    expect(screen.getByLabelText(/longitude/i)).toHaveValue(36.8);
  });
});
