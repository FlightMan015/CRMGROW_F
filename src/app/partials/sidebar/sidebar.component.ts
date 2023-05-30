import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { Subscription } from 'rxjs';

declare interface RouteInfo {
  path: string;
  title: string;
  icon: string;
  class: string;
  beta: boolean;
  betaClass: string;
  betaLabel: string;
  protectedRole: string[]; // Can be decorated with Enum Data
  // eslint-disable-next-line @typescript-eslint/ban-types
  subMenuItems: object[];
  active: boolean;
}
export const ROUTES: RouteInfo[] = [
  {
    path: 'home',
    title: 'Dashboard',
    icon: 'i-task bgc-dark',
    class: '',
    beta: false,
    betaClass: '',
    betaLabel: '',
    protectedRole: null,
    active: false,
    subMenuItems: []
  },
  {
    path: 'deals',
    title: 'Pipeline',
    icon: 'i-deals bgc-dark',
    class: '',
    beta: false,
    betaClass: '',
    betaLabel: '',
    protectedRole: null,
    active: false,
    subMenuItems: [
      {
        label: 'Pipeline Manager',
        path: 'pipeline-manager'
      }
    ]
  },
  {
    path: 'contacts',
    title: 'Contacts',
    icon: 'i-lunch bgc-dark',
    class: '',
    beta: false,
    betaClass: '',
    betaLabel: '',
    protectedRole: null,
    active: false,
    subMenuItems: [
      {
        label: 'Contact Manager',
        path: 'settings/tag-manager'
      }
    ]
  },
  {
    path: 'materials',
    title: 'Materials',
    icon: 'i-video bgc-dark',
    class: '',
    beta: false,
    betaClass: '',
    betaLabel: '',
    protectedRole: null,
    active: false,
    subMenuItems: []
  },
  {
    path: '',
    title: 'Lead Hub',
    icon: 'i-leadhub bgc-dark',
    class: '',
    beta: false,
    betaClass: '',
    betaLabel: '',
    protectedRole: null,
    active: false,
    subMenuItems: [
      { path: 'scheduler', label: 'Scheduler' },
      { path: 'page-builder', label: 'Landing Pages' },
      { path: 'settings/smart-code', label: 'Smart Code' },
      { path: 'settings/lead-capture', label: 'Lead Capture' }
    ]
  },
  {
    path: 'automations',
    title: 'Automations',
    icon: 'i-automation bgc-dark',
    class: '',
    beta: false,
    betaClass: '',
    betaLabel: '',
    protectedRole: null,
    active: false,
    subMenuItems: []
  },
  {
    path: 'campaign',
    title: 'Campaign',
    icon: 'i-broadcasts bgc-dark',
    class: '',
    beta: false,
    betaClass: '',
    betaLabel: '',
    protectedRole: null,
    active: false,
    subMenuItems: []
  },
  {
    path: 'calendar',
    title: 'Calendar',
    icon: 'i-calendar bgc-dark',
    class: '',
    beta: false,
    betaClass: '',
    betaLabel: '',
    protectedRole: null,
    active: false,
    subMenuItems: []
  },
  {
    path: 'templates-list',
    title: 'Templates',
    icon: 'i-template bgc-dark',
    class: '',
    beta: false,
    betaClass: '',
    betaLabel: '',
    protectedRole: null,
    active: false,
    subMenuItems: []
  },
  {
    path: 'teams',
    title: 'Teams',
    icon: 'i-teams bgc-dark',
    class: '',
    beta: false,
    betaClass: '',
    betaLabel: '',
    protectedRole: null,
    active: false,
    subMenuItems: []
  },
  {
    path: '',
    title: 'Settings',
    icon: 'i-setting bgc-dark',
    class: '',
    beta: false,
    betaClass: '',
    betaLabel: '',
    protectedRole: null,
    active: false,
    subMenuItems: [
      { path: 'settings/notifications', label: 'Notifications' },
      { path: 'settings/sms-limits', label: 'SMS' },
      { path: 'settings/affiliate', label: 'Affiliate' },
      { path: 'settings/assistant', label: 'Assistant' },
      { path: 'settings/theme', label: 'Landing Page Theme' },
      { path: 'settings/integration', label: 'Integration' },
      { path: 'settings/business-hour', label: 'Business Hour' },
      { path: 'settings/social', label: 'Social Profile' }
    ]
  }
];

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  menuItems: RouteInfo[] = JSON.parse(JSON.stringify(ROUTES));
  disableMenuItems: RouteInfo[] = [];
  isCollapsed = false;
  profile: any = {};
  isSuspended = false;
  profileSubscription: Subscription;
  isPackageAutomation = true;
  isPackageCalendar = true;
  isCampaign = false;
  suspendRouting = '/profile/billing';

  constructor(
    private router: Router,
    public userService: UserService,
    private renderer: Renderer2
  ) {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((user) => {
      if (user?._id) {
        this.isSuspended = user.subscription?.is_failed;
        this.isPackageAutomation = user.automation_info?.is_enabled;
        this.isPackageCalendar = user.calendar_info?.is_enabled;
        this.isCampaign = user.campaign_info?.is_enabled;
        this.disableMenuItems = [];
        if (!this.isPackageAutomation) {
          this.disableMenuItems.push({
            path: 'automations',
            title: 'Automations',
            icon: 'i-automation bgc-dark',
            class: '',
            beta: false,
            betaClass: '',
            betaLabel: '',
            protectedRole: null,
            active: false,
            subMenuItems: []
          });
        }
        if (!this.isPackageCalendar) {
          this.disableMenuItems.push({
            path: 'calendar',
            title: 'Calendar',
            icon: 'i-calendar bgc-dark',
            class: '',
            beta: false,
            betaClass: '',
            betaLabel: '',
            protectedRole: null,
            active: false,
            subMenuItems: []
          });
        }
        if (!this.isCampaign) {
          this.disableMenuItems.push({
            path: 'campaign',
            title: 'Campaign',
            icon: 'i-broadcasts bgc-dark',
            class: '',
            beta: false,
            betaClass: '',
            betaLabel: '',
            protectedRole: null,
            active: false,
            subMenuItems: []
          });
        }

        if (user.scheduler_info && !user.scheduler_info.is_enabled) {
          if (user.landing_page_info && !user.landing_page_info.is_enabled) {
            const index = this.menuItems.findIndex(
              (item) => item.title === 'Lead Hub'
            );
            this.menuItems.splice(index, 1, {
              path: '',
              title: 'Lead Hub',
              icon: 'i-leadhub bgc-dark',
              class: '',
              beta: false,
              betaClass: '',
              betaLabel: '',
              protectedRole: null,
              active: false,
              subMenuItems: [
                { path: 'settings/smart-code', label: 'Smart Code' },
                { path: 'settings/lead-capture', label: 'Lead Capture' }
              ]
            });
          } else {
            const index = this.menuItems.findIndex(
              (item) => item.title === 'Lead Hub'
            );
            this.menuItems.splice(index, 1, {
              path: '',
              title: 'Lead Hub',
              icon: 'i-leadhub bgc-dark',
              class: '',
              beta: false,
              betaClass: '',
              betaLabel: '',
              protectedRole: null,
              active: false,
              subMenuItems: [
                { path: 'page-builder', label: 'Landing Pages' },
                { path: 'settings/smart-code', label: 'Smart Code' },
                { path: 'settings/lead-capture', label: 'Lead Capture' }
              ]
            });
          }
        } else {
          if (user.landing_page_info && !user.landing_page_info.is_enabled) {
            const index = this.menuItems.findIndex(
              (item) => item.title === 'Lead Hub'
            );
            this.menuItems.splice(index, 1, {
              path: '',
              title: 'Lead Hub',
              icon: 'i-leadhub bgc-dark',
              class: '',
              beta: false,
              betaClass: '',
              betaLabel: '',
              protectedRole: null,
              active: false,
              subMenuItems: [
                { path: 'scheduler', label: 'Scheduler' },
                { path: 'settings/smart-code', label: 'Smart Code' },
                { path: 'settings/lead-capture', label: 'Lead Capture' }
              ]
            });
          }
        }
      }
    });
  }

  ngOnInit(): void {
    // this.router.events.subscribe(() => {
    //   this.isCollapsed = true;
    // });
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
  }

  isDisableItem(menuItem): boolean {
    const index = this.disableMenuItems.findIndex(
      (item) => item.title === menuItem.title
    );
    if (index >= 0) {
      return true;
    }
    return false;
  }

  toggle(index: number): void {
    for (let i = 0; i < this.menuItems.length; i++) {
      if (i != index) {
        this.menuItems[i].active = false;
      } else {
        this.menuItems[index].active = !this.menuItems[index].active;
      }
    }
  }
}
