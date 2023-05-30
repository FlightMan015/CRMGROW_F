import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { CountryISO } from 'ngx-intl-tel-input';
import {
  COMPANIES,
  PHONE_COUNTRIES,
  WIN_TIMEZONE
} from 'src/app/constants/variable.constants';
import { User } from 'src/app/models/user.model';
import { PhoneInputComponent } from '../phone-input/phone-input.component';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { UserService } from 'src/app/services/user.service';
import { SelectCompanyComponent } from '../select-company/select-company.component';
import { HelperService } from 'src/app/services/helper.service';
import { ToastrService } from 'ngx-toastr';
import { AvatarEditorComponent } from '../avatar-editor/avatar-editor.component';

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss']
})
export class AddUserComponent implements OnInit {
  user: User = new User();
  type = '';
  name = '';
  userEmail = '';
  phoneNumber = {};
  userCompany = '';
  website = '';
  timezone = '';
  address = '';
  timezones = WIN_TIMEZONE;
  companies = COMPANIES;
  countries: CountryISO[] = PHONE_COUNTRIES;
  CountryISO = CountryISO;
  saving = false;
  defaultTimeZone = true;
  @ViewChild('phoneControl') phoneControl: PhoneInputComponent;

  constructor(
    private dialogRef: MatDialogRef<AddUserComponent>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private userService: UserService,
    private helperService: HelperService,
    private toast: ToastrService
  ) {
    if (data) {
      this.type = this.data?.type;
      if (this.type == 'edit') {
        this.user = this.data.editUser;
        this.name = this.user.user_name;
        this.userEmail = this.user.email;
        this.phoneNumber = this.user.phone;
        this.userCompany = this.user.company;
        this.website = this.user.learn_more;
        // this.timezone = this.user.time_zone_info;
        this.address = this.user.location;
        if (this.userCompany != 'Choose other') {
          this.companies[0] = this.userCompany;
        }
        const time_zone_info = JSON.parse(this.user.time_zone_info);

        this.timezones.some((ele) => {
          return ele.timezones.some((timezone) => {
            if (timezone.name === time_zone_info?.name) {
              this.defaultTimeZone = ele.country !== 'OTHER';
              this.timezone = JSON.stringify(timezone);
              return true;
            }
            if (timezone.tz_name === time_zone_info?.tz_name) {
              this.defaultTimeZone = ele.country !== 'OTHER';
              this.timezone = JSON.stringify(timezone);
              return true;
            }

            if (timezone?.utc?.includes(time_zone_info?.tz_name)) {
              this.defaultTimeZone = ele.country !== 'OTHER';
              this.timezone = JSON.stringify(timezone);
              return true;
            }
          });
        });
      } else {
        this.user = this.data.user;
      }
    }
  }

  ngOnInit(): void {}

  confirmCompany(): void {
    if (this.userCompany == 'Choose other') {
      this.dialog
        .open(SelectCompanyComponent, {
          position: { top: '100px' },
          width: '100vw',
          maxWidth: '450px',
          disableClose: true
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            const company = res['company'];
            const job = res['job'];
            this.userCompany = company;
            this.companies[0] = company;
          } else {
            this.userCompany = this.companies[0];
          }
        });
    }
  }

  handleAddressChange(evt: any): void {
    this.address = evt.formatted_address;
  }

  autofill(event: Event): void {
    const target = <HTMLInputElement>event.target;
    if (target.checked) {
      const primaryProfile = this.userService.profile.getValue();
      this.name = primaryProfile.user_name;
      this.userEmail = primaryProfile.email;
      this.phoneNumber = primaryProfile.phone;
      this.userCompany = primaryProfile.company;
      this.website = primaryProfile.learn_more;
      this.timezone = primaryProfile.time_zone_info;
      this.address = primaryProfile.location;
    }
  }

  checkPhoneRequired(): boolean {
    if (!this.phoneNumber || !this.phoneControl) {
      return true;
    }
    if (!Object.keys(this.phoneNumber)) {
      return true;
    }
    return false;
  }
  checkPhoneValid(): boolean {
    if (!this.phoneNumber || !this.phoneControl) {
      return true;
    }
    if (Object.keys(this.phoneNumber).length && !this.phoneControl.valid) {
      return false;
    }
    return true;
  }

  updateProfile(form: any): void {
    if (this.checkPhoneRequired() || !this.checkPhoneValid()) {
      return;
    }
    this.saving = true;
    if (this.type == 'edit') {
      const data = { ...form };
      if (this.user.picture_profile) {
        data.picture_profile = this.user.picture_profile;
      }
      this.userService
        .updateSubAccount(this.user._id, data)
        .subscribe((res) => {
          if (res['status']) {
            this.saving = false;
            this.dialogRef.close(res['data']);
          }
        });
    } else {
      const data = { ...form };
      if (this.user.picture_profile) {
        data.picture_profile = this.user.picture_profile;
      }
      this.userService.createSubAccount(data).subscribe((res) => {
        if (res['status']) {
          this.saving = false;
          this.dialogRef.close(res['data']);
        }
      });
    }
  }

  openProfilePhoto(): void {
    this.helperService
      .promptForFiles('image/jpg, image/png, image/jpeg, image/webp, image/bmp')
      .then((files) => {
        const file: File = files[0];
        const type = file.type;
        const validTypes = [
          'image/jpg',
          'image/png',
          'image/jpeg',
          'image/webp',
          'image/bmp'
        ];
        if (validTypes.indexOf(type) === -1) {
          this.toast.warning('Unsupported File Selected.');
          return;
        }
        const imageEditor = this.dialog.open(AvatarEditorComponent, {
          width: '98vw',
          maxWidth: '400px',
          disableClose: true,
          data: {
            fileInput: file
          }
        });
        imageEditor.afterClosed().subscribe((res) => {
          if (res != false && res != '') {
            if (res == null) {
              this.user.picture_profile = '';
            } else {
              this.helperService
                .resizeImage(res)
                .then((image) => {
                  this.user.picture_profile = image;
                })
                .catch((err) => {
                  this.toast.error('Image Resizing Failed');
                });
            }
          }
        });
      })
      .catch((err) => {
        this.toast.error('File Select', err);
      });
  }

  setOptionValue(timezone) {
    return JSON.stringify(timezone);
  }
}
