import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import { Subscription } from 'rxjs';
import { AutomationService } from 'src/app/services/automation.service';
import { ConfirmComponent } from 'src/app/components/confirm/confirm.component';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { STATUS } from '../../constants/variable.constants';
import { Location } from '@angular/common';
import { UserService } from '../../services/user.service';
import { ToastrService } from 'ngx-toastr';
import { AutomationAssignComponent } from '../../components/automation-assign/automation-assign.component';
import { Automation } from 'src/app/models/automation.model';
import { Contact } from 'src/app/models/contact.model';
import { AutomationStatusComponent } from 'src/app/components/automation-status/automation-status.component';
import { MatDrawer } from '@angular/material/sidenav';
import { TeamService } from '../../services/team.service';
import { Team } from '../../models/team.model';
import { User } from 'src/app/models/user.model';
import { sortDateArray, sortStringArray } from '../../utils/functions';
import { AutomationBrowserComponent } from '../../components/automation-browser/automation-browser.component';
import * as _ from 'lodash';
import { searchReg } from 'src/app/helper';
import { StoreService } from '../../services/store.service';
import { Pipeline } from '../../models/pipeline.model';
import { DealsService } from '../../services/deals.service';

@Component({
  selector: 'app-team-share-automation',
  templateUrl: './team-share-automation.component.html',
  styleUrls: ['./team-share-automation.component.scss'],
  animations: [
    trigger('detailExpand', [
      state(
        'collapsed',
        style({ height: '0px', minHeight: '0', display: 'none' })
      ),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      )
    ])
  ]
})
export class TeamShareAutomationComponent implements OnInit, OnChanges {
  DISPLAY_COLUMNS = [
    'title',
    'owner',
    'label',
    'action-count',
    'contacts',
    'created',
    'assign-action'
  ];
  STATUS = STATUS;
  user: User = new User();
  userId = '';
  page = 1;
  deleting = false;
  d_status = {};

  selectedAutomation: string = '';

  detailLoading = false;
  detailLoadSubscription: Subscription;
  contacts: Contact[] = [];

  @Input('team') team: Team;
  @ViewChild('drawer') drawer: MatDrawer;
  @ViewChild('detailPanel') detailPanel: AutomationStatusComponent;
  @Input('role') role: string;

  automations = [];
  sourcesToShow = [];
  filteredResult: Automation[] = [];
  searchStr = '';
  downloadTimer;
  folder: any = null;

  profileSubscription: Subscription;
  loadSubscription: Subscription;
  routeChangeSubscription: Subscription;
  loading = false;
  searchCondition = {
    title: false,
    role: false,
    created_at: false
  };

  selectedSort = 'role';

  stages: any[] = [];
  pipelines: Pipeline[] = [];

  constructor(
    public automationService: AutomationService,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private userService: UserService,
    private toastr: ToastrService,
    private teamService: TeamService,
    public storeService: StoreService,
    private dealsService: DealsService
  ) {}

