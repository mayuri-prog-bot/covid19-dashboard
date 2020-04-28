import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  ViewChild,
  ViewEncapsulation,
  OnInit,
} from '@angular/core';
import * as d3 from 'd3';
import { StatisticsService } from '../statistics.service';
import { TimeSeries } from '../statistics';
import * as moment from 'moment';
import { BrowserStack } from 'protractor/built/driverProviders';

interface DataModel extends TimeSeries {
  columnDetails?: {
    name: string;
    column: string;
    yBegin: number;
    yEnd: number;
  };
  total?: number;
}

@Component({
  selector: 'app-chart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css'],
})
export class ChartComponent implements OnInit {
  @ViewChild('chart')
  private chartContainer: ElementRef;
  private margin = { top: 20, right: 20, bottom: 30, left: 40 };
  private timeSeries: TimeSeries[];

  constructor(private statisticsService: StatisticsService) {}

  ngOnInit(): void {
    this.statisticsService.getTimeSeries().subscribe((timeSeries) => {
      this.timeSeries = timeSeries;
      this.createChart();
    });
  }

  private createChart(): void {
    d3.select('svg').remove();

    const element = this.chartContainer.nativeElement;
    const contentWidth =
      element.offsetWidth - this.margin.left - this.margin.right;
    const contentHeight =
      element.offsetHeight - this.margin.top - this.margin.bottom;
    const data: DataModel[] = this.timeSeries.reverse();
    const svg = d3
      .select(element)
      .append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight);
    const innerColumns = {
      column1: ['confirmed'],
      column2: ['active'],
      column3: ['deaths', 'recovered'],
    };
    const x0 = d3.scaleTime().range([0, contentWidth]);
    const x1 = d3.scaleBand();
    const y = d3.scaleLinear().range([contentHeight, 0]);
    const xAxis = d3.axisBottom().scale(x0);
    const yAxis = d3.axisLeft().scale(y).tickFormat(d3.format('.2s'));
    const columnHeaders = d3.keys(data[0]).filter((key) => key != 'day');
    const color = d3
      .scaleOrdinal()
      .range([
        '#98abc5',
        '#8a89a6',
        '#7b6888',
        '#6b486b',
        '#a05d56',
        '#d0743c',
        '#ff8c00',
      ]);
    color.domain(columnHeaders);

    let yBegin;

    data.forEach(function (d) {
      var yColumn = new Array();

      d.columnDetails = columnHeaders.map((columnHeader) => {
        for (let innerColumn in innerColumns) {
          if (innerColumns[innerColumn].indexOf(columnHeader) >= 0) {
            if (!yColumn[innerColumn]) {
              yColumn[innerColumn] = 0;
            }
            yBegin = yColumn[innerColumn];
            yColumn[innerColumn] += +d[columnHeader];
            return {
              name: columnHeader,
              column: innerColumn,
              yBegin: yBegin,
              yEnd: +d[columnHeader] + yBegin,
            };
          }
        }
      });
      d.total = d3.max(d.columnDetails, function (d) {
        return d.yEnd;
      });
    });

    x0.domain([
      moment(data[0].day).toDate(),
      moment(data[data.length - 1].day).toDate(),
    ]);
    x1.domain(d3.keys(innerColumns)).range([0, contentWidth / data.length]);
    y.domain([
      0,
      d3.max(data, function (d) {
        return d.total;
      }),
    ]);

