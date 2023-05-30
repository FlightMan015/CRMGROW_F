import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AddUserComponent } from 'src/app/components/add-user/add-user.component';
import { Account, User } from 'src/app/models/user.model';
import { UserService } from 'src/app/services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { DialogSettings, VOLUME } from 'src/app/constants/variable.constants';
import * as _ from 'lodash';
import { ConfirmComponent } from 'src/app/components/confirm/confirm.component';
import { BuyAccountComponent } from 'src/app/components/buy-account/buy-account.component';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { FormatProfileComponent } from 'src/app/components/format-profile/format-profile.component';
import { AccountSettingComponent } from 'src/app/components/account-setting/account-setting.component';
import userflow from 'userflow.js';

@Component({
  selector: 'app-company',
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.scss']
})
export class CompanyComponent implements OnInit, OnDestroy {
  VOLUME = VOLUME;
  ACTIONS = [
    {
      label: 'Merge Accounts',
      loadingLabel: '',
      type: 'button',
      icon: 'i-merge',
      command: 'merge',
      loading: false
    }
  ];
  DISPLAY_COLUMNS = [
    'account_name',
    'account_company',
    'account_email',
    'account_phone',
    'account_timezone',
    'account_seat',
    'action'
  ];
  seatLimit = 0;
  hasSeat = false;
  userList: Account[] = [];
  defaultUser: User = new User();
  profileSubscription: Subscription;
  accountSubscription: Subscription;
  primaryAccountSubscription: Subscription;
  queryParamSubscription: Subscription;
  preloadSubscription: Subscription;

