import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { TemplatesService } from '../../services/templates.service';
import { UserService } from '../../services/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmComponent } from '../../components/confirm/confirm.component';
import { Template } from 'src/app/models/template.model';
import { STATUS } from 'src/app/constants/variable.constants';
import { ToastrService } from 'ngx-toastr';
import { sortStringArray } from '../../utils/functions';
import * as _ from 'lodash';
import { TeamMaterialShareComponent } from 'src/app/components/team-material-share/team-material-share.component';
import { searchReg } from 'src/app/helper';
import { ChangeFolderComponent } from 'src/app/components/change-folder/change-folder.component';
import { HandlerService } from 'src/app/services/handler.service';
import { FolderComponent } from 'src/app/components/folder/folder.component';
import { RemoveFolderComponent } from 'src/app/components/remove-folder/remove-folder.component';
import { TeamService } from 'src/app/services/team.service';
import { BulkActions, THEMES } from 'src/app/constants/variable.constants';
import { ConfirmBulkTemplatesComponent } from 'src/app/components/confirm-bulk-templates/confirm-bulk-templates.component';

@Component({
  selector: 'app-templates-list',
  templateUrl: './templates-list.component.html',
  styleUrls: ['./templates-list.component.scss']
})
export class TemplatesListComponent implements OnInit, OnDestroy {
  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  DISPLAY_COLUMNS = [
    'select',
    'title',
    'share',
    'template-content',
    'template-type',
    'template-action',
    'template-sub-action'
  ];
  STATUS = STATUS;

  pageSize = this.PAGE_COUNTS[1];

  page = 1;
  userId = '';
  emailDefault = '';
  smsDefault = '';
  isSetting = false;
  deleting = false;
  currentUser: any;
  selectedFolders: any[] = [];
  selectedFiles: any[] = [];
  filteredFiles: any[] = [];
  filteredMaterials: any[] = [];
  folder = null;
  templates: Template[] = [];
  filteredResult: Template[] = [];
  searchStr = '';
  selectedSort = 'type';

  profileSubscription: Subscription;
  garbageSubscription: Subscription;
  loadSubscription: Subscription;
  routeChangeSubscription: Subscription;
  ACTIONS = BulkActions.Automations;
  FOLDER_ACTIONS = BulkActions.Folders;

  searchCondition = {
    title: true,
    role: false,
    type: false
  };

