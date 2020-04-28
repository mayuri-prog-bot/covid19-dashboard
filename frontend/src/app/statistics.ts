export interface TotalStatistics {
  active: number;
  confirmed: number;
  deaths: number;
  recovered: number;
  lastUpdate: string;
}

export interface RegionStatistics {
  region: string;
  province?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  lastUpdate: Date;
  active: number;
  confirmed: number;
  deaths: number;
  recovered: number;
}

export interface TimeSeries {
  day: string;
  active: number;
  confirmed: number;
  deaths: number;
  recovered: number;
}
