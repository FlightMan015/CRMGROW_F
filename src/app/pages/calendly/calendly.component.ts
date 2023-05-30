import { Component, OnInit, OnDestroy } from '@angular/core';
import { TabItem } from 'src/app/utils/data.types';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-calendly',
  templateUrl: './calendly.component.html',
  styleUrls: ['./calendly.component.scss']
})
export class CalendlyComponent implements OnInit, OnDestroy {
  tabs: TabItem[] = [
    { label: 'Event Types', id: 'types', icon: '' },
    { label: 'Scheduled Events', id: 'schedules', icon: '' },
    { label: 'Integrated Calendars', id: 'calendars', icon: '' }
  ];
  selectedTab: TabItem = this.tabs[0];

  constructor(private userService: UserService, private router: Router) {
    this.userService.profile$.subscribe((profile) => {
      if (profile.scheduler_info && !profile.scheduler_info.is_enabled) {
        this.router.navigate(['/home']);
      }
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  /**
   * Change the Tab -> This will change the view
   * @param tab : TabItem for the Task and Activity
   */
  changeTab(tab: TabItem): void {
    this.selectedTab = tab;
  }

  createEventType(): void {}
}
