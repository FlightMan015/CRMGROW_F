import { Component, OnInit } from '@angular/core';
import { ChartType } from 'chart.js';
import { MultiDataSet, Label, Color } from 'ng2-charts';
@Component({
  selector: 'app-email-status',
  templateUrl: './email-status.component.html',
  styleUrls: ['./email-status.component.scss']
})
export class EmailStatusComponent implements OnInit {
  chartLabels: Label[] = ['Failed', 'Delivered'];
  chartData: MultiDataSet = [[50, 450]];
  chartType: ChartType = 'doughnut';
  chartOptions: any = {
    legend: {
      display: false
    },
    tooltips: {
      enabled: false
    }
  };
  chartColor: Color[] = [{ backgroundColor: ['#FF0000', '#00916E'] }];
  sentSms = [
    {
      name: 'John Doe',
      cellPhone: '+16309844707',
      status: 'delivered',
      created_at: '11.25 at 7:37 PM'
    },
    {
      name: 'John Doe',
      cellPhone: '+16309844707',
      status: 'failed',
      created_at: '11.25 at 7:37 PM'
    },
    {
      name: 'John Doe',
      cellPhone: '+16309844707',
      status: 'delivered',
      created_at: '11.25 at 7:37 PM'
    },
    {
      name: 'John Doe',
      cellPhone: '+16309844707',
      status: 'failed',
      created_at: '11.25 at 7:37 PM'
    },
    {
      name: 'John Doe',
      cellPhone: '+16309844707',
      status: 'delivered',
      created_at: '11.25 at 7:37 PM'
    },
    {
      name: 'John Doe',
      cellPhone: '+16309844707',
      status: 'delivered',
      created_at: '11.25 at 7:37 PM'
    },
    {
      name: 'John Doe',
      cellPhone: '+16309844707',
      status: 'failed',
      created_at: '11.25 at 7:37 PM'
    },
    {
      name: 'John Doe',
      cellPhone: '+16309844707',
      status: 'failed',
      created_at: '11.25 at 7:37 PM'
    },
    {
      name: 'John Doe',
      cellPhone: '+16309844707',
      status: 'failed',
      created_at: '11.25 at 7:37 PM'
    },
    {
      name: 'John Doe',
      cellPhone: '+16309844707',
      status: 'delivered',
      created_at: '11.25 at 7:37 PM'
    }
  ];

  constructor() {}

  ngOnInit(): void {}

  clear(): void {
    this.sentSms = [];
  }
}
