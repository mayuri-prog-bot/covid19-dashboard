import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { TotalStatistics, RegionStatistics, TimeSeries } from './statistics';
import * as moment from 'moment';

interface ApiResponse<T> {
  status: String;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class StatisticsService {
  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };

  private readonly provinceMap = new Map<string, RegionStatistics[]>();
  private readonly citiesMap = new Map<
    string,
    Map<string, RegionStatistics[]>
  >();

  private readonly _regions = new BehaviorSubject<RegionStatistics[]>([]);
  private readonly _provinces = new BehaviorSubject<RegionStatistics[]>([]);
  private readonly _cities = new BehaviorSubject<RegionStatistics[]>([]);

  private readonly _top5USProvincies = new BehaviorSubject<RegionStatistics[]>(
    []
  );

  private readonly _selectedRegion = new BehaviorSubject<RegionStatistics>(
    null
  );
  private readonly _selectedProvince = new BehaviorSubject<RegionStatistics>(
    null
  );
  private readonly _selectedCity = new BehaviorSubject<RegionStatistics>(null);

  public readonly regions$ = this._regions.asObservable();
  public readonly provinces$ = this._provinces.asObservable();
  public readonly cities$ = this._cities.asObservable();

  public readonly top5USProvincies$ = this._top5USProvincies.asObservable();

  public readonly selectedRegion$ = this._selectedRegion.asObservable();
  public readonly selectedProvince$ = this._selectedProvince.asObservable();
  public readonly selectedCity$ = this._selectedCity.asObservable();

  public get regions(): RegionStatistics[] {
    return this._regions.getValue();
  }

  public get provinces(): RegionStatistics[] {
    return this._provinces.getValue();
  }

  public set provinces(value: RegionStatistics[]) {
    this._provinces.next(value);
  }

  public get cities(): RegionStatistics[] {
    return this._cities.getValue();
  }

  get selectedRegion(): RegionStatistics {
    return this._selectedRegion.getValue();
  }

  set selectedRegion(value: RegionStatistics) {
    this._selectedRegion.next(value);

    this.fetchProvincies(value.region).subscribe((provinces) => {
      this._provinces.next(provinces);
    });

    this.selectedProvince = null;
  }

  get selectedProvince(): RegionStatistics {
    return this._selectedProvince.getValue();
  }

  set selectedProvince(value: RegionStatistics) {
    this._selectedProvince.next(value);

    if (value && value.province) {
      this.fetchCities(value.region, value.province).subscribe((cities) => {
        this._cities.next(cities);
      });
    }

    this.selectedCity = null;
  }

  get selectedCity(): RegionStatistics {
    return this._selectedCity.getValue();
  }

  set selectedCity(value: RegionStatistics) {
    this._selectedCity.next(value);
  }

  constructor(private http: HttpClient) {
    this.fetchRegions().subscribe((regions) => {
      let active = 0;
      let confirmed = 0;
      let deaths = 0;
      let recovered = 0;

      regions.forEach((region) => {
        active += +region.active;
        confirmed += +region.confirmed;
        deaths += +region.deaths;
        recovered += +region.recovered;
      });

      const worldRegion = {
        region: 'World',
        province: null,
        city: null,
        latitude: 0,
        longitude: 0,
        active,
        confirmed,
        deaths,
        recovered,
        lastUpdate: moment().toDate(),
      };
      regions.splice(0, 0, worldRegion);

      this._regions.next(regions);

      this.selectedRegion = worldRegion;
    });
  }

  public fetchTotalStatistics(): Observable<TotalStatistics> {
    const url = `${environment.apiBaseUrl}/total`;

    return this.get<TotalStatistics>(url);
  }

  public fetchRegions(): Observable<RegionStatistics[]> {
    const existingRegions = this._regions.getValue();

    if (existingRegions && existingRegions.length > 0) {
      return of(existingRegions);
    }

    const url = `${environment.apiBaseUrl}/statistics`;

    return this.get<RegionStatistics[]>(url);
  }

  public fetchProvincies(region: string): Observable<RegionStatistics[]> {
    const existingProvincies = this.provinceMap.get(region);

    if (existingProvincies && existingProvincies.length > 0) {
      return of(existingProvincies);
    }

    const url = `${environment.apiBaseUrl}/statistics/${region}`;

    return this.get<RegionStatistics[]>(url).pipe(
      tap((provincies) => this.provinceMap.set(region, provincies))
    );
  }

  public fetchCities(
    region: string,
    province: string
  ): Observable<RegionStatistics[]> {
    const existingProvincies = this.citiesMap.get(region);

    if (existingProvincies) {
      const existingCities = existingProvincies.get(province);

      if (existingCities) {
        return of(existingCities);
      }
    }

    const url = `${environment.apiBaseUrl}/statistics/${region}/${province}`;

    return this.get<RegionStatistics[]>(url).pipe(
      tap((cities) => {
        if (!cities) {
          return;
        }

        let provincies = existingProvincies;

        if (!provincies) {
          provincies = new Map<string, RegionStatistics[]>();

          this.citiesMap.set(region, provincies);
        }

        let existingCities = provincies.get(province);

        if (!existingCities) {
          existingCities = [];

          provincies.set(province, existingCities);
        }

        cities.forEach((city) => {
          existingCities.push(city);
        });
      })
    );
  }

  public fetchCity(
    region: string,
    province: string,
    city: string
  ): Observable<RegionStatistics[]> {
    const url = `${environment.apiBaseUrl}/statistics/${region}/${province}/${city}`;

    return this.get<RegionStatistics[]>(url);
  }

  public selectTop5USStates() {
    this.fetchProvincies('US').subscribe((usProvincies) => {
      const top5USProvincies = usProvincies.slice(0, 5);

      this._top5USProvincies.next(top5USProvincies);
    });
  }

  public getTimeSeries(
    filterType?: 'region' | 'province' | 'city',
    filterValue?: string
  ): Observable<TimeSeries[]> {
    let url = `${environment.apiBaseUrl}/timeSeries`;

    if (filterType !== undefined && filterValue !== undefined) {
      url += `/?${filterType}=${filterValue}`;
    }

    return this.get<TimeSeries[]>(url);
  }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param result - optional value to return as the observable result
   */
  private handleError<T>(result?: T) {
    return (error: any): Observable<T> => {
      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  private get<T>(url): Observable<T> {
    return this.http.get<ApiResponse<T>>(url, this.httpOptions).pipe(
      map((response) => response.data),
      catchError(this.handleError<T>())
    );
  }
}