  constructor(
    public templatesService: TemplatesService,
    private teamService: TeamService,
    private userService: UserService,
    private handlerService: HandlerService,
    private toast: ToastrService,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.teamService.loadAll(true);
    this.templatesService.loadOwn(true);

    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.garbageSubscription = this.userService.garbage$.subscribe(
      (garbage) => {
        if (garbage && garbage.canned_message) {
          this.emailDefault = garbage.canned_message.email;
          this.smsDefault = garbage.canned_message.sms;
        }
      }
    );
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        this.userId = profile._id;
      }
    );
    // this.templatesService.loadAll(true);

    this.routeChangeSubscription && this.routeChangeSubscription.unsubscribe();
    this.routeChangeSubscription = this.route.params.subscribe((params) => {
      if (params['tab'] === 'own' || !params['tab']) {
        const folder_id = params['folder'];

        this.loadSubscription && this.loadSubscription.unsubscribe();
        this.loadSubscription = this.templatesService.templates$.subscribe(
          (templates) => {
            this.templates = templates;
            this.templates = _.uniqBy(this.templates, '_id');
            if (this.templates.length) {
              for (const template of this.templates) {
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
                      const shared_template = team.email_templates.includes(
                        template._id
                      );
                      const shared_folder = team.folders.includes(template._id);

                      if (shared_template || shared_folder) {
                        if (template['shared_with']) {
                          template['shared_with'].push({
                            id: team._id,
                            name: team.name
                          });
                          template['shared_with'] = _.uniqBy(
                            template['shared_with'],
                            'id'
                          );
                        } else {
                          template['shared_with'] = [
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
              this.folder = this.templates.filter(
                (e) => e.isFolder && e._id == folder_id
              )[0];
            }
            if (folder_id && !this.folder && this.templates.length) {
              this.router.navigate(['templates-list/own/root']);
            }
            if (this.folder) {
              const folderTemplates = this.folder.templates || [];
              this.filteredResult = this.templates.filter((e) =>
                folderTemplates.includes(e._id)
              );
            } else {
              let folderFiles = [];
              this.templates.forEach((e) => {
                if (e.isFolder) {
                  const files = e.templates || [];
                  folderFiles = [...folderFiles, ...files];
                }
              });
              this.filteredResult = this.templates.filter(
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
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.routeChangeSubscription && this.routeChangeSubscription.unsubscribe();
  }

  setDefault(template: Template): void {
    const cannedMessage = {
      email: this.emailDefault,
      sms: this.smsDefault
    };
    if (template._id === this.emailDefault) {
      // Disable the Default Email Template
      delete cannedMessage.email;
    } else if (template._id === this.smsDefault) {
      // Disable the Default Sms Template
      delete cannedMessage.sms;
    } else if (template.type === 'email') {
      // Enable the Default Email Template
      cannedMessage.email = template._id;
    } else {
      // Enable the Default Sms Template
      cannedMessage.sms = template._id;
    }
    if (!cannedMessage.email) {
      delete cannedMessage.email;
    }
    if (!cannedMessage.sms) {
      delete cannedMessage.sms;
    }

    this.isSetting = true;
    this.userService.updateGarbage({ canned_message: cannedMessage }).subscribe(
      () => {
        this.isSetting = false;
        this.userService.updateGarbageImpl({ canned_message: cannedMessage });
        if (template.type === 'email') {
          if (cannedMessage.email) {
            this.userService.email.next(template);
          } else {
            this.userService.email.next(null);
          }
        }
        if (template.type === 'text') {
          if (cannedMessage.sms) {
            this.userService.sms.next(template);
          } else {
            this.userService.sms.next(null);
          }
        }
        // this.toast.success(`Template's default has been successfully changed.`);
      },
      () => {
        this.isSetting = false;
      }
    );
  }

  openTemplate(template: Template): void {
    this.router.navigate(['/templates/edit/' + template._id]);
  }

  duplicateTemplate(template: Template): void {
    if (this.folder) {
      this.router.navigate(['/templates/new/' + template._id], {
        queryParams: { folder: this.folder._id }
      });
    } else {
      this.router.navigate(['/templates/new/' + template._id]);
    }
  }

  deleteTemplate(template: Template): void {
    const dialog = this.dialog.open(ConfirmComponent, {
      data: {
        title: 'Delete template',
        message: 'Are you sure to delete this template?',
        confirmLabel: 'Delete'
      }
    });

    dialog.afterClosed().subscribe((res) => {
      console.log(res);
      if (res) {
        // this.templatesService.delete(template._id);

        this.templatesService.deleteOne(template._id).subscribe((res1) => {
          if (res1.status && res1.failed && res1.failed.length > 0) {
            const confirmBulkDialog = this.dialog.open(
              ConfirmBulkTemplatesComponent,
              {
                position: { top: '100px' },
                data: {
                  title: 'Delete Template',
                  additional: res1.failed,
                  message:
                    "You can't remove this template. Click expand to see detail reason."
                }
              }
            );

            confirmBulkDialog.afterClosed().subscribe((res2) => {});
          } else if (res1.status) {
            const templates = this.templatesService.templates.getValue();
            _.remove(templates, (e) => {
              return e._id === template._id;
            });
            this.templatesService.templates.next(templates);
          }
        });
      }
    });
  }

  shareTemplate(template: Template): void {
    this.dialog.open(TeamMaterialShareComponent, {
      width: '98vw',
      maxWidth: '450px',
      data: {
        template: template,
        type: 'template'
      }
    });
  }

  changeSearchStr(): void {
    const filtered = this.templates.filter((template) => {
      const str =
        template.title + ' ' + template.content + ' ' + template.subject;
      return searchReg(str, this.searchStr);
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
      } else if (field === 'type') {
        const text = this.filteredResult.filter((item) => item.type === 'text');
        const email = this.filteredResult.filter(
          (item) => item.type === 'email'
        );
        const folder = this.filteredResult.filter((item) => item.isFolder);
        const sortedFolder = sortStringArray(
          folder,
          'title',
          this.searchCondition['title']
        );
        const sortedText = sortStringArray(
          text,
          'title',
          this.searchCondition['title']
        );
        const sortedEmail = sortStringArray(
          email,
          'title',
          this.searchCondition['title']
        );
        this.filteredResult = [];
        if (this.searchCondition[field]) {
          this.filteredResult = [
            ...sortedFolder,
            ...sortedText,
            ...sortedEmail
          ];
        } else {
          this.filteredResult = [
            ...sortedFolder,
            ...sortedEmail,
            ...sortedText
          ];
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
  unshareTemplate(template: Template): void {
    const data = {
      template: template,
      type: 'template',
      unshare: true
    };
    this.dialog.open(TeamMaterialShareComponent, {
      width: '98vw',
      maxWidth: '450px',
      data
    });
  }
  toggleElement(element: Template): void {
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
  isSelected(element: Template): boolean {
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
              title: 'Delete Templates',
              message: 'Are you sure to delete these selected templates?',
              confirmLabel: 'Delete',
              cancelLabel: 'Cancel'
            }
          });
          confirmDialog.afterClosed().subscribe((res) => {
            if (res) {
              // this.templatesService.remove(this.selectedFiles);
              // this.selectedFiles = [];

              this.templatesService
                .bulkRemove(this.selectedFiles)
                .subscribe((res1) => {
                  if (res1.status && res1.failed && res1.failed.length > 0) {
                    const confirmBulkDialog = this.dialog.open(
                      ConfirmBulkTemplatesComponent,
                      {
                        position: { top: '100px' },
                        data: {
                          title: 'Delete Templates',
                          additional: res1.failed,
                          message:
                            "You can't remove following templates. Click expand to see detail reason."
                        }
                      }
                    );

                    confirmBulkDialog.afterClosed().subscribe((res2) => {});
                  } else if (res1.status) {
                    const templates = this.templatesService.templates.getValue();
                    _.remove(templates, (e) => {
                      return this.selectedFiles.indexOf(e._id) !== -1;
                    });
                    this.templatesService.templates.next(templates);
                    this.templatesService.remove(this.selectedFiles);
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
    const folders = this.templates.filter((e) => e.isFolder);
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
            this.templatesService.loadOwn(true);
            this.selectedFolders = [];
          });
        break;
      case 'delete':
        this.dialog
          .open(RemoveFolderComponent, {
            width: '96vw',
            maxWidth: '500px',
            data: {
              type: 'template',
              selectedFolders: [...selectedFolders],
              folders: [...folders]
            }
          })
          .afterClosed()
          .subscribe((res) => {
            this.templatesService.loadOwn(true);
            this.selectedFolders = [];
          });
        break;
      case 'deselect':
        this.selectedFolders = [];
        break;
    }
  }

  editFolder(folder: Template): void {
    this.dialog
      .open(FolderComponent, {
        width: '96vw',
        maxWidth: '400px',
        data: {
          type: 'template',
          folder: { ...folder }
        }
      })
      .afterClosed()
      .subscribe((res) => {
        this.templatesService.update$(folder._id, res);
        this.selectedFolders = [];
      });
  }
  deleteFolder(folder: Template): void {
    const folders = this.templates.filter((e) => e.isFolder);
    this.dialog.open(RemoveFolderComponent, {
      width: '96vw',
      maxWidth: '400px',
      data: {
        type: 'template',
        folder: { ...folder },
        folders
      }
    });
  }
  shareFolder(folder: Template): void {
    this.dialog.open(TeamMaterialShareComponent, {
      width: '98vw',
      maxWidth: '450px',
      data: {
        folder: folder,
        isFolder: true,
        type: 'template'
      }
    });
  }
  unshareFolder(folder: Template): void {
    const data = {
      folder: folder,
      isFolder: true,
      type: 'template',
      unshare: true
    };

    this.dialog.open(TeamMaterialShareComponent, {
      width: '98vw',
      maxWidth: '450px',
      data
    });
  }
  moveToFolder(template: any = null): void {
    const folders = this.templates.filter((e) => e.isFolder);
    let files = [];
    if (template) {
      files = [template];
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
          fileType: 'template',
          folders,
          files,
          currentFolder: this.folder
        }
      })
      .afterClosed()
      .subscribe((res) => {
        this.templatesService.loadOwn(true);
        this.selectedFiles = [];
      });
  }
}
