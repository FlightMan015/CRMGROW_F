import { Component, OnInit } from '@angular/core';
import { ChartType } from 'chart.js';
import { MultiDataSet, Label, Color } from 'ng2-charts';
import { interval, Subscription } from 'rxjs';
import { NotificationService } from 'src/app/services/notification.service';
@Component({
  selector: 'app-text-status',
  templateUrl: './text-status.component.html',
  styleUrls: ['./text-status.component.scss']
})
export class TextStatusComponent implements OnInit {
  chartLabels: Label[] = ['Failed', 'Pending', 'Delivered'];
  chartData: MultiDataSet = [[0, 0, 0]];
  chartType: ChartType = 'doughnut';
  chartOptions: any = {
    legend: {
      display: false
    },
    tooltips: {
      enabled: false
    }
  };
  chartColor: Color[] = [
    { backgroundColor: ['#FF0000', '#ffff00', '#00916E'] }
  ];
  failedStatus = [];
  total = 0;
  failed = 0;
  delivered = 0;
  pending = 0;

  loadSubscription: Subscription;
  constructor(private notificationService: NotificationService) {
    
  }

  ngOnInit(): void {
    this.getStatus();
    const everyOneMin$ = interval(60 * 1000);
    everyOneMin$.subscribe(() => {
      if (this.pending) {
        this.getStatus();
      }
    });
  }

  getStatus(): void {
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.notificationService
      .getTextDeliverStatus()
      .subscribe((data) => {
        if (data && data['sms']) {
          const texts = data['sms'];
          let failed = 0;
          let delivered = 0;
          let pending = 0;
          const failedTexts = [];
          texts.forEach((e) => {
            switch (e.status) {
              case 'pending':
                pending++;
                break;
              case 'delivered':
                delivered++;
                break;
              case 'undelivered':
                failed++;
                failedTexts.push(e);
            }
          });
          this.chartData = [[failed, pending, delivered]];
          this.failed = failed;
          this.pending = pending;
          this.delivered = delivered;
          this.total = failed + pending + delivered;
          this.failedStatus = failedTexts;
        }
      });
  }

  clear(): void {
    this.failedStatus = [];
  }

  fullName(e: any): string {
    if (e.first_name && e.last_name) {
      return e.first_name + ' ' + e.last_name;
    } else if (e.first_name) {
      return e.first_name;
    } else if (e.last_name) {
      return e.last_name;
    } else {
      return 'Unnamed Contact';
    }
  }
}
