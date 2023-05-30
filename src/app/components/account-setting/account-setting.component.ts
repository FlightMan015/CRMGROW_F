import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { User } from 'src/app/models/user.model';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-account-setting',
  templateUrl: './account-setting.component.html',
  styleUrls: ['./account-setting.component.scss']
})
export class AccountSettingComponent implements OnInit {
  saving = false;
  setting1 = false;
  setting2 = false;
  user: User = new User();
  constructor(
    private dialogRef: MatDialogRef<AccountSettingComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private userService: UserService
  ) {
    if (data.user) {
      this.user = this.data.user;
      this.setting1 = this.user.login_disabled;
      this.setting2 = this.user.master_disabled;
    }
  }

  ngOnInit(): void {}

  settingAccount(): void {
    this.saving = true;
    this.user.login_disabled = this.setting1;
    this.user.master_disabled = this.setting2;
    const data = {
      login_disabled: this.setting1,
      master_disabled: this.setting2
    };
    this.userService.updateSubAccount(this.user._id, data).subscribe((res) => {
      if (res['status']) {
        this.saving = false;
        this.dialogRef.close(this.user);
      }
    });
  }
}