    svg
      .append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + contentHeight + ')')
      .call(xAxis);

    svg
      .append('g')
      .attr('class', 'y axis')
      .call(yAxis)
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '.7em')
      .style('text-anchor', 'end')
      .text('');

    var project_stackedbar = svg
      .selectAll('.project_stackedbar')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'g')
      .attr('transform', function (d) {
        return 'translate(' + x0(moment(d.day).toDate()) + ',0)';
      });

    project_stackedbar
      .selectAll('rect')
      .data(function (d) {
        return d.columnDetails;
      })
      .enter()
      .append('rect')
      .attr('width', x1.bandwidth())
      .attr('x', function (d) {
        return x1(d.column);
      })
      .attr('y', function (d) {
        return y(d.yEnd);
      })
      .attr('height', function (d) {
        return y(d.yBegin) - y(d.yEnd);
      })
      .style('fill', function (d) {
        return color(d.name);
      });

    var legend = svg
      .selectAll('.legend')
      .data(columnHeaders.slice().reverse())
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', function (d, i) {
        return 'translate(0,' + i * 20 + ')';
      });

    legend
      .append('rect')
      .attr('x', this.margin.left)
      .attr('width', 18)
      .attr('height', 18)
      .style('fill', color);

    legend
      .append('text')
      .attr('x', this.margin.left + 30)
      .attr('y', 9)
      .attr('dy', '.35em')
      // .style('text-anchor', 'end')
      .text(function (d) {
        return d;
      });
  }

  // private createChart(): void {
  //   d3.select('svg').remove();

  //   const element = this.chartContainer.nativeElement;
  //   const contentWidth =
  //     element.offsetWidth - this.margin.left - this.margin.right;
  //   const contentHeight =
  //     element.offsetHeight - this.margin.top - this.margin.bottom;
  //   const data = this.timeSeries;
  //   const svg = d3
  //     .select(element)
  //     .append('svg')
  //     .attr('width', element.offsetWidth)
  //     .attr('height', element.offsetHeight);
  //   const parse = d3.time.format('%Y-%m-%d').parse;
  //   const minDay = moment(data[0].day).toDate();
  //   const maxDay = moment(data[data.length - 1].day).toDate();
  //   var dataset = d3.layout.stack()(
  //     ['confirmed', 'deaths'].map((type) => {
  //       return data.map((timeSeries) => {
  //         return {
  //           x: moment(timeSeries.day).unix(),
  //           y: +timeSeries[type],
  //         };
  //       });
  //     })
  //   );
  //   var xScale = d3.time
  //     .scale()
  //     .domain([minDay, maxDay])
  //     .rangeRound([0, contentWidth - this.margin.left - this.margin.right]);
  //   var yScale = d3.scale
  //     .linear()
  //     .domain([
  //       0,
  //       d3.max(dataset, function (d) {
  //         return d3.max(d, function (d) {
  //           return d.y0 + d.y;
  //         });
  //       }),
  //     ])
  //     .range([contentHeight - this.margin.bottom - this.margin.top, 0]);

  //   var xAxis = d3.svg
  //     .axis()
  //     .scale(xScale)
  //     .orient('bottom')
  //     .ticks(d3.time.days, 1);

  //   var yAxis = d3.svg.axis().scale(yScale).orient('left').ticks(10);

  //   //Easy colors accessible via a 10-step ordinal scale
  //   var colors = d3.scale.category10();
  //   var color_hash = {
  //     0: ['Confirmed', '#1f77b4'],
  //     1: ['Deaths', '#2ca02c'],
  //     2: ['Decline', '#ff7f0e'],
  //   };
  //   // Add a group for each row of data
  //   var groups = svg
  //     .selectAll('g')
  //     .data(dataset)
  //     .enter()
  //     .append('g')
  //     .attr('class', 'rgroups')
  //     .attr(
  //       'transform',
  //       'translate(' +
  //         this.margin.left +
  //         ',' +
  //         (contentHeight - this.margin.bottom) +
  //         ')'
  //     )
  //     .style('fill', function (d, i) {
  //       return color_hash[dataset.indexOf(d)][1];
  //     });

  //   // Add a rect for each data value
  //   var rects = groups
  //     .selectAll('rect')
  //     .data(function (d) {
  //       return d;
  //     })
  //     .enter()
  //     .append('rect')
  //     .attr('width', 2)
  //     .style('fill-opacity', 1e-6);

  //   rects
  //     .transition()
  //     .duration(function (d, i) {
  //       return 500 * i;
  //     })
  //     .ease('linear')
  //     .attr('x', function (d) {
  //       return xScale(new Date(d['day']));
  //     })
  //     .attr('y', function (d: d3.layout.stack.Value) {
  //       return -(
  //         -yScale(d.y0) -
  //         yScale(d.y) +
  //         (contentHeight - this.this.margin.top - this.margin.bottom) * 2
  //       );
  //     })
  //     .attr('height', function (d: d3.layout.stack.Value) {
  //       return (
  //         -yScale(d.y) + (this.height - this.margin.top - this.margin.bottom)
  //       );
  //     })
  //     .attr('width', 15)
  //     .style('fill-opacity', 1);

  //   svg
  //     .append('g')
  //     .attr('class', 'x axis')
  //     .attr(
  //       'transform',
  //       'translate(40,' + (contentHeight - this.margin.bottom) + ')'
  //     )
  //     .call(xAxis);

  //   svg
  //     .append('g')
  //     .attr('class', 'y axis')
  //     .attr(
  //       'transform',
  //       'translate(' + this.margin.left + ',' + this.margin.top + ')'
  //     )
  //     .call(yAxis);

  //   // adding legend

  //   var legend = svg
  //     .append('g')
  //     .attr('class', 'legend')
  //     .attr('x', contentWidth - this.margin.right - 65)
  //     .attr('y', 25)
  //     .attr('height', 100)
  //     .attr('width', 100);

  //   legend
  //     .selectAll('g')
  //     .data(dataset)
  //     .enter()
  //     .append('g')
  //     .each(function (d, i) {
  //       var g = d3.select(this);
  //       g.append('rect')
  //         .attr('x', contentWidth - this.margin.right - 65)
  //         .attr('y', i * 25 + 10)
  //         .attr('width', 10)
  //         .attr('height', 10)
  //         .style('fill', color_hash[String(i)][1]);

  //       g.append('text')
  //         .attr('x', contentWidth - this.margin.right - 50)
  //         .attr('y', i * 25 + 20)
  //         .attr('height', 30)
  //         .attr('width', 100)
  //         .style('fill', color_hash[String(i)][1])
  //         .text(color_hash[String(i)][0]);
  //     });

  //   svg
  //     .append('text')
  //     .attr('transform', 'rotate(-90)')
  //     .attr('y', 0 - 5)
  //     .attr('x', 0 - contentHeight / 2)
  //     .attr('dy', '1em')
  //     .text('Number of Messages');

  //   svg
  //     .append('text')
  //     .attr('class', 'xtext')
  //     .attr('x', contentWidth / 2 - this.margin.left)
  //     .attr('y', contentHeight - 5)
  //     .attr('text-anchor', 'middle')
  //     .text('Days');

  //   svg
  //     .append('text')
  //     .attr('class', 'title')
  //     .attr('x', contentWidth / 2)
  //     .attr('y', 20)
  //     .attr('text-anchor', 'middle')
  //     .style('font-size', '16px')
  //     .style('text-decoration', 'underline')
  //     .text('Number of messages per day.');
  // }

  // private createChart(): void {
  //   d3.select('svg').remove();

  //   const element = this.chartContainer.nativeElement;
  //   const contentWidth =
  //     element.offsetWidth - this.margin.left - this.margin.right;
  //   const contentHeight =
  //     element.offsetHeight - this.margin.top - this.margin.bottom;
  //   const data = this.timeSeries;
  //   const svg = d3
  //     .select(element)
  //     .append('svg')
  //     .attr('width', element.offsetWidth)
  //     .attr('height', element.offsetHeight);
  //   const parse = d3.time.format('%Y-%m-%d').parse;

  //   // Transpose the data into layers
  //   var dataset = d3.layout.stack<Date, d3.layout.stack.Value[]>()(
  //     ['confirmed', 'deaths'].map((type) => {
  //       return data.map<d3.layout.stack.Value>((timeSeries) => {
  //         return {
  //           x: parse(timeSeries.day),
  //           y: +timeSeries[type],
  //         };
  //       });
  //     })
  //   );

  //   // Set x, y and colors
  //   var x = d3.scale
  //     .ordinal()
  //     .domain(
  //       dataset[0].map(function (d) {
  //         return d.x;
  //       })
  //     )
  //     .rangeRoundBands(
  //       [0, contentWidth - this.margin.left - this.margin.right],
  //       0.02
  //     );

  //   var y = d3.scale
  //     .linear()
  //     .domain([
  //       0,
  //       d3.max(dataset, function (d) {
  //         return d3.max(d, function (d) {
  //           return d.y0 + d.y;
  //         });
  //       }),
  //     ])
  //     .range([contentHeight - this.margin.top - this.margin.bottom, 0]);

  //   var colors = ['b33040', '#d25c4d', '#f2b447', '#d9d574'];

  //   // Define and draw axes
  //   var yAxis = d3.svg
  //     .axis()
  //     .scale(y)
  //     .orient('left')
  //     // .ticks(6)
  //     .tickSize(-contentWidth, 0)
  //     .tickFormat(function (d) {
  //       return d;
  //     });

  //   var xAxis = d3.svg
  //     .axis()
  //     .scale(x)
  //     .orient('bottom')
  //     .tickFormat(d3.time.format('%Y-%m-%d'));

  //   svg.append('g').attr('class', 'y axis').call(yAxis);

  //   svg
  //     .append('g')
  //     .attr('class', 'x axis')
  //     .attr('transform', 'translate(0,' + contentHeight + ')')
  //     .call(xAxis);

  //   var groups = svg
  //     .selectAll('g.cost')
  //     .data(dataset)
  //     .enter()
  //     .append('g')
  //     .attr('class', 'cost')
  //     .style('fill', function (d, i) {
  //       return colors[i];
  //     });

  //   var rect = groups
  //     .selectAll('rect')
  //     .data(function (d) {
  //       return d;
  //     })
  //     .enter()
  //     .append('rect')
  //     .attr('x', function (d) {
  //       return x(d.x);
  //     })
  //     .attr('y', function (d) {
  //       return y(d.y0 + d.y);
  //     })
  //     .attr('height', function (d) {
  //       return y(d.y0) - y(d.y0 + d.y);
  //     })
  //     .attr('width', x.rangeBand())
  //     .on('mouseover', function () {
  //       tooltip.style('display', null);
  //     })
  //     .on('mouseout', function () {
  //       tooltip.style('display', 'none');
  //     })
  //     .on('mousemove', function (d) {
  //       var xPosition = d3.mouse(this)[0] - 15;
  //       var yPosition = d3.mouse(this)[1] - 25;
  //       tooltip.attr(
  //         'transform',
  //         'translate(' + xPosition + ',' + yPosition + ')'
  //       );
  //       tooltip.select('text').text(d.y);
  //     });

  //   // Draw legend
  //   var legend = svg
  //     .selectAll('.legend')
  //     .data(colors)
  //     .enter()
  //     .append('g')
  //     .attr('class', 'legend')
  //     .attr('transform', function (d, i) {
  //       return 'translate(30,' + i * 19 + ')';
  //     });

  //   legend
  //     .append('rect')
  //     .attr('x', width - 18)
  //     .attr('width', 18)
  //     .attr('height', 18)
  //     .style('fill', function (d, i) {
  //       return colors.slice().reverse()[i];
  //     });

  //   legend
  //     .append('text')
  //     .attr('x', width + 5)
  //     .attr('y', 9)
  //     .attr('dy', '.35em')
  //     .style('text-anchor', 'start')
  //     .text(function (d, i) {
  //       switch (i) {
  //         case 0:
  //           return 'Anjou pears';
  //         case 1:
  //           return 'Naval oranges';
  //         case 2:
  //           return 'McIntosh apples';
  //         case 3:
  //           return 'Red Delicious apples';
  //       }
  //     });

  //   // Prep the tooltip bits, initial display is hidden
  //   var tooltip = svg
  //     .append('g')
  //     .attr('class', 'tooltip')
  //     .style('display', 'none');

  //   tooltip
  //     .append('rect')
  //     .attr('width', 30)
  //     .attr('height', 20)
  //     .attr('fill', 'white')
  //     .style('opacity', 0.5);

  //   tooltip
  //     .append('text')
  //     .attr('x', 15)
  //     .attr('dy', '1.2em')
  //     .style('text-anchor', 'middle')
  //     .attr('font-size', '12px')
  //     .attr('font-weight', 'bold');
  // }

  // private createChart(): void {
  //   d3.select('svg').remove();

  //   const element = this.chartContainer.nativeElement;
  //   // const data = this.data;

  //   const svg = d3
  //     .select(element)
  //     .append('svg')
  //     .attr('width', element.offsetWidth)
  //     .attr('height', element.offsetHeight);

  //   const contentWidth =
  //     element.offsetWidth - this.margin.left - this.margin.right;
  //   const contentHeight =
  //     element.offsetHeight - this.margin.top - this.margin.bottom;

  //   // const x = d3
  //   //   .scaleBand()
  //   //   .rangeRound([0, contentWidth])
  //   //   .padding(0.1)
  //   //   .domain(data.map((d) => d.letter));

  //   // const y = d3
  //   //   .scaleLinear()
  //   //   .rangeRound([contentHeight, 0])
  //   //   .domain([0, d3.max(data, (d) => d.frequency)]);

  //   // const g = svg
  //   //   .append('g')
  //   //   .attr(
  //   //     'transform',
  //   //     'translate(' + this.margin.left + ',' + this.margin.top + ')'
  //   //   );

  //   // g.append('g')
  //   //   .attr('class', 'axis axis--x')
  //   //   .attr('transform', 'translate(0,' + contentHeight + ')')
  //   //   .call(d3.axisBottom(x));

  //   // g.append('g')
  //   //   .attr('class', 'axis axis--y')
  //   //   .call(d3.axisLeft(y).ticks(10, '%'))
  //   //   .append('text')
  //   //   .attr('transform', 'rotate(-90)')
  //   //   .attr('y', 6)
  //   //   .attr('dy', '0.71em')
  //   //   .attr('text-anchor', 'end')
  //   //   .text('Frequency');

  //   // g.selectAll('.bar')
  //   //   .data(data)
  //   //   .enter()
  //   //   .append('rect')
  //   //   .attr('class', 'bar')
  //   //   .attr('x', (d) => x(d.letter))
  //   //   .attr('y', (d) => y(d.frequency))
  //   //   .attr('width', x.bandwidth())
  //   //   .attr('height', (d) => contentHeight - y(d.frequency));

  //   // var margin = {
  //   //   top: 20,
  //   //   right: 160,
  //   //   bottom: 35,
  //   //   left: 30,
  //   // };

  //   // var width = 960 - margin.left - margin.right,
  //   //   height = 500 - margin.top - margin.bottom;

  //   // const svg = d3
  //   //   .select('body')
  //   //   .append('svg')
  //   //   .attr('width', width + margin.left + margin.right)
  //   //   .attr('height', height + margin.top + margin.bottom)
  //   //   .append('g')
  //   //   .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  //   /* Data in strings like it would be if imported from a csv */

  //   // var data = [
  //   //   {
  //   //     day: '2020-20-01',
  //   //     confirmed: 100,
  //   //     deaths: 4,
  //   //   },
  //   //   {
  //   //     day: '2020-20-02',
  //   //     confirmed: 200,
  //   //     deaths: 500,
  //   //   },
  //   //   {
  //   //     day: '2020-20-03',
  //   //     confirmed: 400,
  //   //     deaths: 5,
  //   //   },
  //   // ];

  //   // var parse = d3.timeFormat('%Y-%m-%d');

  //   // const data = this.timeSeries;

  //   // data.forEach((row) => {
  //   //   row.day = moment(row.day).startOf('day').toDate();
  //   // });

  //   // // Transpose the data into layers
  //   // const series = d3
  //   //   .stack()
  //   //   .keys(['active', 'confirmed', 'deaths', 'recovered'])(data)
  //   //   .map((d) => (d.forEach((v) => (v.key = d.key)), d));

  //   // debugger;
  //   // const x = d3
  //   //   .scaleBand()
  //   //   .domain(data.map((d) => d.day))
  //   //   .range([this.margin.left, contentWidth - this.margin.right])
  //   //   .padding(0.1);

  //   // const x = d3
  //   //   .scaleTime()
  //   //   .domain([d3.min(data.map((d) => d.day)), d3.max(data.map((d) => d.day))])
  //   //   .rangeRound([0, contentWidth - this.margin.right])
  //   //   .nice();

  //   // const y = d3
  //   //   .scaleLinear()
  //   //   .domain([0, d3.max(series, (d) => d3.max(d, (d) => d[1]))])
  //   //   .rangeRound([contentHeight - this.margin.bottom, this.margin.top]);

  //   // const color = d3
  //   //   .scaleOrdinal()
  //   //   .domain(series.map((d) => d.key))
  //   //   .range(d3.schemeSpectral[series.length])
  //   //   .unknown('#ccc');

  //   // const xAxis = (g) =>
  //   //   g
  //   //     .attr('transform', `translate(0,${contentHeight - this.margin.bottom})`)
  //   //     .call(d3.axisBottom(x).tickSizeOuter(0))
  //   //     .call((g) => g.selectAll('.domain').remove());

  //   // const yAxis = (g) =>
  //   //   g
  //   //     .attr('transform', `translate(${this.margin.left},0)`)
  //   //     .call(d3.axisLeft(y).ticks(null, 's'))
  //   //     .call((g) => g.selectAll('.domain').remove());

  //   // const formatValue = (x) => (isNaN(x) ? 'N/A' : x.toLocaleString('en'));

  //   // // const svg = d3.create('svg').attr('viewBox', [0, 0, width, height]);

  //   // svg
  //   //   .append('g')
  //   //   .selectAll('g')
  //   //   .data(series)
  //   //   .join('g')
  //   //   .attr('fill', (d) => color(d.key))
  //   //   .selectAll('rect')
  //   //   .data((d) => d)
  //   //   .join('rect')
  //   //   .attr('x', (d, i) => x(d.data.name))
  //   //   .attr('y', (d) => y(d[1]))
  //   //   .attr('height', (d) => y(d[0]) - y(d[1]))
  //   //   // .attr('width', x.bandwidth())
  //   //   .append('title')
  //   //   .text((d) => `${d.data.name} ${d.key} ${formatValue(d.data[d.key])}`);

  //   // svg.append('g').call(xAxis);

  //   // svg.append('g').call(yAxis);

  //   // // Set x, y and colors
  //   // var x = d3
  //   //   .scaleOrdinal()
  //   //   .domain(
  //   //     dataset[0].map(function (d) {
  //   //       return d.x;
  //   //     })
  //   //   )
  //   //   .rangeRoundBands([10, contentWidth - 10], 0.02);

  //   // var y = d3
  //   //   .scaleLinear()
  //   //   .domain([
  //   //     0,
  //   //     d3.max(dataset, function (d) {
  //   //       return d3.max(d, function (d) {
  //   //         return d.y0 + d.y;
  //   //       });
  //   //     }),
  //   //   ])
  //   //   .range([contentHeight, 0]);

  //   // var colors = ['b33040', '#d25c4d', '#f2b447', '#d9d574'];

  //   // // Define and draw axes
  //   // var yAxis = d3.svg
  //   //   .axis()
  //   //   .scale(y)
  //   //   .orient('left')
  //   //   // .ticks(6)
  //   //   .tickSize(-contentWidth, 0, 0)
  //   //   .tickFormat(function (d) {
  //   //     return d;
  //   //   });

  //   // var xAxis = d3.svg
  //   //   .axis()
  //   //   .scale(x)
  //   //   .orient('bottom')
  //   //   .tickFormat(d3.timeFormat('%Y-%m-%d'));

  //   // svg.append('g').attr('class', 'y axis').call(yAxis);

  //   // svg
  //   //   .append('g')
  //   //   .attr('class', 'x axis')
  //   //   .attr('transform', 'translate(0,' + contentHeight + ')')
  //   //   .call(xAxis);

  //   // // Create groups for each series, rects for each segment
  //   // var groups = svg
  //   //   .selectAll('g.cost')
  //   //   .data(dataset)
  //   //   .enter()
  //   //   .append('g')
  //   //   .attr('class', 'cost')
  //   //   .style('fill', function (d, i) {
  //   //     return colors[i];
  //   //   });

  //   // var rect = groups
  //   //   .selectAll('rect')
  //   //   .data(function (d) {
  //   //     return d;
  //   //   })
  //   //   .enter()
  //   //   .append('rect')
  //   //   .attr('x', function (d) {
  //   //     return x(d.x);
  //   //   })
  //   //   .attr('y', function (d) {
  //   //     return y(d.y0 + d.y);
  //   //   })
  //   //   .attr('height', function (d) {
  //   //     return y(d.y0) - y(d.y0 + d.y);
  //   //   })
  //   //   .attr('width', x.rangeBand())
  //   //   .on('mouseover', function () {
  //   //     tooltip.style('display', null);
  //   //   })
  //   //   .on('mouseout', function () {
  //   //     tooltip.style('display', 'none');
  //   //   })
  //   //   .on('mousemove', function (d) {
  //   //     var xPosition = d3.mouse(this)[0] - 15;
  //   //     var yPosition = d3.mouse(this)[1] - 25;
  //   //     tooltip.attr(
  //   //       'transform',
  //   //       'translate(' + xPosition + ',' + yPosition + ')'
  //   //     );
  //   //     tooltip.select('text').text(d.y);
  //   //   });

  //   // // Draw legend
  //   // var legend = svg
  //   //   .selectAll('.legend')
  //   //   .data(colors)
  //   //   .enter()
  //   //   .append('g')
  //   //   .attr('class', 'legend')
  //   //   .attr('transform', function (d, i) {
  //   //     return 'translate(30,' + i * 19 + ')';
  //   //   });

  //   // legend
  //   //   .append('rect')
  //   //   .attr('x', contentWidth - 18)
  //   //   .attr('width', 18)
  //   //   .attr('height', 18)
  //   //   .style('fill', function (d, i) {
  //   //     return colors.slice().reverse()[i];
  //   //   });

  //   // legend
  //   //   .append('text')
  //   //   .attr('x', contentWidth + 5)
  //   //   .attr('y', 9)
  //   //   .attr('dy', '.35em')
  //   //   .style('text-anchor', 'start')
  //   //   .text(function (d, i) {
  //   //     switch (i) {
  //   //       case 0:
  //   //         return 'Confirmed cases';
  //   //       case 1:
  //   //         return 'Deaths';
  //   //     }
  //   //   });

  //   // // Prep the tooltip bits, initial display is hidden
  //   // var tooltip = svg
  //   //   .append('g')
  //   //   .attr('class', 'tooltip')
  //   //   .style('display', 'none');

  //   // tooltip
  //   //   .append('rect')
  //   //   .attr('width', 30)
  //   //   .attr('height', 20)
  //   //   .attr('fill', 'white')
  //   //   .style('opacity', 0.5);

  //   // tooltip
  //   //   .append('text')
  //   //   .attr('x', 15)
  //   //   .attr('dy', '1.2em')
  //   //   .style('text-anchor', 'middle')
  //   //   .attr('font-size', '12px')
  //   //   .attr('font-weight', 'bold');
  // }
}