  loading = false;
  userLoading = false;

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private toast: ToastrService,
    private route: ActivatedRoute,
    private location: Location,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userLoading = true;
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile && profile._id) {
          this.defaultUser = profile;
          this.userLoading = false;
          if (
            !profile.sub_account_info ||
            !profile.sub_account_info.is_enabled
          ) {
            this.router.navigate(['/profile/general']);
            return;
          }
          this.initPreload();
          if (profile['is_primary']) {
            this.getUserList();
          } else {
            this.router.navigate(['/profile/general']);
          }
        }
      }
    );

    this.queryParamSubscription = this.route.queryParams.subscribe((params) => {
      if (params['new']) {
        setTimeout(() => {
          this.location.replaceState('/profile/account');
          this.createAccount();
        }, 200);
      }
    });
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.queryParamSubscription && this.queryParamSubscription.unsubscribe();
    this.preloadSubscription && this.preloadSubscription.unsubscribe();
  }

  initPreload(): void {
    this.preloadSubscription && this.preloadSubscription.unsubscribe();
    this.preloadSubscription = this.userService.accounts$.subscribe(
      (accountInfo) => {
        if (!accountInfo) {
          this.userList = [];
          return;
        }
        const { accounts, limit } = accountInfo;
        if (accounts && accounts.length) {
          this.userList = [];
          this.seatLimit = limit || 0;
          let used_seat = 0;
          accounts.forEach((e) => {
            this.userList.push(new Account().deserialize(e));
            used_seat += e.equal_account || 1;
          });

          if (used_seat < this.seatLimit) {
            for (let i = 0; i < this.seatLimit - used_seat; i++) {
              const seat = new Account().deserialize({
                is_seat: true,
                _id: i + 1 + ''
              });
              this.userList.push(seat);
            }
          }
          this.preloadSubscription && this.preloadSubscription.unsubscribe();
          this.sortAccounts(false);
        }
      }
    );
  }

  getUserList(): void {
    this.loading = true;
    this.accountSubscription && this.accountSubscription.unsubscribe();
    this.accountSubscription = this.userService
      .getSubAccount()
      .subscribe((res) => {
        this.loading = false;
        this.userList = [new Account().deserialize({ ...this.defaultUser })];
        let accountCount = this.defaultUser.equal_account || 1;
        this.seatLimit = 1;

        if (res && res['status'] && res['data']) {
          if (res['data']['users'] && res['data']['users'].length) {
            res['data']['users'].forEach((user) => {
              const account = new Account().deserialize(user);
              this.userList.push(account);
              accountCount += account.equal_account;
            });
          }
          if (res['data'] && res['data']['total']) {
            this.seatLimit = res['data']['total'] + 1;
          } else {
            this.seatLimit = accountCount;
          }

          if (this.seatLimit - accountCount > 0) {
            for (let i = 0; i < this.seatLimit - accountCount; i++) {
              const seat = new Account().deserialize({
                is_seat: true,
                _id: i + 1 + ''
              });
              this.userList.push(seat);
            }
          }
          this.sortAccounts();
        }
      });
  }

  getTimeZone(data: any): any {
    try {
      return JSON.parse(data).name;
    } catch (err) {
      return '';
    }
  }

  getAvatarName(name: any): any {
    if (name) {
      const names = name.split(' ');
      if (names.length > 1) {
        return names[0][0] + names[1][0];
      } else {
        return names[0][0];
      }
    }
    return 'UC';
  }

  buyAccount(): void {
    this.dialog
      .open(BuyAccountComponent)
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.seatLimit++;
          const seat = new Account().deserialize({
            is_seat: true,
            _id: new Date().getTime() + ''
          });
          this.userList.push(seat);
          this.userList = [...this.userList];
          this.sortAccounts();
          // this.toast.success(
          //   'Account is created successfully.',
          //   'Create Account'
          // );
        }
      });
  }

  recallAccount(): void {
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          message: 'Are you sure to delete the profile?',
          title: 'Delete Profile',
          confirmLabel: 'Delete'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.userService.recallSubAccount({}).subscribe((_res) => {
            if (_res && _res['status']) {
              for (let i = this.userList.length - 1; i >= 0; i--) {
                if (this.userList[i].is_seat) {
                  this.userList.splice(i, 1);
                  this.seatLimit--;
                  break;
                }
              }
              this.userList = [...this.userList];
              this.sortAccounts();
            }
          });
        }
      });
  }

  createAccount(): void {
    this.dialog
      .open(AddUserComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '600px',
        disableClose: true
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res['user']) {
          const newAccount = new Account().deserialize(res['user']);
          this.userList.splice(1, 0, newAccount);
          this.userList.pop();
          this.userList = [...this.userList];
          this.sortAccounts();
          // this.toast.success('Profile is created successfully.');
        }
      });
  }

  mergeAccount(account): void {
    let message = '';
    if (account.is_primary) {
      message =
        'This action cannot be undone. Are you sure to increase this profile volume by merging with empty profile?';
    } else {
      message =
        'Are you sure to increase this profile volume by merging with empty profile?';
    }
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          title: 'Increase Profile Volume',
          message: message,
          confirmLabel: 'Increase'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.userService
            .mergeSubAccount({ user_id: account._id })
            .subscribe((res) => {
              if (res && res['status']) {
                this.userList.some((e, index) => {
                  if (e.is_seat) {
                    this.userList.splice(index, 1);
                    return true;
                  }
                });
                this.userList.some((e, index) => {
                  if (e._id === account._id) {
                    e.equal_account++;
                    return true;
                  }
                });
                this.userList = [...this.userList];
                this.sortAccounts();
                // this.toast.success(
                //   'Profile volume has been increased successfully.'
                // );
              }
            });
        }
      });
  }

  deleteAccount(user: Account): void {
    this.dialog
      .open(FormatProfileComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          title: 'Format Profile',
          message:
            'This action cannot be undone. Are you sure to format this profile? If you want, please select the format option.',
          confirmLabel: 'Confirm',
          account: user
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res['status']) {
          // this.toast.success('Your profile has been formatted successfully.');
          if (res['mode'] === 'normally') {
            const time = new Date().getTime();
            this.userList.some((e, index) => {
              if (e._id === user._id) {
                e.is_seat = true;
                e._id = time + '';
                return true;
              }
            });
            if (user.equal_account > 1) {
              for (let i = 0; i < user.equal_account - 1; i++) {
                this.userList.push(
                  new Account().deserialize({
                    is_seat: true,
                    _id: time + i + 1 + ''
                  })
                );
              }
            }
            this.userList = [...this.userList];
            this.sortAccounts();
          } else {
            this.userList.some((e, index) => {
              if (e._id === user._id) {
                this.userList.splice(index, 1);
                return true;
              }
            });
            this.userList = [...this.userList];
            this.sortAccounts();
          }
        }
      });
  }

  editAccount(user): void {
    this.dialog
      .open(AddUserComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '600px',
        disableClose: true,
        data: {
          editUser: user,
          type: 'edit'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.userList.some((e, index) => {
            if (e._id === user._id) {
              this.userList.splice(
                index,
                1,
                new Account().deserialize({ ...user, ...res, _id: user._id })
              );
              return true;
            }
          });
          this.userList = [...this.userList];
          this.sortAccounts();
          // this.toast.success('Account is updated successfully.');
        }
      });
  }

  settingAccount(user): void {
    this.dialog
      .open(AccountSettingComponent, {
        width: '100vw',
        maxWidth: '400px',
        data: {
          user: user
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          user = res;
        }
      });
  }

  sortAccounts(emit: boolean = true): void {
    this.userList.sort((a, b) => {
      if (a.is_primary) {
        return -1;
      } else if (a.is_seat) {
        return 1;
      }
      if (b.is_primary) {
        return 1;
      }
      if (a._id > b._id) {
        return -1;
      }
      return 1;
    });

    const accounts = this.userList.filter((e) => !e.is_seat);
    if (emit) {
      this.userService.accounts.next({ accounts, limit: this.seatLimit });
    }

    let usedAccount = 0;
    accounts.forEach((e) => {
      usedAccount += e.equal_account;
    });
    this.hasSeat = this.seatLimit - usedAccount ? true : false;
  }

  getRecordingDuration(time: number): string {
    const duration = Math.floor(time / 60000);
    return duration + ' min';
  }
}