  ngOnInit(): void {
    this.teamService.loadSharedAutomations(this.team._id);

    this.stages = [];
    this.dealsService.getStage(true);
    this.dealsService.stages$.subscribe((res) => {
      this.stages = [...res];
    });

    this.pipelines = [];
    this.dealsService.getPipeLine().subscribe((pipelines) => {
      this.pipelines = pipelines;
    });

    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      this.userId = res._id;
    });

    this.routeChangeSubscription && this.routeChangeSubscription.unsubscribe();
    this.routeChangeSubscription = this.route.params.subscribe((params) => {
      if (params['tab'] === 'automations') {
        let folder_id = params['folder'];
        if (folder_id === 'root') {
          folder_id = '';
        }

        this.loading = true;
        this.loadSubscription && this.loadSubscription.unsubscribe();
        this.loadSubscription = this.storeService.sharedAutomations$.subscribe(
          (automations) => {
            this.loading = false;
            this.automations = automations;
            this.automations = _.uniqBy(this.automations, '_id');
            if (folder_id) {
              this.folder = this.automations.filter(
                (e) => e.isFolder && e._id === folder_id
              )[0];
            } else {
              this.folder = null;
            }
            if (this.folder) {
              const folderAutomations = this.folder.automations;
              this.filteredResult = this.automations.filter((e) =>
                folderAutomations.includes(e._id)
              );
            } else {
              let folderFiles = [];
              this.automations.forEach((e) => {
                if (e.isFolder) {
                  const files = e.automations || [];
                  folderFiles = [...folderFiles, ...files];
                }
              });
              this.filteredResult = this.automations.filter(
                (e) => !folderFiles.includes(e._id)
              );
            }
            this.sourcesToShow = [...this.filteredResult];
            if (this.automations.length) {
              this.sort('role', true);
            }
          },
          (error) => {
            this.loading = false;
          }
        );
      }
    });
  }

  ngOnChanges(changes): void {
    if (changes.automations) {
      this.automations = [...changes.automations.currentValue];
      this.changeSearchStr();
    }
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.routeChangeSubscription && this.routeChangeSubscription.unsubscribe();
    this.loadSubscription && this.loadSubscription.unsubscribe();
  }

  changeSearchStr(): void {
    this.filteredResult = this.sourcesToShow.filter((item) => {
      return searchReg(item.title, this.searchStr);
    });
    this.page = 1;
  }

  clearSearchStr(): void {
    this.searchStr = '';
    this.changeSearchStr();
  }
  /**
   * Redirects to the selected Automation
   * @param event HTML Event
   * @param automation Automation to Open
   */
  openAutomation(event: Event, automation: Automation): void {
    event.stopPropagation();
    this.router.navigate(['/autoflow/edit/' + automation._id]);
  }

  /**
   * Redirect to the duplication link of the selected automation
   * @param event HTML Event
   * @param automation Automation to duplicate
   */
  duplicate(event: Event, automation: Automation): void {
    event.stopPropagation();
    this.router.navigate(['/autoflow/new/' + automation._id]);
  }

  /**
   * Open the dialog to assing the automation
   * @param event HTML Expansion click event
   * @param automation Automation to assign
   */
  assignAutomation(event: Event, automation: Automation): void {
    event.stopPropagation();
    this.dialog
      .open(AutomationAssignComponent, {
        width: '500px',
        maxWidth: '90vw',
        data: {
          automation
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.status) {
          this.automationService.reload();
        }
      });
  }

  create(): void {
    this.router.navigate([`/autoflow/new`]);
  }

  isStopSharable(automation): any {
    if (automation.user && automation.user._id === this.userId) {
      return true;
    }
    return false;
    // if (automation.role === 'admin') {
    //   return true;
    // } else {
    //   if (automation.role === 'team' && automation.user === this.userId) {
    //     return true;
    //   }
    // }
    // return false;
  }

  stopShareAutomation(automation): any {
    this.dialog
      .open(ConfirmComponent, {
        data: {
          title: 'Stop Sharing',
          message: 'Are you sure to remove this automation?',
          cancelLabel: 'No',
          confirmLabel: 'Remove'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.teamService.removeAutomation(automation._id).subscribe(
            (res) => {
              const index = this.automations.findIndex(
                (item) => item._id === automation._id
              );
              if (index >= 0) {
                this.automations.splice(index, 1);
              }
              const filterIndex = this.filteredResult.findIndex(
                (item) => item._id === automation._id
              );
              if (filterIndex >= 0) {
                this.filteredResult.splice(filterIndex, 1);
              }
              // this.toastr.success('You removed the automation successfully.');
            },
            (err) => {}
          );
        }
      });
  }

  shareAutomation(): void {
    const hideAutomations = [];
    for (const automation of this.automations) {
      hideAutomations.push(automation._id);
    }
    this.dialog
      .open(AutomationBrowserComponent, {
        width: '96vw',
        maxWidth: '940px',
        disableClose: true,
        data: {
          team_id: this.team._id,
          hideAutomations
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          if (res.automations) {
            this.automations = [...this.automations, ...res.automations];
            this.changeSearchStr();
          }
        }
      });
  }

  getOwner(automation): any {
    if (automation && automation.user) {
      if (automation.user._id === this.userId) {
        return 'Me';
      } else {
        return automation.user.user_name;
      }
    }
    return '--';
  }

  sort(field: string, keep: boolean = false): void {
    if (this.selectedSort !== field) {
      this.selectedSort = field;
      return;
    } else {
      if (field === 'role') {
        const admins = this.filteredResult.filter(
          (item) => item.role === 'admin'
        );
        const owns = this.filteredResult.filter(
          (item) => item.role === undefined
        );
        const teams = this.filteredResult.filter(
          (item) => item.role === 'team' && item.user === this.userId
        );
        const shared = this.filteredResult.filter(
          (item) => item.role === 'team' && item.user !== this.userId
        );
        let sortedAdmins, sortedOwns, sortedTeams, sortedShared;
        if (keep) {
          sortedAdmins = sortStringArray(admins, 'title', true);
          sortedOwns = sortStringArray(owns, 'title', true);
          sortedTeams = sortStringArray(teams, 'title', true);
          sortedShared = sortStringArray(shared, 'title', true);
        } else {
          sortedAdmins = sortStringArray(
            admins,
            'title',
            this.searchCondition[field]
          );
          sortedOwns = sortStringArray(
            owns,
            'title',
            this.searchCondition[field]
          );
          sortedTeams = sortStringArray(
            teams,
            'title',
            this.searchCondition[field]
          );
          sortedShared = sortStringArray(
            shared,
            'title',
            this.searchCondition[field]
          );
        }
        this.filteredResult = [];
        if (keep) {
          this.filteredResult = [
            ...sortedAdmins,
            ...sortedOwns,
            ...sortedTeams,
            ...sortedShared
          ];
        } else {
          if (this.searchCondition[field]) {
            this.filteredResult = [
              ...sortedAdmins,
              ...sortedOwns,
              ...sortedTeams,
              ...sortedShared
            ];
          } else {
            this.filteredResult = [
              ...sortedOwns,
              ...sortedTeams,
              ...sortedShared,
              ...sortedAdmins
            ];
          }
        }
      } else {
        this.filteredResult = sortStringArray(
          this.filteredResult,
          field,
          this.searchCondition[field]
        );
      }
      this.page = 1;
      if (!keep) {
        this.searchCondition[field] = !this.searchCondition[field];
      }
    }
  }

  stopShareFolder(folder): void {
    this.dialog
      .open(ConfirmComponent, {
        data: {
          title: 'Stop Sharing',
          message: 'Are you sure to remove this template folder?',
          cancelLabel: 'No',
          confirmLabel: 'Remove'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.teamService.removeFolder(this.team._id, folder._id).subscribe(
            (res) => {
              if (res) {
                this.teamService.loadSharedAutomations(this.team._id);
              }
            },
            (err) => {}
          );
        }
      });
  }
  unshareAutomation(automation) {
    if (automation.isFolder) {
      this.stopShareFolder(automation);
    } else {
      this.stopShareAutomation(automation);
    }
  }
  _fakeDownloading(aId: any): void {
    this.d_status[aId] = true;
    this.downloadTimer = setInterval(() => {
      this.d_status[aId] = false;
      clearInterval(this.downloadTimer);
    }, 2000);
  }
  _downloadFolder(automation: any): void {
    this.automationService
      .downloadFolder({ folders: [automation._id] })
      .subscribe((res) => {
        if (res) {
          this.automationService.loadOwn(true);
          if (!this.user.onboard.automation_download) {
            this.user.onboard.automation_download = true;
            this.userService
              .updateProfile({ onboard: this.user.onboard })
              .subscribe(() => {
                this.userService.updateProfileImpl({
                  onboard: this.user.onboard
                });
              });
          }
        }
      });
  }
  _downloadAutomation(automation: any): void {
    const element = JSON.parse(JSON.stringify(automation));
    const curElement = _.omit(element, ['_id', 'role', 'company']);
    const childAutomationIds = [];
    const childAutomationNames = [];
    const videoNames = [];
    const imageNames = [];
    const pdfNames = [];
    const dealStageNames = [];
    const childDealStageIds = [];
    let check_status = false;
    for (let i = 0; i < curElement.automations.length; i++) {
      const tempItem = curElement.automations[i];
      if (tempItem.action.type === 'automation') {
        childAutomationIds.push(tempItem.action.automation_id);
      }
      if (tempItem.action.videos && tempItem.action.videos.length > 0) {
        check_status = true;
      }
      if (tempItem.action.pdfs && tempItem.action.pdfs.length > 0) {
        check_status = true;
      }
      if (tempItem.action.images && tempItem.action.images.length > 0) {
        check_status = true;
      }
      if (tempItem.action.type === 'deal') {
        childDealStageIds.push(tempItem.action.deal_stage);
      }
    }
    let dialog;
    if (childAutomationIds.length > 0) {
      this.automationService
        .getChildAutomationNames(automation._id)
        .subscribe((res) => {
          for (let i = 0; i < res['titles'].length; i++) {
            childAutomationNames.push(res['titles'][i]);
          }
          if (res['videos'].length > 0) {
            for (let i = 0; i < res['videos'].length; i++) {
              videoNames.push(res['videos'][i]);
            }
          }
          if (res['images'].length > 0) {
            for (let i = 0; i < res['images'].length; i++) {
              imageNames.push(res['images'][i]);
            }
          }
          if (res['pdfs'].length > 0) {
            for (let i = 0; i < res['pdfs'].length; i++) {
              pdfNames.push(res['pdfs'][i]);
            }
          }
          if (res['dealStages'].length > 0) {
            for (let i = 0; i < res['dealStages'].length; i++) {
              dealStageNames.push(res['dealStages'][i]);
            }
          }
          const tempAutomationNames = childAutomationNames.filter(
            (c, index) => {
              return childAutomationNames.indexOf(c)! == index;
            }
          );
          const tempImageNames = _.uniqBy(imageNames, 'title');
          const tempVideoNames = _.uniqBy(videoNames, 'title');
          const tempPdfNames = _.uniqBy(pdfNames, 'title');
          const tempDealStageNames = _.uniqBy(dealStageNames, 'title');
          dialog = this.dialog.open(ConfirmComponent, {
            maxWidth: '400px',
            width: '96vw',
            position: { top: '100px' },
            data: {
              title: 'Download Automations',
              message: 'Are you sure to download these ones?',
              titles: tempAutomationNames,
              videos: tempVideoNames,
              images: tempImageNames,
              pdfs: tempPdfNames,
              dealStages: tempDealStageNames,
              stages: this.stages,
              pipelines: this.pipelines,
              confirmLabel: 'Yes',
              cancelLabel: 'No'
            }
          });
          dialog.afterClosed().subscribe((res) => {
            if (res) {
              this.automationService
                .download({ data: curElement, match_info: res.matchInfo })
                .subscribe((res) => {
                  if (res) {
                    this.toastr.success(
                      'Automations are downloaded successfully'
                    );
                    if (tempDealStageNames.length > 0) {
                      this.dealsService.easyGetPipeLine(true);
                    }
                    this.automationService.loadOwn(true);
                    if (!this.user.onboard.automation_download) {
                      this.user.onboard.automation_download = true;
                      this.userService
                        .updateProfile({ onboard: this.user.onboard })
                        .subscribe(() => {
                          this.userService.updateProfileImpl({
                            onboard: this.user.onboard
                          });
                        });
                    }
                  }
                });
              this.automationService.loadOwn(true);
            }
          });
        });
    } else {
      if (check_status || childDealStageIds.length > 0) {
        this.automationService
          .getChildAutomationNames(automation._id)
          .subscribe((res) => {
            for (let i = 0; i < res['titles'].length; i++) {
              childAutomationNames.push(res['titles'][i]);
            }
            if (res['videos'].length > 0) {
              for (let i = 0; i < res['videos'].length; i++) {
                videoNames.push(res['videos'][i]);
              }
            }
            if (res['images'].length > 0) {
              for (let i = 0; i < res['images'].length; i++) {
                imageNames.push(res['images'][i]);
              }
            }
            if (res['pdfs'].length > 0) {
              for (let i = 0; i < res['pdfs'].length; i++) {
                pdfNames.push(res['pdfs'][i]);
              }
            }
            if (res['dealStages'].length > 0) {
              for (let i = 0; i < res['dealStages'].length; i++) {
                dealStageNames.push(res['dealStages'][i]);
              }
            }
            const tempImageNames = _.uniqBy(imageNames, 'title');
            const tempVideoNames = _.uniqBy(videoNames, 'title');
            const tempPdfNames = _.uniqBy(pdfNames, 'title');
            const tempDealStageNames = _.uniqBy(dealStageNames, 'title');
            dialog = this.dialog.open(ConfirmComponent, {
              maxWidth: '400px',
              width: '96vw',
              position: { top: '100px' },
              data: {
                title: 'Download Automations',
                message: 'Are you sure to download these ones?',
                titles: childAutomationNames,
                videos: tempVideoNames,
                images: tempImageNames,
                pdfs: tempPdfNames,
                dealStages: tempDealStageNames,
                stages: this.stages,
                pipelines: this.pipelines,
                confirmLabel: 'Yes',
                cancelLabel: 'No'
              }
            });
            dialog.afterClosed().subscribe((res) => {
              if (res) {
                this.automationService
                  .download({
                    data: curElement,
                    match_info: res.matchInfo
                  })
                  .subscribe((res) => {
                    this.toastr.success(
                      'Automation is downloaded successfully'
                    );
                    if (tempDealStageNames.length > 0) {
                      this.dealsService.easyGetPipeLine(true);
                    }
                    this.automationService.loadOwn(true);
                    if (!this.user.onboard.automation_download) {
                      this.user.onboard.automation_download = true;
                      this.userService
                        .updateProfile({ onboard: this.user.onboard })
                        .subscribe(() => {
                          this.userService.updateProfileImpl({
                            onboard: this.user.onboard
                          });
                        });
                    }
                  });
              }
            });
          });
      } else {
        this.automationService
          .download({
            data: curElement,
            match_info: ' '
          })
          .subscribe((res) => {
            this.toastr.success('Automation is downloaded successfully');
            this.automationService.loadOwn(true);
            if (!this.user.onboard.automation_download) {
              this.user.onboard.automation_download = true;
              this.userService
                .updateProfile({ onboard: this.user.onboard })
                .subscribe(() => {
                  this.userService.updateProfileImpl({
                    onboard: this.user.onboard
                  });
                });
            }
          });
      }
    }
  }
  downloadAutomation(automation) {
    let isExist = false;
    let ConfirmDialog;
    automation.original_id = automation._id;
    for (const automationItem of this.automations) {
      if (automationItem.original_id === automation._id) {
        isExist = true;
      }
    }
    if (automation.isFolder) {
      if (isExist) {
        ConfirmDialog = this.dialog.open(ConfirmComponent, {
          position: { top: '100px' },
          data: {
            title: 'Download Folder',
            message: 'Are you sure to download this folder again?',
            confirmLabel: 'Download',
            cancelLabel: 'Cancel'
          }
        });
        ConfirmDialog.afterClosed().subscribe((res) => {
          if (res) {
            this._fakeDownloading(automation._id);
            this._downloadFolder(automation);
          }
        });
      } else {
        this._fakeDownloading(automation._id);
        this._downloadFolder(automation);
      }
    } else {
      if (isExist) {
        ConfirmDialog = this.dialog.open(ConfirmComponent, {
          position: { top: '100px' },
          data: {
            title: 'Download Automation',
            message: 'Are you sure to download this automation again?',
            confirmLabel: 'Download',
            cancelLabel: 'Cancel'
          }
        });
        ConfirmDialog.afterClosed().subscribe((res) => {
          if (res) {
            this._fakeDownloading(automation._id);
            this._downloadAutomation(automation);
          }
        });
      } else {
        this._fakeDownloading(automation._id);
        this._downloadAutomation(automation);
      }
    }
  }
}
