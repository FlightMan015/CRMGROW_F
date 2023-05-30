import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { User } from '../../models/user.model';
import {
  COMPANIES,
  PHONE_COUNTRIES,
  TIMEZONE
} from '../../constants/variable.constants';
import { Subscription } from 'rxjs';
import { PhoneInputComponent } from '../phone-input/phone-input.component';
import { UserService } from '../../services/user.service';
import { HelperService } from '../../services/helper.service';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { CountryISO } from 'ngx-intl-tel-input';

@Component({
  selector: 'app-team-member-profile',
  templateUrl: './team-member-profile.component.html',
  styleUrls: ['./team-member-profile.component.scss']
})
export class TeamMemberProfileComponent implements OnInit {
  user: User = new User();
  name = '';
  userEmail = '';
  phoneNumber = {};
  userCompany = '';
  website = '';
  timezone = '';
  address = '';
  countries: CountryISO[] = PHONE_COUNTRIES;
  CountryISO = CountryISO;
  saving = false;
  title = ''

  profileSubscription: Subscription;
  @ViewChild('phoneControl') phoneControl: PhoneInputComponent;

  constructor(
    private userService: UserService,
    private helperService: HelperService,
    private dialog: MatDialog,
    private toast: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data) {
      this.user = new User().deserialize(this.data.member);
      this.title = this.data.title;
    }
  }

  ngOnInit(): void {
    if (this.user.time_zone) {
      for (const timezone of TIMEZONE) {
        const index = timezone.timezones.findIndex(
          (item) => item['zone'] === this.user.time_zone
        );
        if (index >= 0) {
          this.timezone = timezone.timezones[index]['name'];
          return;
        }
      }
    }
    if (this.data.member.time_zone_info) {
      const time_zone = JSON.parse(this.data.member.time_zone_info);
      this.timezone = time_zone['name'];
    }
  }
}
