import {
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MaterialService } from 'src/app/services/material.service';
import { StoreService } from 'src/app/services/store.service';
import { TeamService } from '../../services/team.service';
import { HandlerService } from 'src/app/services/handler.service';
import { TabItem } from 'src/app/utils/data.types';
import { Location } from '@angular/common';
import { MaterialsListComponent } from '../materials-list/materials-list.component';
import { MaterialsLibComponent } from '../materials-lib/materials-lib.component';
import userflow from 'userflow.js';
import { Subscription } from 'rxjs';
import { User } from 'src/app/models/user.model';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-materials',
  templateUrl: './materials.component.html',
  styleUrls: ['./materials.component.scss']
})
export class MaterialsComponent implements OnInit, OnDestroy {
  user: User = new User();
  tabs: TabItem[] = [
    { label: 'My Materials List', id: 'own', icon: '' },
    { label: 'Materials Library', id: 'library', icon: '' }
  ];
  selectedTab: TabItem = this.tabs[0];
  profileSubscription: Subscription;
  @ViewChild('materialsList') materialsList: MaterialsListComponent;
  @ViewChild('materialsLib') materialsLib: MaterialsLibComponent;

  captureForms = {}; // {form id: form detail}
  materialCaptures = {}; //
  captureEnabledMaterials = [];
  defaultCaptureForm = {};
  routeChangeSubscription: Subscription;

  constructor(
    public storeService: StoreService,
    private handlerService: HandlerService,
    public materialService: MaterialService,
    public teamService: TeamService,
    private location: Location,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.handlerService.pageName.next('materials');
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile._id) {
          this.user = profile;
          if (
            !this.user.onboard.material_download &&
            this.selectedTab.id == 'own' &&
            userflow.isIdentified()
          ) {
            userflow.start('097a16ea-2198-4d96-9515-8da069d2b1cb');
          }
        }
      }
    );
    this.routeChangeSubscription = this.route.params.subscribe((params) => {
      if (params['page']) {
        const tabIndex = this.tabs.findIndex(
          (tab) => tab.id === params['page']
        );
        this.selectedTab = this.tabs[tabIndex];
      } else {
        this.selectedTab = this.tabs[0];
      }
      if (!this.selectedTab) {
        this.selectedTab = this.tabs[0];
      }
    });
  }

  ngOnDestroy(): void {
    this.handlerService.pageName.next('');
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.routeChangeSubscription && this.routeChangeSubscription.unsubscribe();
  }

  recordSetting(): void {
    this.materialsList.recordSetting();
  }

  createFolder(): void {
    this.materialsList.createFolder();
  }
  createMaterial(type): void {
    this.materialsList.createMaterial(type);
  }
  /**
   * Change the Tab -> This will change the view
   * @param tab : TabItem for the Task and Activity
   */
  changeTab(tab: TabItem): void {
    this.selectedTab = tab;
    this.router.navigate(['materials/' + tab.id + '/root']);
    if (
      !this.user.onboard.material_download &&
      this.selectedTab.id == 'own' &&
      userflow.isIdentified()
    ) {
      userflow.start('097a16ea-2198-4d96-9515-8da069d2b1cb');
    }
  }
}
