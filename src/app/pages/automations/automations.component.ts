import { Component, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AutomationService } from 'src/app/services/automation.service';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { UserService } from '../../services/user.service';
import { ToastrService } from 'ngx-toastr';
import * as _ from 'lodash';
import { TabItem } from 'src/app/utils/data.types';
import { AutomationsListComponent } from '../automations-list/automations-list.component';
import { HandlerService } from 'src/app/services/handler.service';
import { Subscription } from 'rxjs';
import { User } from 'src/app/models/user.model';
import userflow from 'userflow.js';
import { FolderComponent } from 'src/app/components/folder/folder.component';

@Component({
  selector: 'app-automations',
  templateUrl: './automations.component.html',
  styleUrls: ['./automations.component.scss']
})
export class AutomationsComponent implements OnInit, OnDestroy {
  user: User = new User();
  tabs: TabItem[] = [
    { label: 'My Automations List', id: 'own', icon: '' },
    { label: 'Automations Library', id: 'library', icon: '' }
  ];
  selectedTab: TabItem = this.tabs[0];
  profileSubscription: Subscription;
  routeChangeSubscription: Subscription;
  @ViewChild('automationsList') automationsList: AutomationsListComponent;

  constructor(
    public automationService: AutomationService,
    private route: ActivatedRoute,
    private location: Location,
    private handlerService: HandlerService,
    private userService: UserService,
    private dialog: MatDialog,
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.handlerService.pageName.next('automations');
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile._id) {
          this.user = profile;
          if (
            !this.user.onboard.automation_download &&
            this.selectedTab.id == 'own' &&
            userflow.isIdentified()
          ) {
            userflow.start('795db957-8dff-430f-97c2-7142b7d9e9ab');
          }
        }
      }
    );
    this.routeChangeSubscription = this.route.params.subscribe((params) => {
      if (params['tab']) {
        const tabIndex = this.tabs.findIndex((tab) => tab.id === params['tab']);
        this.selectedTab = this.tabs[tabIndex];
      } else {
        this.selectedTab = this.tabs[0];
      }
    });
  }

  ngOnDestroy(): void {
    this.handlerService.pageName.next('');
    this.routeChangeSubscription && this.routeChangeSubscription.unsubscribe();
  }
  create(): void {
    this.automationsList.create();
  }
  changeTab(tab: TabItem): void {
    this.selectedTab = tab;
    this.router.navigate(['automations/' + tab.id]);
    if (
      !this.user.onboard.material_download &&
      this.selectedTab.id == 'own' &&
      userflow.isIdentified()
    ) {
      userflow.start('795db957-8dff-430f-97c2-7142b7d9e9ab');
    }
  }

  createFolder(): void {
    this.dialog
      .open(FolderComponent, {
        width: '96vw',
        maxWidth: '400px',
        data: {
          type: 'automation'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.automationService.create$({ ...res, isFolder: true });
        }
      });
  }
}
