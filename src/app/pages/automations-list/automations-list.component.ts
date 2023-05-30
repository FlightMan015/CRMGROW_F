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
import { Subscription, forkJoin } from 'rxjs';
import { AutomationService } from 'src/app/services/automation.service';
import { TeamService } from 'src/app/services/team.service';
import { ConfirmComponent } from 'src/app/components/confirm/confirm.component';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { BulkActions, THEMES } from 'src/app/constants/variable.constants';
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
import { FolderComponent } from 'src/app/components/folder/folder.component';
import { ChangeFolderComponent } from 'src/app/components/change-folder/change-folder.component';
import { RemoveFolderComponent } from 'src/app/components/remove-folder/remove-folder.component';
import { ScheduleService } from '../../services/schedule.service';
import { ConfirmRemoveAutomationComponent } from 'src/app/components/confirm-remove-automation/confirm-remove-automation.component';

@Component({
  selector: 'app-automations-list',
  templateUrl: './automations-list.component.html',
  styleUrls: ['./automations-list.component.scss'],
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
export class AutomationsListComponent implements OnInit, OnDestroy {
  DISPLAY_COLUMNS = [
    'select',
    'title',
    // 'owner',
    'share',
    'type',
    'label',
    'action-count',
    'contacts',
    'created',
    'actions'
  ];
  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  STATUS = STATUS;
  ACTIONS = BulkActions.Automations;
  FOLDER_ACTIONS = BulkActions.Folders;
  pageSize = this.PAGE_COUNTS[1];
  selectedFolders: any[] = [];
  selectedFiles: any[] = [];
  filteredFiles: any[] = [];
  filteredMaterials: any[] = [];
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
  filteredResult: Automation[] = [];
  searchStr = '';

  folder: any = null;

  profileSubscription: Subscription;
  loadSubscription: Subscription;
  routeChangeSubscription: Subscription;
  searchCondition = {
    title: false,
    role: false,
    created_at: false
  };

  selectedSort = 'type';
  isPackageAutomation = true;

  constructor(
    public automationService: AutomationService,
    private teamService: TeamService,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private userService: UserService,
    private toastr: ToastrService,
    private scheduleService: ScheduleService
  ) {}

  ngOnInit(): void {
    this.teamService.loadAll(true);
    this.automationService.loadOwn(true);

    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      this.userId = res._id;
      this.isPackageAutomation = res.automation_info?.is_enabled;
    });

    this.routeChangeSubscription && this.routeChangeSubscription.unsubscribe();
    this.routeChangeSubscription = this.route.params.subscribe((params) => {
      if (params['tab'] === 'own' || !params['tab']) {
        const folder_id = params['folder'];

        this.loadSubscription && this.loadSubscription.unsubscribe();
        this.loadSubscription = this.automationService.automations$.subscribe(
          (automations) => {
            this.automations = automations;
            this.automations = _.uniqBy(this.automations, '_id');

            if (this.automations.length) {
              for (const automation of this.automations) {
                this.teamService.teams$.subscribe((teams) => {
                  for (const team of teams) {
                    let index = -1;
                    if (team.owner && team.owner.length > 0) {
                      index = team.owner.findIndex(
                        (item) => item._id === this.userId
                      );
                    } else if (team.editors && team.editors.length > 0) {
                      index = team.editors.findIndex(
                        (item) => item._id === this.userId
                      );
                    }

                    if (index >= 0) {
                      const shared = team.automations.includes(automation._id);
                      const shared_folder = team.folders.includes(
                        automation._id
                      );

                      if (shared || shared_folder) {
                        if (automation['shared_with']) {
                          automation['shared_with'].push({
                            id: team._id,
                            name: team.name
                          });
                          automation['shared_with'] = _.uniqBy(
                            automation['shared_with'],
                            'id'
                          );
                        } else {
                          automation['shared_with'] = [
                            { id: team._id, name: team.name }
                          ];
                        }
                      }
                    }
                  }
                });
              }
            }

            if (folder_id) {
              this.folder = this.automations.filter(
                (e) => e.isFolder && e._id === folder_id
              )[0];
            }
            if (folder_id && !this.folder && this.automations.length) {
              this.router.navigate(['automations/own/root']);
            }
            if (this.folder) {
              const folderAutomations = this.folder.automations || [];
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
            this.sort('type', true);
            this.filteredMaterials = this.filteredResult;
            this.filteredFiles = this.filteredMaterials.filter((e) => {
              return !e.isFolder;
            });
          }
        );
      }
    });

    this.scheduleService.getEventTypes(true);
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.loadSubscription && this.loadSubscription.unsubscribe();
  }

  changeSearchStr(): void {
    const filtered = this.automations.filter((item) => {
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

  shareAutomation(event: Event, automation: Automation): void {
    this.dialog
      .open(TeamMaterialShareComponent, {
        width: '98vw',
        maxWidth: '450px',
        data: {
          automation,
          type: 'automation'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.status) {
          this.automationService.reload();
        }
      });
  }
  unshareAutomation(automation: Automation): void {
    const data = {
      automation,
      type: 'automation',
      unshare: true
    };
    this.dialog.open(TeamMaterialShareComponent, {
      width: '98vw',
      maxWidth: '450px',
      data
    });
  }

  /**
   * Redirect to the duplication link of the selected automation
   * @param event HTML Event
   * @param automation Automation to duplicate
   */
  duplicate(event: Event, automation: Automation): void {
    event.stopPropagation();
    if (this.folder) {
      this.router.navigate(['/autoflow/new/' + automation._id], {
        queryParams: { folder: this.folder._id }
      });
    } else {
      this.router.navigate(['/autoflow/new/' + automation._id]);
    }
  }

  /**
   * Open the delete confirm dlg to delete the automation
   * @param event HTML Expansion click event
   * @param automation Automation to delete
   */
  deleteAutomation(event: Event, automation: Automation): void {
    event.stopPropagation();
    const dialog = this.dialog.open(ConfirmComponent, {
      data: {
        title: 'Delete Automation',
        message: 'Are you sure you want to delete the automation?',
        confirmLabel: 'Delete'
      }
    });

    dialog.afterClosed().subscribe((res) => {
      if (res) {
        this.deleting = true;
        this.automationService.delete(automation._id).subscribe((res2) => {
          this.deleting = false;
          if (
            res2.status &&
            res2.error_message &&
            res2.error_message.length > 0
          ) {
            const confirmBulkDialog = this.dialog.open(
              ConfirmRemoveAutomationComponent,
              {
                position: { top: '100px' },
                data: {
                  title: 'Delete Automation',
                  additional: res2.error_message,
                  automation_id: automation._id,
                  message:
                    "You can't remove automation '" + automation.title + "'."
                }
              }
            );
            confirmBulkDialog.afterClosed().subscribe((res1) => {
              this.automationService.reload();
            });
          } else {
            this.automationService.reload();
          }
        });

        // const eventTypes = this.scheduleService.eventTypes.getValue();
        // const assignedEventTypes = eventTypes.filter(
        //   (eventType) => eventType.automation === automation._id
        // );

        // if (assignedEventTypes.length > 0) {
        //   this.dialog
        //     .open(ConfirmComponent, {
        //       data: {
        //         title: 'There are event types using this automation',
        //         message:
        //           'Do you want to continue ? This automation will be unassigned on event types.',
        //         confirmLabel: 'Continue'
        //       }
        //     })
        //     .afterClosed()
        //     .subscribe((response) => {
        //       if (response) {
        //         this.deleting = true;

        //         forkJoin(
        //           assignedEventTypes.map((eventType) =>
        //             this.scheduleService.updateEventType(eventType._id, {
        //               automation: null
        //             })
        //           )
        //         ).subscribe((res) => {
        //           if (res) {
        //             this.scheduleService.getEventTypes(true);

        //             this.automationService
        //               .delete(automation._id)
        //               .subscribe((status) => {
        //                 this.deleting = false;
        //                 if (status) {
        //                   this.automationService.reload();
        //                 }
        //               });
        //           }
        //         });
        //       }
        //     });
        // } else {
        //   this.deleting = true;
        //   this.automationService.delete(automation._id).subscribe((status) => {
        //     this.deleting = false;
        //     if (status) {
        //       this.automationService.reload();
        //     }
        //   });
        // }
      }
    });
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
    if (this.folder) {
      this.router.navigate(['/autoflow/new/'], {
        queryParams: { folder: this.folder._id }
      });
    } else {
      this.router.navigate(['/autoflow/new/']);
    }
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
  toggleElement(element: Automation): void {
    let selectionTemp;
    if (element.isFolder) {
      selectionTemp = this.selectedFolders;
    } else {
      selectionTemp = this.selectedFiles;
    }
    const pos = selectionTemp.indexOf(element._id);
    if (pos !== -1) {
      selectionTemp.splice(pos, 1);
    } else {
      selectionTemp.push(element._id);
    }
    // this.changeCaptureAction();
  }
  isSelected(element: Automation): boolean {
    const pos = [...this.selectedFolders, ...this.selectedFiles].indexOf(
      element._id
    );
    if (pos !== -1) {
      return true;
    } else {
      return false;
    }
  }
  isAllSelected(): boolean {
    // const selectionLength =
    //   this.selectedFolders.length + this.selectedFiles.length;
    // return (
    //   this.filteredMaterials.length &&
    //   selectionLength === this.filteredMaterials.length
    // );
    return this.filteredFiles.length === this.selectedFiles.length;
  }
  doAction(evt: any) {
    switch (evt.command) {
      case 'deselect':
        this.selectedFiles = [];
        this.selectedFolders = [];
        break;
      case 'folder':
        this.moveToFolder();
        break;
      case 'delete':
        if (!this.selectedFiles.length) {
          return;
        } else {
          const confirmDialog = this.dialog.open(ConfirmComponent, {
            position: { top: '100px' },
            data: {
              title: 'Delete Automations',
              message: 'Are you sure to delete these selected automations?',
              confirmLabel: 'Delete',
              cancelLabel: 'Cancel'
            }
          });
          confirmDialog.afterClosed().subscribe((res) => {
            if (res) {
              this.automationService
                .bulkRemove(this.selectedFiles)
                .subscribe((res) => {
                  if (res.status && res.failed && res.failed.length > 0) {
                    const confirmBulkDialog = this.dialog.open(
                      ConfirmRemoveAutomationComponent,
                      {
                        position: { top: '100px' },
                        data: {
                          title: 'Delete Automations',
                          additional: res.failed,
                          message:
                            "You can't remove following automations. Click expand to see detail reason."
                        }
                      }
                    );
                    confirmBulkDialog.afterClosed().subscribe((res1) => {
                      this.automationService.reload();
                      this.selectedFiles = [];
                    });
                  } else if (res.status) {
                    this.automationService.reload();
                    this.selectedFiles = [];
                  }
                });
            }
          });
        }
    }
  }
  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selectedFiles = [];
      this.selectedFolders = [];
    } else {
      this.selectedFiles = this.filteredFiles.map((e) => e._id);
    }
    // this.changeCaptureAction();
  }
  pageMasterToggle(): void {
    const start = (this.page - 1) * this.pageSize.id;
    const end = start + this.pageSize.id;
    const pageMaterials = this.filteredMaterials
      .slice(start, end)
      .filter((e) => {
        return !e.isFolder;
      });
    const selectedPageMaterials = _.intersectionWith(
      this.selectedFiles,
      pageMaterials,
      (a, b) => a === b._id
    );
    if (selectedPageMaterials.length === pageMaterials.length) {
      this.selectedFiles = [];
      this.selectedFolders = [];
    } else {
      const pageMaterialIds = pageMaterials.map((e) => e._id);
      this.selectedFiles = _.union(this.selectedFiles, pageMaterialIds);
    }
    // this.changeCaptureAction();
  }
  isPageSelected(): boolean {
    const start = (this.page - 1) * this.pageSize.id;
    const end = start + this.pageSize.id;
    const pageMaterials = this.filteredMaterials
      .slice(start, end)
      .filter((e) => {
        return !e.isFolder;
      });
    const selectedPageMaterials = _.intersectionWith(
      this.selectedFiles,
      pageMaterials,
      (a, b) => a === b._id
    );
    if (pageMaterials.length) {
      return selectedPageMaterials.length === pageMaterials.length;
    } else {
      return false;
    }
  }
  editFolder(folder: any): void {
    this.dialog
      .open(FolderComponent, {
        width: '96vw',
        maxWidth: '400px',
        data: {
          type: 'automation',
          folder: { ...folder }
        }
      })
      .afterClosed()
      .subscribe((res) => {
        this.automationService.update$(folder._id, res);
      });
  }
  deleteFolder(folder: any): void {
    const folders = this.automations.filter((e) => e.isFolder);
    this.dialog
      .open(RemoveFolderComponent, {
        width: '96vw',
        maxWidth: '400px',
        data: {
          type: 'automation',
          folder: { ...folder },
          folders
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res.status && res.failed && res.failed.length > 0) {
          const confirmBulkDialog = this.dialog.open(
            ConfirmRemoveAutomationComponent,
            {
              position: { top: '100px' },
              data: {
                title: 'Delete Automation',
                additional: res.failed,
                message:
                  "You can't remove following automations. Click expand to see detail reason."
              }
            }
          );
          confirmBulkDialog.afterClosed().subscribe((res) => {
            this.automationService.loadOwn(true);
          });
        } else {
          this.automationService.loadOwn(true);
        }
      });
  }
  shareFolder(folder: any): void {
    this.dialog.open(TeamMaterialShareComponent, {
      width: '98vw',
      maxWidth: '450px',
      data: {
        folder: folder,
        isFolder: true,
        type: 'automation'
      }
    });
  }
  unshareFolder(folder: any): void {
    const data = {
      folder: folder,
      isFolder: true,
      type: 'automation',
      unshare: true
    };

    this.dialog.open(TeamMaterialShareComponent, {
      width: '98vw',
      maxWidth: '450px',
      data
    });
    // const data = { folders: [folder._id] };
    // this.teamService.unshareFolders(data).subscribe(() => {
    //   this.toastr.show('This folder is private again.');
    //   this.automationService.update$(folder._id, { role: '' });
    // });
  }
  moveToFolder(file: any = null): void {
    const folders = this.automations.filter((e) => e.isFolder);
    let files = [];
    if (file) {
      files = [file];
    } else {
      files = this.filteredMaterials.filter((e) => {
        if (this.selectedFiles.indexOf(e._id) !== -1) {
          return true;
        }
        return false;
      });
    }
    this.dialog
      .open(ChangeFolderComponent, {
        width: '96vw',
        maxWidth: '400px',
        data: {
          fileType: 'automation',
          folders,
          files,
          currentFolder: this.folder
        }
      })
      .afterClosed()
      .subscribe((res) => {
        this.automationService.loadOwn(true);
        this.selectedFiles = [];
      });
  }
  doFolderAction(evt: any): void {
    const selectedFolders = this.filteredMaterials.filter((e) => {
      if (e.isFolder && this.selectedFolders.indexOf(e._id) !== -1) {
        return true;
      }
      return false;
    });

    if (selectedFolders.length === 1) {
      switch (evt.command) {
        case 'edit':
          this.editFolder(selectedFolders[0]);
          break;
        case 'delete':
          this.deleteFolder(selectedFolders[0]);
          break;
        case 'deselect':
          this.selectedFolders = [];
          break;
      }
      return;
    }
    const folders = this.automations.filter((e) => e.isFolder);
    switch (evt.command) {
      case 'edit':
        this.dialog
          .open(FolderComponent, {
            width: '96vw',
            maxWidth: '400px',
            data: {
              folders: [...selectedFolders]
            }
          })
          .afterClosed()
          .subscribe((res) => {
            this.automationService.loadOwn(true);
            this.selectedFolders = [];
          });
        break;
      case 'delete':
        this.dialog
          .open(RemoveFolderComponent, {
            width: '96vw',
            maxWidth: '500px',
            data: {
              type: 'automation',
              selectedFolders: [...selectedFolders],
              folders: [...folders]
            }
          })
          .afterClosed()
          .subscribe((res) => {
            if (res.status && res.failed && res.failed.length > 0) {
              const confirmBulkDialog = this.dialog.open(
                ConfirmRemoveAutomationComponent,
                {
                  position: { top: '100px' },
                  data: {
                    title: 'Delete Automation',
                    additional: res.failed,
                    message:
                      "You can't remove following automations. Click expand to see detail reason."
                  }
                }
              );
              confirmBulkDialog.afterClosed().subscribe((res) => {
                this.automationService.reload();
                this.selectedFolders = [];
              });
            } else {
              this.automationService.reload();
              this.selectedFolders = [];
            }
          });
        break;
      case 'deselect':
        this.selectedFolders = [];
        break;
    }
  }
}
