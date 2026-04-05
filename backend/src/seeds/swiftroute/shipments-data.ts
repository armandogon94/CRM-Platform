import Item from '../../models/Item';
import ColumnValue from '../../models/ColumnValue';
import { SwiftRouteContext } from './workspace';
import { SwiftRouteBoards } from './boards';

// ─── Shipment Record Shape ─────────────────────────────────────────────────

interface ShipmentRecord {
  trackingNumber: string;
  status: string;
  origin: string;
  destination: string;
  dispatchDate: string | null;
  deliveryDate: string | null;
  driverIndex: number;
  group: 'received' | 'dispatched' | 'in_transit' | 'delivered' | 'exception';
}

// ─── 100 Hardcoded Shipment Records ────────────────────────────────────────
// Distribution: 15 Received, 18 Dispatched, 22 In Transit, 35 Delivered, 10 Exception

const SHIPMENTS: ShipmentRecord[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // RECEIVED (15) — no dispatch date, no delivery date
  // ═══════════════════════════════════════════════════════════════════════════
  { trackingNumber: 'SR-4K8M2N7P', status: 'received', origin: 'Dallas, TX', destination: 'Houston, TX', dispatchDate: null, deliveryDate: null, driverIndex: 0, group: 'received' },
  { trackingNumber: 'SR-9R3T6W1X', status: 'received', origin: 'Los Angeles, CA', destination: 'San Diego, CA', dispatchDate: null, deliveryDate: null, driverIndex: 5, group: 'received' },
  { trackingNumber: 'SR-2F7H4J8L', status: 'received', origin: 'Chicago, IL', destination: 'Milwaukee, WI', dispatchDate: null, deliveryDate: null, driverIndex: 12, group: 'received' },
  { trackingNumber: 'SR-6B1D5G3K', status: 'received', origin: 'New York, NY', destination: 'Philadelphia, PA', dispatchDate: null, deliveryDate: null, driverIndex: 18, group: 'received' },
  { trackingNumber: 'SR-8Q4V2C9E', status: 'received', origin: 'San Francisco, CA', destination: 'Sacramento, CA', dispatchDate: null, deliveryDate: null, driverIndex: 24, group: 'received' },
  { trackingNumber: 'SR-3N7P1S5U', status: 'received', origin: 'Atlanta, GA', destination: 'Nashville, TN', dispatchDate: null, deliveryDate: null, driverIndex: 31, group: 'received' },
  { trackingNumber: 'SR-1A6Y8Z4W', status: 'received', origin: 'Seattle, WA', destination: 'Portland, OR', dispatchDate: null, deliveryDate: null, driverIndex: 37, group: 'received' },
  { trackingNumber: 'SR-5M2R9T7V', status: 'received', origin: 'Denver, CO', destination: 'Phoenix, AZ', dispatchDate: null, deliveryDate: null, driverIndex: 43, group: 'received' },
  { trackingNumber: 'SR-7X3E1F6H', status: 'received', origin: 'Miami, FL', destination: 'Orlando, FL', dispatchDate: null, deliveryDate: null, driverIndex: 50, group: 'received' },
  { trackingNumber: 'SR-4G8K2L9J', status: 'received', origin: 'Boston, MA', destination: 'Hartford, CT', dispatchDate: null, deliveryDate: null, driverIndex: 56, group: 'received' },
  { trackingNumber: 'SR-6C1B5D3A', status: 'received', origin: 'Minneapolis, MN', destination: 'Des Moines, IA', dispatchDate: null, deliveryDate: null, driverIndex: 62, group: 'received' },
  { trackingNumber: 'SR-2W8Q4P7N', status: 'received', origin: 'Houston, TX', destination: 'San Antonio, TX', dispatchDate: null, deliveryDate: null, driverIndex: 68, group: 'received' },
  { trackingNumber: 'SR-9U3S6R1T', status: 'received', origin: 'Charlotte, NC', destination: 'Raleigh, NC', dispatchDate: null, deliveryDate: null, driverIndex: 74, group: 'received' },
  { trackingNumber: 'SR-8Z4Y7X2V', status: 'received', origin: 'Las Vegas, NV', destination: 'Salt Lake City, UT', dispatchDate: null, deliveryDate: null, driverIndex: 80, group: 'received' },
  { trackingNumber: 'SR-1E6F3G5H', status: 'received', origin: 'Detroit, MI', destination: 'Columbus, OH', dispatchDate: null, deliveryDate: null, driverIndex: 86, group: 'received' },

  // ═══════════════════════════════════════════════════════════════════════════
  // DISPATCHED (18) — dispatch dates April 1-2 2026, no delivery date
  // ═══════════════════════════════════════════════════════════════════════════
  { trackingNumber: 'SR-3J8K1L4M', status: 'dispatched', origin: 'Dallas, TX', destination: 'Austin, TX', dispatchDate: '2026-04-01', deliveryDate: null, driverIndex: 1, group: 'dispatched' },
  { trackingNumber: 'SR-7N2P5Q9R', status: 'dispatched', origin: 'Phoenix, AZ', destination: 'Tucson, AZ', dispatchDate: '2026-04-01', deliveryDate: null, driverIndex: 7, group: 'dispatched' },
  { trackingNumber: 'SR-4S6T8U1V', status: 'dispatched', origin: 'Los Angeles, CA', destination: 'Bakersfield, CA', dispatchDate: '2026-04-01', deliveryDate: null, driverIndex: 14, group: 'dispatched' },
  { trackingNumber: 'SR-2W3X5Y7Z', status: 'dispatched', origin: 'Chicago, IL', destination: 'Indianapolis, IN', dispatchDate: '2026-04-01', deliveryDate: null, driverIndex: 20, group: 'dispatched' },
  { trackingNumber: 'SR-9A1B4C6D', status: 'dispatched', origin: 'New York, NY', destination: 'Boston, MA', dispatchDate: '2026-04-01', deliveryDate: null, driverIndex: 27, group: 'dispatched' },
  { trackingNumber: 'SR-8E3F5G7H', status: 'dispatched', origin: 'Seattle, WA', destination: 'Spokane, WA', dispatchDate: '2026-04-01', deliveryDate: null, driverIndex: 33, group: 'dispatched' },
  { trackingNumber: 'SR-6J1K2L4M', status: 'dispatched', origin: 'Atlanta, GA', destination: 'Savannah, GA', dispatchDate: '2026-04-01', deliveryDate: null, driverIndex: 39, group: 'dispatched' },
  { trackingNumber: 'SR-5N8P9Q3R', status: 'dispatched', origin: 'Denver, CO', destination: 'Colorado Springs, CO', dispatchDate: '2026-04-01', deliveryDate: null, driverIndex: 45, group: 'dispatched' },
  { trackingNumber: 'SR-1S4T7U2V', status: 'dispatched', origin: 'Miami, FL', destination: 'Tampa, FL', dispatchDate: '2026-04-01', deliveryDate: null, driverIndex: 52, group: 'dispatched' },
  { trackingNumber: 'SR-3W6X8Y1Z', status: 'dispatched', origin: 'San Francisco, CA', destination: 'San Jose, CA', dispatchDate: '2026-04-02', deliveryDate: null, driverIndex: 58, group: 'dispatched' },
  { trackingNumber: 'SR-7A2B4C9D', status: 'dispatched', origin: 'Houston, TX', destination: 'New Orleans, LA', dispatchDate: '2026-04-02', deliveryDate: null, driverIndex: 64, group: 'dispatched' },
  { trackingNumber: 'SR-4E6F1G3H', status: 'dispatched', origin: 'Portland, OR', destination: 'Eugene, OR', dispatchDate: '2026-04-02', deliveryDate: null, driverIndex: 70, group: 'dispatched' },
  { trackingNumber: 'SR-2J5K8L9M', status: 'dispatched', origin: 'Nashville, TN', destination: 'Memphis, TN', dispatchDate: '2026-04-02', deliveryDate: null, driverIndex: 76, group: 'dispatched' },
  { trackingNumber: 'SR-6N1P3Q5R', status: 'dispatched', origin: 'Las Vegas, NV', destination: 'Reno, NV', dispatchDate: '2026-04-02', deliveryDate: null, driverIndex: 82, group: 'dispatched' },
  { trackingNumber: 'SR-8S2T4U7V', status: 'dispatched', origin: 'Detroit, MI', destination: 'Grand Rapids, MI', dispatchDate: '2026-04-02', deliveryDate: null, driverIndex: 88, group: 'dispatched' },
  { trackingNumber: 'SR-9W1X3Y6Z', status: 'dispatched', origin: 'Boston, MA', destination: 'Providence, RI', dispatchDate: '2026-04-02', deliveryDate: null, driverIndex: 94, group: 'dispatched' },
  { trackingNumber: 'SR-5A7B2C4D', status: 'dispatched', origin: 'Charlotte, NC', destination: 'Greensboro, NC', dispatchDate: '2026-04-02', deliveryDate: null, driverIndex: 100, group: 'dispatched' },
  { trackingNumber: 'SR-3E9F6G8H', status: 'dispatched', origin: 'Minneapolis, MN', destination: 'Madison, WI', dispatchDate: '2026-04-02', deliveryDate: null, driverIndex: 106, group: 'dispatched' },

  // ═══════════════════════════════════════════════════════════════════════════
  // IN TRANSIT (22) — dispatch dates late March 2026, no delivery date
  // ═══════════════════════════════════════════════════════════════════════════
  { trackingNumber: 'SR-1J4K7L9M', status: 'in_transit', origin: 'New York, NY', destination: 'Miami, FL', dispatchDate: '2026-03-28', deliveryDate: null, driverIndex: 2, group: 'in_transit' },
  { trackingNumber: 'SR-6N3P8Q2R', status: 'in_transit', origin: 'Chicago, IL', destination: 'Los Angeles, CA', dispatchDate: '2026-03-27', deliveryDate: null, driverIndex: 8, group: 'in_transit' },
  { trackingNumber: 'SR-4S1T5U8V', status: 'in_transit', origin: 'Seattle, WA', destination: 'Dallas, TX', dispatchDate: '2026-03-29', deliveryDate: null, driverIndex: 15, group: 'in_transit' },
  { trackingNumber: 'SR-7W9X2Y3Z', status: 'in_transit', origin: 'Denver, CO', destination: 'Kansas City, MO', dispatchDate: '2026-03-30', deliveryDate: null, driverIndex: 21, group: 'in_transit' },
  { trackingNumber: 'SR-2A5B8C1D', status: 'in_transit', origin: 'Atlanta, GA', destination: 'Charlotte, NC', dispatchDate: '2026-03-31', deliveryDate: null, driverIndex: 28, group: 'in_transit' },
  { trackingNumber: 'SR-9E3F6G4H', status: 'in_transit', origin: 'Houston, TX', destination: 'El Paso, TX', dispatchDate: '2026-03-28', deliveryDate: null, driverIndex: 34, group: 'in_transit' },
  { trackingNumber: 'SR-5J7K1L8M', status: 'in_transit', origin: 'Portland, OR', destination: 'San Francisco, CA', dispatchDate: '2026-03-29', deliveryDate: null, driverIndex: 40, group: 'in_transit' },
  { trackingNumber: 'SR-3N6P4Q9R', status: 'in_transit', origin: 'Phoenix, AZ', destination: 'Las Vegas, NV', dispatchDate: '2026-03-30', deliveryDate: null, driverIndex: 46, group: 'in_transit' },
  { trackingNumber: 'SR-8S2T7U5V', status: 'in_transit', origin: 'Los Angeles, CA', destination: 'Portland, OR', dispatchDate: '2026-03-27', deliveryDate: null, driverIndex: 53, group: 'in_transit' },
  { trackingNumber: 'SR-1W4X9Y6Z', status: 'in_transit', origin: 'Miami, FL', destination: 'Atlanta, GA', dispatchDate: '2026-03-31', deliveryDate: null, driverIndex: 59, group: 'in_transit' },
  { trackingNumber: 'SR-6A8B3C5D', status: 'in_transit', origin: 'Dallas, TX', destination: 'Denver, CO', dispatchDate: '2026-03-28', deliveryDate: null, driverIndex: 65, group: 'in_transit' },
  { trackingNumber: 'SR-4E7F2G1H', status: 'in_transit', origin: 'Boston, MA', destination: 'Washington, DC', dispatchDate: '2026-03-29', deliveryDate: null, driverIndex: 71, group: 'in_transit' },
  { trackingNumber: 'SR-9J5K3L6M', status: 'in_transit', origin: 'San Diego, CA', destination: 'Phoenix, AZ', dispatchDate: '2026-03-30', deliveryDate: null, driverIndex: 77, group: 'in_transit' },
  { trackingNumber: 'SR-2N1P7Q8R', status: 'in_transit', origin: 'Nashville, TN', destination: 'St. Louis, MO', dispatchDate: '2026-03-31', deliveryDate: null, driverIndex: 83, group: 'in_transit' },
  { trackingNumber: 'SR-7S4T9U3V', status: 'in_transit', origin: 'Minneapolis, MN', destination: 'Chicago, IL', dispatchDate: '2026-03-28', deliveryDate: null, driverIndex: 89, group: 'in_transit' },
  { trackingNumber: 'SR-5W8X6Y2Z', status: 'in_transit', origin: 'San Antonio, TX', destination: 'Austin, TX', dispatchDate: '2026-03-30', deliveryDate: null, driverIndex: 95, group: 'in_transit' },
  { trackingNumber: 'SR-3A9B1C7D', status: 'in_transit', origin: 'Columbus, OH', destination: 'Pittsburgh, PA', dispatchDate: '2026-03-29', deliveryDate: null, driverIndex: 101, group: 'in_transit' },
  { trackingNumber: 'SR-8E4F5G6H', status: 'in_transit', origin: 'Raleigh, NC', destination: 'Richmond, VA', dispatchDate: '2026-03-31', deliveryDate: null, driverIndex: 107, group: 'in_transit' },
  { trackingNumber: 'SR-1J6K2L3M', status: 'in_transit', origin: 'Salt Lake City, UT', destination: 'Boise, ID', dispatchDate: '2026-03-28', deliveryDate: null, driverIndex: 112, group: 'in_transit' },
  { trackingNumber: 'SR-4N7P9Q5R', status: 'in_transit', origin: 'Tampa, FL', destination: 'Jacksonville, FL', dispatchDate: '2026-03-30', deliveryDate: null, driverIndex: 115, group: 'in_transit' },
  { trackingNumber: 'SR-6S2T8U4V', status: 'in_transit', origin: 'New Orleans, LA', destination: 'Houston, TX', dispatchDate: '2026-03-29', deliveryDate: null, driverIndex: 117, group: 'in_transit' },
  { trackingNumber: 'SR-9W3X1Y7Z', status: 'in_transit', origin: 'Kansas City, MO', destination: 'Omaha, NE', dispatchDate: '2026-03-31', deliveryDate: null, driverIndex: 119, group: 'in_transit' },

  // ═══════════════════════════════════════════════════════════════════════════
  // DELIVERED (35) — dispatch dates Jan-Mar 2026, delivery 1-5 days later
  // ═══════════════════════════════════════════════════════════════════════════
  { trackingNumber: 'SR-2A4B6C8D', status: 'delivered', origin: 'Dallas, TX', destination: 'Houston, TX', dispatchDate: '2026-01-05', deliveryDate: '2026-01-06', driverIndex: 3, group: 'delivered' },
  { trackingNumber: 'SR-5E7F9G1H', status: 'delivered', origin: 'Los Angeles, CA', destination: 'San Francisco, CA', dispatchDate: '2026-01-08', deliveryDate: '2026-01-10', driverIndex: 9, group: 'delivered' },
  { trackingNumber: 'SR-8J3K5L7M', status: 'delivered', origin: 'Chicago, IL', destination: 'Detroit, MI', dispatchDate: '2026-01-12', deliveryDate: '2026-01-13', driverIndex: 16, group: 'delivered' },
  { trackingNumber: 'SR-1N4P6Q9R', status: 'delivered', origin: 'New York, NY', destination: 'Washington, DC', dispatchDate: '2026-01-15', deliveryDate: '2026-01-17', driverIndex: 22, group: 'delivered' },
  { trackingNumber: 'SR-3S5T7U2V', status: 'delivered', origin: 'Seattle, WA', destination: 'Portland, OR', dispatchDate: '2026-01-19', deliveryDate: '2026-01-20', driverIndex: 29, group: 'delivered' },
  { trackingNumber: 'SR-6W8X1Y4Z', status: 'delivered', origin: 'Atlanta, GA', destination: 'Jacksonville, FL', dispatchDate: '2026-01-22', deliveryDate: '2026-01-24', driverIndex: 35, group: 'delivered' },
  { trackingNumber: 'SR-9A2B3C7D', status: 'delivered', origin: 'Denver, CO', destination: 'Albuquerque, NM', dispatchDate: '2026-01-26', deliveryDate: '2026-01-28', driverIndex: 41, group: 'delivered' },
  { trackingNumber: 'SR-4E6F8G5H', status: 'delivered', origin: 'Miami, FL', destination: 'Tampa, FL', dispatchDate: '2026-01-29', deliveryDate: '2026-01-30', driverIndex: 47, group: 'delivered' },
  { trackingNumber: 'SR-7J9K2L1M', status: 'delivered', origin: 'Phoenix, AZ', destination: 'San Diego, CA', dispatchDate: '2026-02-02', deliveryDate: '2026-02-04', driverIndex: 54, group: 'delivered' },
  { trackingNumber: 'SR-2N5P8Q3R', status: 'delivered', origin: 'Houston, TX', destination: 'Dallas, TX', dispatchDate: '2026-02-05', deliveryDate: '2026-02-06', driverIndex: 60, group: 'delivered' },
  { trackingNumber: 'SR-4S7T1U6V', status: 'delivered', origin: 'Boston, MA', destination: 'New York, NY', dispatchDate: '2026-02-09', deliveryDate: '2026-02-11', driverIndex: 66, group: 'delivered' },
  { trackingNumber: 'SR-9W3X5Y8Z', status: 'delivered', origin: 'San Francisco, CA', destination: 'Los Angeles, CA', dispatchDate: '2026-02-12', deliveryDate: '2026-02-14', driverIndex: 72, group: 'delivered' },
  { trackingNumber: 'SR-1A6B2C4D', status: 'delivered', origin: 'Nashville, TN', destination: 'Atlanta, GA', dispatchDate: '2026-02-16', deliveryDate: '2026-02-18', driverIndex: 78, group: 'delivered' },
  { trackingNumber: 'SR-5E8F3G9H', status: 'delivered', origin: 'Portland, OR', destination: 'Seattle, WA', dispatchDate: '2026-02-19', deliveryDate: '2026-02-20', driverIndex: 84, group: 'delivered' },
  { trackingNumber: 'SR-7J1K4L6M', status: 'delivered', origin: 'Las Vegas, NV', destination: 'Phoenix, AZ', dispatchDate: '2026-02-23', deliveryDate: '2026-02-25', driverIndex: 90, group: 'delivered' },
  { trackingNumber: 'SR-3N9P7Q2R', status: 'delivered', origin: 'Charlotte, NC', destination: 'Richmond, VA', dispatchDate: '2026-02-26', deliveryDate: '2026-02-28', driverIndex: 96, group: 'delivered' },
  { trackingNumber: 'SR-8S5T2U1V', status: 'delivered', origin: 'Minneapolis, MN', destination: 'Milwaukee, WI', dispatchDate: '2026-03-02', deliveryDate: '2026-03-03', driverIndex: 102, group: 'delivered' },
  { trackingNumber: 'SR-6W4X9Y3Z', status: 'delivered', origin: 'Detroit, MI', destination: 'Cleveland, OH', dispatchDate: '2026-03-05', deliveryDate: '2026-03-06', driverIndex: 108, group: 'delivered' },
  { trackingNumber: 'SR-2A7B5C8D', status: 'delivered', origin: 'San Antonio, TX', destination: 'Houston, TX', dispatchDate: '2026-03-08', deliveryDate: '2026-03-09', driverIndex: 113, group: 'delivered' },
  { trackingNumber: 'SR-4E1F6G2H', status: 'delivered', origin: 'New York, NY', destination: 'Miami, FL', dispatchDate: '2026-01-10', deliveryDate: '2026-01-14', driverIndex: 4, group: 'delivered' },
  { trackingNumber: 'SR-9J8K3L5M', status: 'delivered', origin: 'Chicago, IL', destination: 'St. Louis, MO', dispatchDate: '2026-01-18', deliveryDate: '2026-01-20', driverIndex: 10, group: 'delivered' },
  { trackingNumber: 'SR-1N2P4Q7R', status: 'delivered', origin: 'Dallas, TX', destination: 'Oklahoma City, OK', dispatchDate: '2026-01-24', deliveryDate: '2026-01-26', driverIndex: 17, group: 'delivered' },
  { trackingNumber: 'SR-6S9T3U5V', status: 'delivered', origin: 'Denver, CO', destination: 'Salt Lake City, UT', dispatchDate: '2026-02-01', deliveryDate: '2026-02-03', driverIndex: 23, group: 'delivered' },
  { trackingNumber: 'SR-3W7X8Y1Z', status: 'delivered', origin: 'Atlanta, GA', destination: 'New Orleans, LA', dispatchDate: '2026-02-07', deliveryDate: '2026-02-10', driverIndex: 30, group: 'delivered' },
  { trackingNumber: 'SR-5A2B9C6D', status: 'delivered', origin: 'Seattle, WA', destination: 'Boise, ID', dispatchDate: '2026-02-14', deliveryDate: '2026-02-16', driverIndex: 36, group: 'delivered' },
  { trackingNumber: 'SR-8E4F7G3H', status: 'delivered', origin: 'Los Angeles, CA', destination: 'Las Vegas, NV', dispatchDate: '2026-02-20', deliveryDate: '2026-02-22', driverIndex: 42, group: 'delivered' },
  { trackingNumber: 'SR-7J5K6L9M', status: 'delivered', origin: 'Miami, FL', destination: 'Charlotte, NC', dispatchDate: '2026-02-25', deliveryDate: '2026-02-28', driverIndex: 48, group: 'delivered' },
  { trackingNumber: 'SR-4N1P2Q8R', status: 'delivered', origin: 'Phoenix, AZ', destination: 'Albuquerque, NM', dispatchDate: '2026-03-01', deliveryDate: '2026-03-03', driverIndex: 55, group: 'delivered' },
  { trackingNumber: 'SR-2S6T9U4V', status: 'delivered', origin: 'Boston, MA', destination: 'Philadelphia, PA', dispatchDate: '2026-03-04', deliveryDate: '2026-03-06', driverIndex: 61, group: 'delivered' },
  { trackingNumber: 'SR-9W8X5Y7Z', status: 'delivered', origin: 'Portland, OR', destination: 'Sacramento, CA', dispatchDate: '2026-03-09', deliveryDate: '2026-03-11', driverIndex: 67, group: 'delivered' },
  { trackingNumber: 'SR-1A3B7C2D', status: 'delivered', origin: 'Nashville, TN', destination: 'Memphis, TN', dispatchDate: '2026-03-12', deliveryDate: '2026-03-13', driverIndex: 73, group: 'delivered' },
  { trackingNumber: 'SR-6E5F4G8H', status: 'delivered', origin: 'Houston, TX', destination: 'Austin, TX', dispatchDate: '2026-03-15', deliveryDate: '2026-03-16', driverIndex: 79, group: 'delivered' },
  { trackingNumber: 'SR-3J2K1L9M', status: 'delivered', origin: 'San Francisco, CA', destination: 'San Jose, CA', dispatchDate: '2026-03-18', deliveryDate: '2026-03-19', driverIndex: 85, group: 'delivered' },
  { trackingNumber: 'SR-8N7P6Q5R', status: 'delivered', origin: 'Columbus, OH', destination: 'Indianapolis, IN', dispatchDate: '2026-03-21', deliveryDate: '2026-03-23', driverIndex: 91, group: 'delivered' },
  { trackingNumber: 'SR-5S4T3U2V', status: 'delivered', origin: 'Raleigh, NC', destination: 'Washington, DC', dispatchDate: '2026-03-24', deliveryDate: '2026-03-26', driverIndex: 97, group: 'delivered' },

  // ═══════════════════════════════════════════════════════════════════════════
  // EXCEPTION (10) — dispatch dates mid-March 2026, no delivery date
  // ═══════════════════════════════════════════════════════════════════════════
  { trackingNumber: 'SR-7W6X5Y4Z', status: 'exception', origin: 'New York, NY', destination: 'Chicago, IL', dispatchDate: '2026-03-14', deliveryDate: null, driverIndex: 6, group: 'exception' },
  { trackingNumber: 'SR-2A1B9C8D', status: 'exception', origin: 'Los Angeles, CA', destination: 'Seattle, WA', dispatchDate: '2026-03-15', deliveryDate: null, driverIndex: 19, group: 'exception' },
  { trackingNumber: 'SR-4E3F2G1H', status: 'exception', origin: 'Dallas, TX', destination: 'Memphis, TN', dispatchDate: '2026-03-16', deliveryDate: null, driverIndex: 32, group: 'exception' },
  { trackingNumber: 'SR-9J8K7L6M', status: 'exception', origin: 'Miami, FL', destination: 'New Orleans, LA', dispatchDate: '2026-03-13', deliveryDate: null, driverIndex: 44, group: 'exception' },
  { trackingNumber: 'SR-5N4P3Q2R', status: 'exception', origin: 'Denver, CO', destination: 'Minneapolis, MN', dispatchDate: '2026-03-17', deliveryDate: null, driverIndex: 51, group: 'exception' },
  { trackingNumber: 'SR-1S9T8U7V', status: 'exception', origin: 'Atlanta, GA', destination: 'Houston, TX', dispatchDate: '2026-03-14', deliveryDate: null, driverIndex: 63, group: 'exception' },
  { trackingNumber: 'SR-6W5X4Y3Z', status: 'exception', origin: 'San Francisco, CA', destination: 'Phoenix, AZ', dispatchDate: '2026-03-16', deliveryDate: null, driverIndex: 75, group: 'exception' },
  { trackingNumber: 'SR-3A2B1C9D', status: 'exception', origin: 'Boston, MA', destination: 'Nashville, TN', dispatchDate: '2026-03-15', deliveryDate: null, driverIndex: 87, group: 'exception' },
  { trackingNumber: 'SR-8E7F6G5H', status: 'exception', origin: 'Portland, OR', destination: 'Salt Lake City, UT', dispatchDate: '2026-03-13', deliveryDate: null, driverIndex: 99, group: 'exception' },
  { trackingNumber: 'SR-4J3K2L1M', status: 'exception', origin: 'Charlotte, NC', destination: 'Detroit, MI', dispatchDate: '2026-03-17', deliveryDate: null, driverIndex: 110, group: 'exception' },
];

