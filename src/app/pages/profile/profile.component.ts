import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SubscriptionCancelReasonComponent } from 'src/app/components/subscription-cancel-reason/subscription-cancel-reason.component';
import { PageMenuItem } from 'src/app/utils/data.types';
import { UserService } from 'src/app/services/user.service';
import { ToastrService } from 'ngx-toastr';
import { User } from 'src/app/models/user.model';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  user: User = new User();
  profile: any;
  menuItems: PageMenuItem[] = [
    { id: 'general', icon: '', label: 'Info' },
    { id: 'signature', icon: '', label: 'Signature' },
    { id: 'security', icon: '', label: 'Security' },
    { id: 'account', icon: '', label: 'Organization' },
    { id: 'subscription', icon: '', label: 'Subscription' },
    { id: 'billing', icon: '', label: 'Billing' }
  ];
  defaultPage = 'general';
  currentPage: string;
  currentAction: string;
  currentPageItem: PageMenuItem = this.menuItems[0];
  queryParamSubscription: Subscription;

  profileSubscription: Subscription;
  routeChangeSubscription: Subscription;
  initStep = 1;
  isSuspended = false;
  disableMenuItems = [];

  constructor(
    private dialog: MatDialog,
    private location: Location,
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private toast: ToastrService
  ) {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        this.disableMenuItems = [];
        this.user = profile;
        this.isSuspended = profile.subscription?.is_failed;
        if (this.isSuspended) {
          this.disableMenuItems = [
            { id: 'general', icon: 'i-general', label: 'Info' },
            { id: 'signature', icon: 'i-signature', label: 'Signature' },
            { id: 'security', icon: 'i-security', label: 'Security' }
          ];
        }
        if (!profile.sub_account_info || !profile.sub_account_info.is_enabled) {
          this.menuItems.splice(3, 1);
          this.disableMenuItems.push({
            id: 'account',
            icon: 'i-company',
            label: 'Organization'
          });
        }
        // this.disableMenuItems.push({
        //   id: 'account',
        //   icon: 'i-company',
        //   label: 'Account'
        // });
      }
    );
  }
  ngOnInit(): void {
    this.routeChangeSubscription = this.route.params.subscribe((params) => {
      this.currentPage = params['page'] || this.defaultPage;
      this.currentAction = params['action'] || '';
      if (this.currentPage === 'upgrade-plan') {
        this.initStep = 2;
        this.currentPageItem = this.menuItems[3];
        this.currentPage = 'billing';
      } else if (this.currentPage === 'cancel-account') {
        this.initStep = 4;
        this.currentPageItem = this.menuItems[3];
        this.currentPage = 'billing';
      } else if (
        this.currentPage === 'subscription' &&
        this.currentAction === 'cancel'
      ) {
        this.cancelAccount();
      } else {
        this.currentPageItem = this.menuItems.filter(
          (item) => item.id == this.currentPage
        )[0];
      }
    });
  }

  cancelAccount(): void {
    // this.step = 4;
    const messageDialog = this.dialog.open(SubscriptionCancelReasonComponent, {
      width: '800px',
      maxWidth: '800px',
      disableClose: true,
      data: {}
    });
    messageDialog['_overlayRef']['_host'].classList.add('top-dialog');
    messageDialog.afterClosed().subscribe((res) => {
      if (res) {
      }
    });
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.queryParamSubscription && this.queryParamSubscription.unsubscribe();
    this.routeChangeSubscription && this.routeChangeSubscription.unsubscribe();
  }

  /**
   * Change the page and replace the location
   * @param menu : SubMenu Item
   */
  changeMenu(menu: PageMenuItem): void {
    // this.currentPage = menu.id;
    // this.currentPageItem = this.menuItems.filter(
    //   (item) => item.id == this.currentPage
    // );
    // this.location.replaceState(`profile/${menu.id}`);
    this.router.navigate([`profile/${menu.id}`]);
  }

  changeTab(menu: PageMenuItem): void {
    this.currentPageItem = menu;
    this.router.navigate([`profile/${menu.id}`]);
  }

  isDisableMenuItem(menuItem): boolean {
    const index = this.disableMenuItems.findIndex(
      (item) => item.id === menuItem.id
    );
    if (index >= 0) {
      return true;
    }
    return false;
  }
}
