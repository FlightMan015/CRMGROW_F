import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-connect-new-calendar',
  templateUrl: './connect-new-calendar.component.html',
  styleUrls: ['./connect-new-calendar.component.scss']
})
export class ConnectNewCalendarComponent implements OnInit {
  constructor(private userService: UserService) {}

  ngOnInit(): void {}

  connectCalendar(type: string): void {
    if (type === 'gmail' || type === 'outlook') {
      this.userService.requestCalendarSyncUrl(type).subscribe(
        (res) => {
          if (res && res['status']) {
            location.href = res['data'];
          }
        },
        () => {}
      );
    }
  }
}
