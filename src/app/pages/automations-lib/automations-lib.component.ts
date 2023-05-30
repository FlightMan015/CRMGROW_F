import {
  Component,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren
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
import { sortStringArray } from '../../utils/functions';
import * as _ from 'lodash';
import { TeamMaterialShareComponent } from '../../components/team-material-share/team-material-share.component';
import { searchReg } from 'src/app/helper';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import userflow from 'userflow.js';
import { User } from 'src/app/models/user.model';
import { TeamService } from 'src/app/services/team.service';
import { DealsService } from '../../services/deals.service';
import { Pipeline } from '../../models/pipeline.model';

@Component({
  selector: 'app-automations-lib',
  templateUrl: './automations-lib.component.html',
  styleUrls: ['./automations-lib.component.scss'],
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
export class AutomationsLibComponent implements OnInit, OnDestroy {
  user: User = new User();
  DISPLAY_COLUMNS = [
    'title',
    'owner',
    'type',
    'label',
    'action-count',
    // 'contacts',
    'created',
    'actions'
    // 'additional-actions'
  ];
  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  STATUS = STATUS;

  pageSize = this.PAGE_COUNTS[1];

  d_status = {};
  userId = '';
  page = 1;
  deleting = false;

  selectedAutomation: string = '';

  detailLoading = false;
  detailLoadSubscription: Subscription;
  contacts: Contact[] = [];

  @ViewChild('drawer') drawer: MatDrawer;
  @ViewChild('detailPanel') detailPanel: AutomationStatusComponent;
  @ViewChildren('mainDrop') dropdowns: QueryList<NgbDropdown>;
  dropdown: NgbDropdown;

  automations: Automation[] = [];
  libraries: Automation[] = [];
  filteredResult: Automation[] = [];
  searchStr = '';

  folder: any = null;
  downloadTimer;

  profileSubscription: Subscription;
  loadSubscription: Subscription;
  routeChangeSubscription: Subscription;
  automationsSubscription: Subscription;
  searchCondition = {
    title: false,
    role: false,
    created_at: false
  };

  selectedSort = 'role';
  isPackageAutomation = true;
  stages: any[] = [];
  pipelines: Pipeline[] = [];

  constructor(
    public automationService: AutomationService,
    private teamService: TeamService,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private userService: UserService,
    private dealsService: DealsService,
    private toastr: ToastrService
  ) {
    this.automationService.loadLibrary(true);

    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      if (res._id) {
        this.userId = res._id;
        this.user = res;
        this.isPackageAutomation = res.automation_info?.is_enabled;
        if (!this.user.onboard.automation_download && userflow.isIdentified()) {
          userflow.start('d4d0dae0-7e3b-45e8-ade5-0d0c335a7d87');
        }
      }
    });
    this.automationsSubscription && this.automationsSubscription.unsubscribe();
    this.automationsSubscription = this.automationService.automations$.subscribe(
      (res) => {
        this.automations = res;
      }
    );
    this.routeChangeSubscription && this.routeChangeSubscription.unsubscribe();
    this.routeChangeSubscription = this.route.params.subscribe((params) => {
      if (params['tab'] == 'library') {
        const folder_id = params['folder'];

        this.loadSubscription && this.loadSubscription.unsubscribe();
        this.loadSubscription = this.automationService.libraries$.subscribe(
          (libraries) => {
            this.libraries = libraries;
            this.libraries = _.uniqBy(this.libraries, '_id');
            if (this.libraries.length) {
              this.sort('type', true);
            }
            if (folder_id) {
              this.folder = this.libraries.filter(
                (e) => e.isFolder && e._id === folder_id
              )[0];
            }
            if (this.folder) {
              const folderAutomations = this.folder.automations;
              this.filteredResult = this.libraries.filter((e) =>
                folderAutomations.includes(e._id)
              );
            } else {
              let folderFiles = [];
              this.libraries.forEach((e) => {
                if (e.isFolder) {
                  const files = e.automations || [];
                  folderFiles = [...folderFiles, ...files];
                }
              });
              this.filteredResult = this.libraries.filter(
                (e) => !folderFiles.includes(e._id)
              );
            }
          }
        );
      }
    });
  }

  ngOnInit(): void {
    this.stages = [];
    this.dealsService.getStage(true);
    this.dealsService.stages$.subscribe((res) => {
      this.stages = [...res];
    });

    this.pipelines = [];
    this.dealsService.getPipeLine().subscribe((pipelines) => {
      this.pipelines = pipelines;
    });
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.loadSubscription && this.loadSubscription.unsubscribe();
  }

  changeSearchStr(): void {
    const filtered = this.libraries.filter((item) => {
      return searchReg(item.title, this.searchStr);
    });
    this.filteredResult = filtered;
    this.sort(this.selectedSort, true);
    this.page = 1;
  }

  clearSearchStr(): void {
    this.searchStr = '';
    this.changeSearchStr();
  }

  changePageSize(type: any): void {
    this.pageSize = type;
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

  // shareAutomation(event: Event, automation: Automation): void {
  //   this.dialog
  //     .open(TeamMaterialShareComponent, {
  //       width: '98vw',
  //       maxWidth: '450px',
  //       data: {
  //         automation,
  //         type: 'automation'
  //       }
  //     })
  //     .afterClosed()
  //     .subscribe((res) => {
  //       if (res && res.status) {
  //         this.automationService.reloadLibrary();
  //       }
  //     });
  // }

  /**
   * Redirect to the duplication link of the selected automation
   * @param event HTML Event
   * @param automation Automation to duplicate
   */
  // duplicate(event: Event, automation: Automation): void {
  //   event.stopPropagation();
  //   this.router.navigate(['/autoflow/new/' + automation._id]);
  // }

  /**
   * Open the delete confirm dlg to delete the automation
   * @param event HTML Expansion click event
   * @param automation Automation to delete
   */
  // deleteAutomation(event: Event, automation: Automation): void {
  //   event.stopPropagation();
  //   const dialog = this.dialog.open(ConfirmComponent, {
  //     data: {
  //       title: 'Delete Automation',
  //       message: 'Are you sure you want to delete the automation?',
  //       confirmLabel: 'Delete'
  //     }
  //   });

  //   dialog.afterClosed().subscribe((res) => {
  //     if (res) {
  //       this.deleting = true;
  //       this.automationService.delete(automation._id).subscribe((status) => {
  //         this.deleting = false;
  //         if (status) {
  //           this.toastr.success('Automation is deleted successfully.');
  //           this.automationService.reload();
  //         }
  //       });
  //     }
  //   });
  // }

  /**
   * Open the dialog to assing the automation
   * @param event HTML Expansion click event
   * @param automation Automation to assign
   */
  // assignAutomation(event: Event, automation: Automation): void {
  //   event.stopPropagation();
  //   this.dialog
  //     .open(AutomationAssignComponent, {
  //       width: '500px',
  //       maxWidth: '90vw',
  //       data: {
  //         automation
  //       }
  //     })
  //     .afterClosed()
  //     .subscribe((res) => {
  //       if (res && res.status) {
  //         this.automationService.reload();
  //       }
  //     });
  // }

  create(): void {
    this.router.navigate([`/autoflow/new`]);
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

  rowHover(index: any): void {
    if (this.dropdowns['_results'] && this.dropdowns['_results'].length > 0) {
      for (const dropdown of this.dropdowns['_results']) {
        if (dropdown.isOpen()) {
          dropdown.close();
        }
      }
    }
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
    let ids = [];
    let videoIds = [];
    let imageIds = [];
    let pdfIds = [];
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
              return childAutomationNames.indexOf(c) == index;
            }
          );
          if (res['ids'].length) {
            ids = res['ids'].filter((e, index) => {
              return res['ids'].indexOf(e) == index;
            });
          }
          if (res['videoIds'].length) {
            videoIds = res['videoIds'].filter((e, index) => {
              return res['videoIds'].indexOf(e) == index;
            });
          }
          if (res['imageIds'].length) {
            imageIds = res['imageIds'].filter((e, index) => {
              return res['imageIds'].indexOf(e) == index;
            });
          }
          if (res['pdfIds'].length) {
            pdfIds = res['pdfIds'].filter((e, index) => {
              return res['pdfIds'].indexOf(e) == index;
            });
          }
          const tempImageNames = _.uniqBy(imageNames, 'title');
          const tempVideoNames = _.uniqBy(videoNames, 'title');
          const tempPdfNames = _.uniqBy(pdfNames, 'title');
          const tempDealStageNames = _.uniqBy(dealStageNames, 'title');
          dialog = this.dialog.open(ConfirmComponent, {
            maxWidth: '500px',
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
                .download({
                  ids,
                  videoIds,
                  imageIds,
                  pdfIds,
                  data: curElement,
                  match_info: res.matchInfo
                })
                .subscribe((res) => {
                  if (res) {
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
            if (res['ids'].length) {
              ids = res['ids'].filter((e, index) => {
                return res['ids'].indexOf(e) == index;
              });
            }
            if (res['videoIds'].length) {
              videoIds = res['videoIds'].filter((e, index) => {
                return res['videoIds'].indexOf(e) == index;
              });
            }
            if (res['imageIds'].length) {
              imageIds = res['imageIds'].filter((e, index) => {
                return res['imageIds'].indexOf(e) == index;
              });
            }
            if (res['pdfIds'].length) {
              pdfIds = res['pdfIds'].filter((e, index) => {
                return res['pdfIds'].indexOf(e) == index;
              });
            }
            const tempImageNames = _.uniqBy(imageNames, 'title');
            const tempVideoNames = _.uniqBy(videoNames, 'title');
            const tempPdfNames = _.uniqBy(pdfNames, 'title');
            const tempDealStageNames = _.uniqBy(dealStageNames, 'title');
            dialog = this.dialog.open(ConfirmComponent, {
              maxWidth: '500px',
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
                    ids,
                    videoIds,
                    imageIds,
                    pdfIds,
                    data: curElement,
                    match_info: res.matchInfo
                  })
                  .subscribe((res) => {
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
            ids,
            videoIds,
            imageIds,
            pdfIds,
            data: curElement,
            match_info: ''
          })
          .subscribe((res) => {
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
  _fakeDownloading(aId: any): void {
    this.d_status[aId] = true;
    this.downloadTimer = setInterval(() => {
      this.d_status[aId] = false;
      clearInterval(this.downloadTimer);
    }, 2000);
  }

  downloadAutomation(automation: any): void {
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

  unshareAutomation(automation): void {
    if (automation.isFolder) {
      const data = { folders: [automation._id] };
      this.teamService.unshareFolders(data).subscribe(() => {
        this.automationService.loadLibrary(true);
        this.toastr.show('This folder is private again.');
        this.automationService.update$(automation._id, { role: '' });
      });
    } else {
      const data = { automations: [automation._id] };
      this.teamService.unshareAutomations(data).subscribe(() => {
        this.automationService.loadLibrary(true);
        this.toastr.show('This automation is private again.');
        this.automationService.update$(automation._id, { role: '' });
      });
    }
  }
}
