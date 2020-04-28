import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { HttpClientModule } from '@angular/common/http';

import { AgmCoreModule } from '@agm/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material.module';
import { MapComponent } from './map/map.component';
import { ChartComponent } from './chart/chart.component';
import { LastUpdatedComponent } from './last-updated/last-updated.component';
import { TableComponent } from './table/table.component';
import { StatisticsComponent } from './statistics/statistics.component';

@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    ChartComponent,
    LastUpdatedComponent,
    TableComponent,
    StatisticsComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MaterialModule,
    AgmCoreModule.forRoot({
      apiKey:
        'AIzaSyASQBoZRVHLXUQZoHLcr1Vfxt_ro223t4U' + '&libraries=visualization',
    }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
