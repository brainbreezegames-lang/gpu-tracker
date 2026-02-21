import { Availability, Commitment, FilterState, GPUInstance, PriceHistory, SortState } from '../types';
import { getValueScoreRaw } from './gpuUtils';

export const fetchPriceHistory = async (): Promise<PriceHistory | null> => {
  try {
    const response = await fetch('/price-history.json');
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
};

export const fetchGPUData = async (): Promise<GPUInstance[]> => {
  const response = await fetch('/gpu-data.json');
  if (!response.ok) {
    throw new Error(`Failed to fetch GPU data: ${response.statusText}`);
  }
  const json = await response.json();

  return (json.data as GPUInstance[]).map((item) => ({
    ...item,
    commitment:   item.commitment   as Commitment,
    availability: item.availability as Availability,
    instanceName: item.instanceName ?? '',
    cpu:          item.cpu          ?? 0,
    ram:          item.ram          ?? 0,
  }));
};

export const filterData = (data: GPUInstance[], filters: FilterState): GPUInstance[] => {
  return data.filter((item) => {
    // Text search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match =
        item.model.toLowerCase().includes(q) ||
        item.provider.toLowerCase().includes(q) ||
        (item.instanceName ?? '').toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filters.models.length > 0     && !filters.models.includes(item.model))         return false;
    if (filters.providers.length > 0  && !filters.providers.includes(item.provider))   return false;
    if (filters.regions.length > 0    && !filters.regions.includes(item.region))       return false;
    if (filters.commitment.length > 0 && !filters.commitment.includes(item.commitment)) return false;
    if (item.pricePerHour < filters.minPrice || item.pricePerHour > filters.maxPrice)   return false;
    if (filters.minVram > 0 && item.vram < filters.minVram)                             return false;
    if (filters.gpuCounts.length > 0) {
      const hasEightPlus = filters.gpuCounts.includes(-1);
      const exactMatch   = filters.gpuCounts.includes(item.gpuCount);
      if (!exactMatch && !(hasEightPlus && item.gpuCount >= 8)) return false;
    }
    return true;
  });
};

const availabilityWeight: Record<string, number> = {
  [Availability.High]:   3,
  [Availability.Medium]: 2,
  [Availability.Low]:    1,
  [Availability.Out]:    0,
};

export const sortData = (data: GPUInstance[], sort: SortState): GPUInstance[] => {
  return [...data].sort((a, b) => {
    let cmp = 0;
    switch (sort.field) {
      case 'pricePerHour': cmp = a.pricePerHour - b.pricePerHour;                               break;
      case 'provider':     cmp = a.provider.localeCompare(b.provider);                          break;
      case 'model':        cmp = a.model.localeCompare(b.model);                                break;
      case 'vram':         cmp = a.vram - b.vram;                                               break;
      case 'gpuCount':     cmp = a.gpuCount - b.gpuCount;                                       break;
      case 'availability': cmp = (availabilityWeight[a.availability] ?? 0) -
                                 (availabilityWeight[b.availability] ?? 0);                      break;
      case 'valueScore':   cmp = (getValueScoreRaw(a).raw ?? -1) -
                                 (getValueScoreRaw(b).raw ?? -1);                                break;
      default:             cmp = 0;
    }
    return sort.direction === 'asc' ? cmp : -cmp;
  });
};
