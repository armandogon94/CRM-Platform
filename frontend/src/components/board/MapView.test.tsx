import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MapView } from './MapView';

// Mock react-leaflet — rendering actual Leaflet in jsdom doesn't work
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children, ...props }: any) => (
    <div data-testid="map-container" data-center={JSON.stringify(props.center)} data-zoom={props.zoom}>
      {children}
    </div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children, position }: any) => (
    <div data-testid="map-marker" data-position={JSON.stringify(position)}>
      {children}
    </div>
  ),
  Popup: ({ children }: any) => <div data-testid="map-popup">{children}</div>,
}));

const MOCK_BOARD_WITH_LOCATION = {
  id: 42,
  name: 'Test Board',
  workspaceId: 1,
  columns: [
    { id: 1, name: 'Status', columnType: 'status', position: 0 },
    { id: 2, name: 'Location', columnType: 'location', position: 1 },
  ],
  groups: [{ id: 1, name: 'Group 1', color: '#6366f1' }],
};

const MOCK_BOARD_NO_LOCATION = {
  id: 43,
  name: 'Board Without Location',
  workspaceId: 1,
  columns: [
    { id: 1, name: 'Status', columnType: 'status', position: 0 },
  ],
  groups: [],
};

const MOCK_ITEMS_WITH_LOCATIONS = [
  {
    id: 1,
    name: 'Office NYC',
    boardId: 42,
    groupId: 1,
    columnValues: [
      { id: 10, columnId: 2, value: { address: '123 Broadway, NY', lat: 40.7128, lng: -74.006 } },
    ],
  },
  {
    id: 2,
    name: 'Office LA',
    boardId: 42,
    groupId: 1,
    columnValues: [
      { id: 11, columnId: 2, value: { address: '456 Sunset Blvd, LA', lat: 34.0522, lng: -118.2437 } },
    ],
  },
  {
    id: 3,
    name: 'No Location',
    boardId: 42,
    groupId: 1,
    columnValues: [],
  },
];

describe('MapView', () => {
  it('shows setup prompt when no location column exists', () => {
    render(<MapView board={MOCK_BOARD_NO_LOCATION as any} items={[]} />);
    expect(screen.getByTestId('map-no-location')).toBeDefined();
    expect(screen.getByText(/Add a Location column/i)).toBeDefined();
  });

  it('renders map container when location column exists', () => {
    render(<MapView board={MOCK_BOARD_WITH_LOCATION as any} items={MOCK_ITEMS_WITH_LOCATIONS as any} />);
    expect(screen.getByTestId('map-container')).toBeDefined();
  });

  it('renders markers for items with location data', () => {
    render(<MapView board={MOCK_BOARD_WITH_LOCATION as any} items={MOCK_ITEMS_WITH_LOCATIONS as any} />);
    const markers = screen.getAllByTestId('map-marker');
    expect(markers).toHaveLength(2); // Only items 1 and 2 have locations
  });

  it('shows item name in marker popup', () => {
    render(<MapView board={MOCK_BOARD_WITH_LOCATION as any} items={MOCK_ITEMS_WITH_LOCATIONS as any} />);
    expect(screen.getByText('Office NYC')).toBeDefined();
    expect(screen.getByText('Office LA')).toBeDefined();
  });

  it('skips items without location values', () => {
    render(<MapView board={MOCK_BOARD_WITH_LOCATION as any} items={MOCK_ITEMS_WITH_LOCATIONS as any} />);
    const markers = screen.getAllByTestId('map-marker');
    expect(markers).toHaveLength(2); // "No Location" item is not rendered
  });
});