// ─── Seed Function ─────────────────────────────────────────────────────────

export async function seedShipments(ctx: SwiftRouteContext, boards: SwiftRouteBoards): Promise<void> {
  console.log('[SwiftRoute] Seeding 100 shipment records...');

  const groupMap = {
    received: boards.shipReceivedGroupId,
    dispatched: boards.shipDispatchedGroupId,
    in_transit: boards.shipInTransitGroupId,
    delivered: boards.shipDeliveredGroupId,
    exception: boards.shipExceptionGroupId,
  };

  for (let i = 0; i < SHIPMENTS.length; i++) {
    const s = SHIPMENTS[i];
    const item = await Item.create({
      boardId: boards.shipmentTrackerId,
      groupId: groupMap[s.group],
      name: s.trackingNumber,
      position: i,
      createdBy: ctx.adminId,
    });

    const values: Array<{ itemId: number; columnId: number; value: unknown }> = [
      { itemId: item.id, columnId: boards.trackingNumberColId, value: { text: s.trackingNumber } },
      { itemId: item.id, columnId: boards.shipmentStatusColId, value: { label: s.status } },
      { itemId: item.id, columnId: boards.originColId, value: { text: s.origin } },
      { itemId: item.id, columnId: boards.destinationColId, value: { text: s.destination } },
      { itemId: item.id, columnId: boards.shipmentDriverColId, value: { userId: ctx.driverIds[s.driverIndex] } },
    ];

    if (s.dispatchDate) {
      values.push({ itemId: item.id, columnId: boards.dispatchDateColId, value: { date: s.dispatchDate } });
    }
    if (s.deliveryDate) {
      values.push({ itemId: item.id, columnId: boards.deliveryDateColId, value: { date: s.deliveryDate } });
    }

    await ColumnValue.bulkCreate(values);
  }

  console.log('[SwiftRoute] Created 100 shipment records');
}
