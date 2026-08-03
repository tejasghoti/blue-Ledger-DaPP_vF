export interface MockProject {
  id: bigint;
  name: string;
  location: string;
  metadataHash: string;
  owner: `0x${string}`;
  status: number; // 0: PENDING, 1: AWAITING_VERIFICATION, 2: VERIFIED, 3: REJECTED
  lastSubmittedAt: bigint;
  carbonSequestered: bigint;
  creditsMinted: bigint;
  retiredAmount: bigint;
  rejectionReason: string;
  registrationTimestamp: bigint;
  decisionTimestamp: bigint;
  description: string;
  imageURL: string;
  coordinates: { lat: number; lng: number };
  ecosystem: 'Mangrove' | 'Seagrass' | 'Salt Marsh' | 'Other';
  pricePerCredit: bigint;
  availableQuantity: bigint;
}

export const MOCK_PROJECTS: MockProject[] = [
  {
    id: 1n,
    name: "Sundarbans Mangrove Delta Restoration",
    location: "West Bengal, India",
    metadataHash: "QmSundarbansMetadataHash123",
    owner: "0x9249f50f4AcA304DE750D062bB8a18ADA141A4f9",
    status: 2, // VERIFIED
    lastSubmittedAt: BigInt(Math.floor(Date.now() / 1000) - 86400 * 5),
    carbonSequestered: 4500n,
    creditsMinted: 4500n,
    retiredAmount: 1200n,
    rejectionReason: "",
    registrationTimestamp: BigInt(Math.floor(Date.now() / 1000) - 86400 * 30),
    decisionTimestamp: BigInt(Math.floor(Date.now() / 1000) - 86400 * 10),
    description: "Large-scale community-led tidal mangrove reforestation across 250 hectares of degraded coastal delta. High-density Rhizophora mucronata saplings with satellite NDVI tracking.",
    imageURL: "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=1200&q=80",
    coordinates: { lat: 21.9497, lng: 88.9007 },
    ecosystem: "Mangrove",
    pricePerCredit: 15n * 10n**6n, // 15 USDC
    availableQuantity: 3300n,
  },
  {
    id: 2n,
    name: "Gulf of Kutch Marine Carbon Sink",
    location: "Gujarat, India",
    metadataHash: "QmKutchMetadataHash456",
    owner: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    status: 2, // VERIFIED
    lastSubmittedAt: BigInt(Math.floor(Date.now() / 1000) - 86400 * 2),
    carbonSequestered: 2800n,
    creditsMinted: 2800n,
    retiredAmount: 600n,
    rejectionReason: "",
    registrationTimestamp: BigInt(Math.floor(Date.now() / 1000) - 86400 * 20),
    decisionTimestamp: BigInt(Math.floor(Date.now() / 1000) - 86400 * 4),
    description: "Coastal mudflat & Avicennia marina mangrove bio-shield protecting marine biodiversity while capturing heavy soil organic carbon.",
    imageURL: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    coordinates: { lat: 22.4707, lng: 70.0577 },
    ecosystem: "Mangrove",
    pricePerCredit: 18n * 10n**6n, // 18 USDC
    availableQuantity: 2200n,
  },
  {
    id: 3n,
    name: "Kerala Backwaters Wetland Conservation",
    location: "Kerala, India",
    metadataHash: "QmKeralaMetadataHash789",
    owner: "0x9249f50f4AcA304DE750D062bB8a18ADA141A4f9",
    status: 1, // AWAITING_VERIFICATION
    lastSubmittedAt: BigInt(Math.floor(Date.now() / 1000) - 3600 * 12),
    carbonSequestered: 1850n,
    creditsMinted: 0n,
    retiredAmount: 0n,
    rejectionReason: "",
    registrationTimestamp: BigInt(Math.floor(Date.now() / 1000) - 86400 * 8),
    decisionTimestamp: 0n,
    description: "Estuarine seagrass and mangrove ecosystem restoration aiming to protect inland water channels and create local eco-tourism livelihoods.",
    imageURL: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
    coordinates: { lat: 9.4981, lng: 76.3388 },
    ecosystem: "Seagrass",
    pricePerCredit: 12n * 10n**6n, // 12 USDC
    availableQuantity: 0n,
  },
  {
    id: 4n,
    name: "Andaman Islands Coral & Mangrove Sanctuary",
    location: "Andaman & Nicobar Islands",
    metadataHash: "QmAndamanMetadataHash101",
    owner: "0xF39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    status: 0, // PENDING
    lastSubmittedAt: 0n,
    carbonSequestered: 0n,
    creditsMinted: 0n,
    retiredAmount: 0n,
    rejectionReason: "",
    registrationTimestamp: BigInt(Math.floor(Date.now() / 1000) - 3600 * 4),
    decisionTimestamp: 0n,
    description: "Pristine island mangrove canopy expansion monitored via high-resolution drone multi-spectral aerial surveys.",
    imageURL: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80",
    coordinates: { lat: 11.6233, lng: 92.7265 },
    ecosystem: "Salt Marsh",
    pricePerCredit: 22n * 10n**6n, // 22 USDC
    availableQuantity: 0n,
  },
  {
    id: 5n,
    name: "Pichavaram Mangrove Forest Reserve",
    location: "Tamil Nadu, India",
    metadataHash: "QmPichavaramHash202",
    owner: "0x3C44CdD05aB519210544F6a44dB6371773049c1a",
    status: 2, // VERIFIED
    lastSubmittedAt: BigInt(Math.floor(Date.now() / 1000) - 86400 * 3),
    carbonSequestered: 5200n,
    creditsMinted: 5200n,
    retiredAmount: 1800n,
    rejectionReason: "",
    registrationTimestamp: BigInt(Math.floor(Date.now() / 1000) - 86400 * 45),
    decisionTimestamp: BigInt(Math.floor(Date.now() / 1000) - 86400 * 15),
    description: "One of the world's largest mangrove forests with complex water channel networks. Verified carbon sequestration via deep sediment core analysis.",
    imageURL: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    coordinates: { lat: 11.4284, lng: 79.7915 },
    ecosystem: "Mangrove",
    pricePerCredit: 20n * 10n**6n, // 20 USDC
    availableQuantity: 3400n,
  },
  {
    id: 6n,
    name: "Lakshadweep Seagrass & Coral Blue Shield",
    location: "Lakshadweep Islands",
    metadataHash: "QmLakshadweepHash303",
    owner: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    status: 2, // VERIFIED
    lastSubmittedAt: BigInt(Math.floor(Date.now() / 1000) - 86400 * 6),
    carbonSequestered: 3100n,
    creditsMinted: 3100n,
    retiredAmount: 950n,
    rejectionReason: "",
    registrationTimestamp: BigInt(Math.floor(Date.now() / 1000) - 86400 * 50),
    decisionTimestamp: BigInt(Math.floor(Date.now() / 1000) - 86400 * 12),
    description: "Submerged seagrass meadows capturing organic marine sediments with high biodiversity conservation indices.",
    imageURL: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80",
    coordinates: { lat: 10.5667, lng: 72.6417 },
    ecosystem: "Seagrass",
    pricePerCredit: 16n * 10n**6n, // 16 USDC
    availableQuantity: 2150n,
  },
  {
    id: 7n,
    name: "Mahanadi Delta Mangrove Protection",
    location: "Odisha, India",
    metadataHash: "QmMahanadiHash404",
    owner: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    status: 2, // VERIFIED
    lastSubmittedAt: BigInt(Math.floor(Date.now() / 1000) - 86400 * 1),
    carbonSequestered: 6400n,
    creditsMinted: 6400n,
    retiredAmount: 2100n,
    rejectionReason: "",
    registrationTimestamp: BigInt(Math.floor(Date.now() / 1000) - 86400 * 60),
    decisionTimestamp: BigInt(Math.floor(Date.now() / 1000) - 86400 * 18),
    description: "Cyclone protection mangrove belt restoration protecting coastal Odisha villages while generating high-density carbon offsets.",
    imageURL: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
    coordinates: { lat: 20.2961, lng: 86.7025 },
    ecosystem: "Mangrove",
    pricePerCredit: 24n * 10n**6n, // 24 USDC
    availableQuantity: 4300n,
  },
  {
    id: 8n,
    name: "Bhitarkanika Sanctuary Salt Marsh",
    location: "Odisha, India",
    metadataHash: "QmBhitarkanikaHash505",
    owner: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    status: 2, // VERIFIED
    lastSubmittedAt: BigInt(Math.floor(Date.now() / 1000) - 86400 * 4),
    carbonSequestered: 3900n,
    creditsMinted: 3900n,
    retiredAmount: 1100n,
    rejectionReason: "",
    registrationTimestamp: BigInt(Math.floor(Date.now() / 1000) - 86400 * 40),
    decisionTimestamp: BigInt(Math.floor(Date.now() / 1000) - 86400 * 8),
    description: "Ramsar wetland salt marsh restoration preserving saltwater crocodile habitats and sequestering blue carbon.",
    imageURL: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80",
    coordinates: { lat: 20.7167, lng: 86.8667 },
    ecosystem: "Salt Marsh",
    pricePerCredit: 19n * 10n**6n, // 19 USDC
    availableQuantity: 2800n,
  }
];
