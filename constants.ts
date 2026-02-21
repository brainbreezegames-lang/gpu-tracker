import { Availability, Commitment, GPUInstance } from './types';

export const PROVIDERS = [
  'Lambda Labs',
  'RunPod',
  'Vast.ai',
  'CoreWeave',
  'AWS',
  'GCP',
  'Azure',
  'FluidStack'
];

export const GPU_MODELS = [
  'H100 PCIe',
  'H100 SXM',
  'A100 80GB',
  'A100 40GB',
  'A6000',
  'RTX 4090',
  'L40S',
  'H200',
  'MI300X'
];

export const REGIONS = [
  'US-East',
  'US-West',
  'US-Central',
  'EU-West',
  'EU-Central',
  'Asia-Pacific'
];

// Mock Data Generator
export const MOCK_DATA: GPUInstance[] = [
  {
    id: '1',
    provider: 'Lambda Labs',
    model: 'H100 PCIe',
    vram: 80,
    pricePerHour: 1.99,
    region: 'US-West',
    commitment: Commitment.OnDemand,
    availability: Availability.Low,
    link: 'https://lambdalabs.com/',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '2',
    provider: 'RunPod',
    model: 'RTX 4090',
    vram: 24,
    pricePerHour: 0.69,
    region: 'US-Central',
    commitment: Commitment.OnDemand,
    availability: Availability.High,
    link: 'https://runpod.io/',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '3',
    provider: 'Vast.ai',
    model: 'RTX 4090',
    vram: 24,
    pricePerHour: 0.45,
    region: 'EU-West',
    commitment: Commitment.Spot,
    availability: Availability.High,
    link: 'https://vast.ai/',
    lastUpdated: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: '4',
    provider: 'CoreWeave',
    model: 'A100 40GB',
    vram: 40,
    pricePerHour: 1.10,
    region: 'US-East',
    commitment: Commitment.OnDemand,
    availability: Availability.Medium,
    link: 'https://coreweave.com/',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '5',
    provider: 'AWS',
    model: 'H100 SXM',
    vram: 80,
    pricePerHour: 4.50,
    region: 'US-East',
    commitment: Commitment.OnDemand,
    availability: Availability.High,
    link: 'https://aws.amazon.com/',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '6',
    provider: 'AWS',
    model: 'H100 SXM',
    vram: 80,
    pricePerHour: 2.80,
    region: 'US-East',
    commitment: Commitment.Reserved1Y,
    availability: Availability.High,
    link: 'https://aws.amazon.com/',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '7',
    provider: 'GCP',
    model: 'A100 80GB',
    vram: 80,
    pricePerHour: 3.67,
    region: 'Asia-Pacific',
    commitment: Commitment.OnDemand,
    availability: Availability.Out,
    link: 'https://cloud.google.com/',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '8',
    provider: 'RunPod',
    model: 'A6000',
    vram: 48,
    pricePerHour: 0.79,
    region: 'US-West',
    commitment: Commitment.OnDemand,
    availability: Availability.High,
    link: 'https://runpod.io/',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '9',
    provider: 'FluidStack',
    model: 'H100 SXM',
    vram: 80,
    pricePerHour: 2.30,
    region: 'EU-Central',
    commitment: Commitment.OnDemand,
    availability: Availability.Low,
    link: 'https://fluidstack.io/',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '10',
    provider: 'Lambda Labs',
    model: 'A100 80GB',
    vram: 80,
    pricePerHour: 1.29,
    region: 'US-East',
    commitment: Commitment.OnDemand,
    availability: Availability.Medium,
    link: 'https://lambdalabs.com/',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '11',
    provider: 'Azure',
    model: 'MI300X',
    vram: 192,
    pricePerHour: 3.80,
    region: 'US-West',
    commitment: Commitment.Spot,
    availability: Availability.Medium,
    link: 'https://azure.microsoft.com/',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '12',
    provider: 'Vast.ai',
    model: 'H100 PCIe',
    vram: 80,
    pricePerHour: 1.85,
    region: 'US-Central',
    commitment: Commitment.Spot,
    availability: Availability.Low,
    link: 'https://vast.ai/',
    lastUpdated: new Date().toISOString()
  }
];
