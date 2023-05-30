import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { User } from 'src/app/models/user.model';
import { PageMenuItem } from 'src/app/utils/data.types';
import { UserService } from '../../services/user.service';
import { TabItem } from '../../utils/data.types';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy {
  menuItems: PageMenuItem[] = [
    { id: 'notifications', icon: 'i-notification', label: 'Notifications' },
    { id: 'sms-limits', icon: 'i-sms-limits', label: 'SMS' },
    // { id: 'smart-code', icon: 'i-sms-limits', label: 'Smart Code' },
    { id: 'affiliate', icon: 'i-affiliate', label: 'Affiliate' },
    // {
    //   id: 'additional-fields',
    //   icon: 'i-lead-capture',
    //   label: 'Custom Contact Fields'
    // },
    { id: 'assistant', icon: 'i-assistant', label: 'Assistant' },
    { id: 'theme', icon: 'i-lead-capture', label: 'Landing Page Theme' },
    // {
    //   id: 'lead-capture',
    //   icon: 'i-lead-capture',
    //   label: 'Lead Capture'
    // },
    // { id: 'tag-manager', icon: 'i-tag-manager', label: 'Tag Manager' },
    // { id: 'label-manager', icon: 'i-label-manager', label: 'Label Manager' },
    // { id: 'deals-setting', icon: 'i-deals', label: 'Deals' },
    { id: 'integration', icon: 'i-integration', label: 'Integration' },
    { id: 'buiness-hour', icon: '', label: 'Business Hour' },
    { id: 'social', icon: 'i-social', label: 'Social Profile' }
  ];
  tabs: TabItem[] = [
    { id: 'tag-manager', icon: '', label: 'Tag Manager' },
    { id: 'label-manager', icon: '', label: 'Label Manager' },
    { id: 'additional-fields', icon: '', label: 'Custom Contact Fields' }
  ];
  selectedTab: TabItem = this.tabs[0];
  defaultPage = 'notifications';
  currentPage: string;
  currentPageItem: PageMenuItem[];

  queryParamSubscription: Subscription;
  routeChangeSubscription: Subscription;
  profileSubscription: Subscription;
  user: User = new User();
  disableMenuItems = [];
  isPackageAssistant = true;
  isPackageCapture = true;
  isPackageText = true;
  isGuest;
  title;
  connected: boolean;

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private userService: UserService,
    private toast: ToastrService,
    private router: Router
  ) {
    this.isGuest = localStorage.getItem('guest_loggin');
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      if (res && res._id) {
        this.user = res;
        this.isPackageAssistant = res.assistant_info?.is_enabled;
        this.isPackageCapture = res.capture_enabled;
        this.isPackageText = res.text_info?.is_enabled;
        this.disableMenuItems = [];
        if (!this.isPackageAssistant) {
          this.disableMenuItems.push({
            id: 'assistant',
            icon: 'i-assistant',
            label: 'Assistant'
          });
        }
        if (!this.isPackageCapture) {
          this.disableMenuItems.push({
            id: 'lead-capture',
            icon: 'i-lead-capture',
            label: 'Lead Capture'
          });
        }
        if (!this.isPackageText) {
          this.disableMenuItems.push({
            id: 'sms-limits',
            icon: 'i-sms-limits',
            label: 'SMS'
          });
        }
        if (!res['is_primary']) {
          this.disableMenuItems.push({
            id: 'affiliate',
            icon: 'i-affiliate',
            label: 'Affiliate'
          });
        }
        if (this.isGuest) {
          this.disableMenuItems.push(
            { id: 'assistant', icon: 'i-assistant', label: 'Assistant' },
            { id: 'integration', icon: 'i-integration', label: 'Integration' }
          );
        }
      }
    });
  }

  ngOnInit(): void {
    this.queryParamSubscription && this.queryParamSubscription.unsubscribe();
    this.queryParamSubscription = this.route.queryParams.subscribe((params) => {
      if (params['code']) {
        const page = this.route.snapshot.routeConfig.path;
        let action = '';
        if (page.indexOf('profile/outlook') !== -1) {
          action = 'outlook';
        } else if (page.indexOf('profile/gmail') !== -1) {
          action = 'gmail';
        } else if (page.indexOf('profile/zoom') !== -1) {
          action = 'zoom';
        }
        if (action == 'outlook') {
          this.currentPage = 'integration';
          this.userService.authorizeOutlook(params['code']).subscribe(
            (res) => {
              this.user.connected_email_type = 'outlook';
              this.user.primary_connected = true;
              this.user.connected_email = res['data'];
              if (!this.user.onboard.connect_email) {
                this.user.onboard.connect_email = true;
                this.userService
                  .updateProfile({ onboard: this.user.onboard })
                  .subscribe(() => {
                    this.userService.updateProfileImpl({
                      onboard: this.user.onboard
                    });
                  });
              }
              this.userService.updateProfileImpl(this.user);
              // this.toast.success(
              //   'Your Outlook mail is connected successfully.'
              // );
              this.location.replaceState('/settings/integration');
            },
            (err) => {
              this.location.replaceState('/settings/integration');
            }
          );
        }
        if (action == 'gmail') {
          this.currentPage = 'integration';
          this.userService.authorizeGoogle(params['code']).subscribe(
            (res) => {
              this.user.connected_email_type = 'gmail';
              this.user.primary_connected = true;
              this.user.connected_email = res['data'];
              if (!this.user.onboard.connect_email) {
                this.user.onboard.connect_email = true;
                this.userService
                  .updateProfile({ onboard: this.user.onboard })
                  .subscribe(() => {
                    this.userService.updateProfileImpl({
                      onboard: this.user.onboard
                    });
                  });
              }
              this.userService.updateProfileImpl(this.user);
              // this.toast.success('Your Gmail is connected successfully.');
              this.location.replaceState('/settings/integration');
            },
            (err) => {
              this.location.replaceState('/settings/integration');
            }
          );
        }
        if (action == 'zoom') {
          this.currentPage = 'integration';
          this.userService.authorizeZoom(params['code']).subscribe(
            (res) => {
              if (res.email) {
                const zoom = {
                  email: res.email
                };
                this.userService.updateGarbageImpl({ zoom });
              }
              // this.toast.success('Zoom is connected successfully.');
              this.location.replaceState('/settings/integration');
            },
            (err) => {
              this.location.replaceState('/settings/integration');
            }
          );
        }
      }
    });

    this.routeChangeSubscription = this.route.params.subscribe((params) => {
      this.connected = false;
      const tabIndex = this.tabs.findIndex((tab) => tab.id === params['page']);
      this.selectedTab = this.tabs[tabIndex];
      if (params['page'] == 'smart-code') {
        this.title = 'Smart Code';
      } else if (params['page'] == 'lead-capture') {
        this.title = 'Lead Capture';
      } else if (
        params['page'] == 'additional-fields' ||
        params['page'] == 'label-manager' ||
        params['page'] == 'tag-manager'
      ) {
        this.title = 'Contact Manager';
        this.connected = true;
      } else {
        this.title = 'Setting';
      }
      if (
        !params['page'] &&
        this.route.snapshot.routeConfig.path.indexOf('profile') !== -1
      ) {
        this.currentPage = 'integration';
      } else {
        this.currentPage = params['page'] || this.defaultPage;
      }
      this.currentPageItem = this.menuItems.filter(
        (item) => item.id == this.currentPage
      );
    });
  }

  ngOnDestroy(): void {
    this.routeChangeSubscription && this.routeChangeSubscription.unsubscribe();
  }
  changeTab(tab: TabItem): void {
    this.selectedTab = tab;
    this.router.navigate(['settings/' + tab.id]);
    // Set the storage for the active tab
  }
  isDisableItem(menuItem): boolean {
    if (menuItem && menuItem.id) {
      const index = this.disableMenuItems.findIndex(
        (item) => item.id === menuItem.id
      );
      if (index >= 0) {
        return true;
      }
    }
    return false;
  }

  changeMenu(menu: PageMenuItem): void {
    // this.currentPage = menu.id;
    // this.currentPageItem = this.menuItems.filter(
    //   (item) => item.id == this.currentPage
    // );
    this.router.navigate([`settings/${menu.id}`]);
  }
}
