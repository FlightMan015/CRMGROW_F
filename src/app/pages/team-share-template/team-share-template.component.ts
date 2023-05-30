import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { TemplatesService } from '../../services/templates.service';
import { UserService } from '../../services/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmComponent } from '../../components/confirm/confirm.component';
import { Template } from 'src/app/models/template.model';
import { STATUS } from 'src/app/constants/variable.constants';
import { TeamService } from '../../services/team.service';
import { ToastrService } from 'ngx-toastr';
import { Team } from '../../models/team.model';
import { sortStringArray } from '../../utils/functions';
import { TemplateBrowserComponent } from '../../components/template-browser/template-browser.component';
import * as _ from 'lodash';
import { searchReg } from 'src/app/helper';
import { StoreService } from '../../services/store.service';
import { User } from 'src/app/models/user.model';

@Component({
  selector: 'app-team-share-template',
  templateUrl: './team-share-template.component.html',
  styleUrls: ['./team-share-template.component.scss']
})
export class TeamShareTemplateComponent implements OnInit, OnChanges {
  STATUS = STATUS;
  DISPLAY_COLUMNS = [
    'title',
    'owner',
    'template-content',
    'template-type',
    'template-action'
  ];
  selectedTemplate: string = '';
  page = 1;
  userId = '';
  emailDefault = '';
  smsDefault = '';
  isSetting = false;
  deleting = false;
  currentUser: any;

  templates: Template[] = [];
  sourcesToShow: any[] = [];
  filteredResult: Template[] = [];
  searchStr = '';

  folder: any = null;

  loadOwnSubscription: Subscription;
  profileSubscription: Subscription;
  garbageSubscription: Subscription;
  loadSubscription: Subscription;
  routeChangeSubscription: Subscription;
  loading = false;

  selectedSort = 'role';
  searchCondition = {
    title: false,
    role: false,
    type: false
  };

  @Input('team') team: Team;
  @Input('role') role: string;

  d_status = {};
  user: User = new User();
  ownTemplates: Template[] = [];

  constructor(
    public templatesService: TemplatesService,
    private userService: UserService,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
    private teamService: TeamService,
    public storeService: StoreService,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {
    this.teamService.loadSharedTemplates(this.team._id);
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
        this.user = profile;
        this.userId = profile._id;
      }
    );

    this.routeChangeSubscription && this.routeChangeSubscription.unsubscribe();
    this.routeChangeSubscription = this.route.params.subscribe((params) => {
      if (params['tab'] === 'templates') {
        let folder_id = params['folder'];
        if (folder_id === 'root') {
          folder_id = null;
        }

        this.loading = true;
        this.loadSubscription && this.loadSubscription.unsubscribe();
        this.loadSubscription = this.storeService.sharedTemplates$.subscribe(
          (templates) => {
            this.loading = false;
            this.templates = templates;
            this.templates = _.uniqBy(this.templates, '_id');
            if (folder_id) {
              this.folder = this.templates.filter(
                (e) => e.isFolder && e._id === folder_id
              )[0];
            } else {
              this.folder = null;
            }
            if (this.folder) {
              const folderTemplates = this.folder.templates;
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
            this.sourcesToShow = [...this.filteredResult];
            if (this.templates.length) {
              this.sort('role', true);
            }
          },
          (error) => {
            this.loading = false;
          }
        );

        this.loadOwnSubscription && this.loadOwnSubscription.unsubscribe();
        this.loadOwnSubscription = this.templatesService.templates$.subscribe(
          (res) => {
            this.ownTemplates = res;
          }
        );
      }
    });
  }

  ngOnChanges(changes): void {
    if (changes.templates && changes.templates.currentValue) {
      this.templates = [...changes.templates.currentValue];
      this.changeSearchStr();
    }
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.loadSubscription && this.loadSubscription.unsubscribe();
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
          if (cannedMessage['email']) {
            this.userService.email.next(template);
          } else {
            this.userService.email.next(null);
          }
        }
        if (template.type === 'sms') {
          if (cannedMessage['sms']) {
            this.userService.sms.next(template);
          } else {
            this.userService.sms.next(null);
          }
        }
      },
      () => {
        this.isSetting = false;
      }
    );
  }

  openTemplate(template: Template): void {
    this.router.navigate(['/templates/edit/' + template._id]);
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
        this.templatesService.delete(template._id);
      }
    });
  }

  changeSearchStr(): void {
    this.filteredResult = this.sourcesToShow.filter((template) => {
      const str =
        template.title + ' ' + template.content + ' ' + template.subject;
      return searchReg(str, this.searchStr);
    });
  }

  clearSearchStr(): void {
    this.searchStr = '';
    this.filteredResult = this.templates;
  }

  isStopSharable(template): any {
    if (template.user && template.user === this.userId) {
      return true;
    }
    return false;
  }

  isDuplicatable(template): any {
    if (template.user && template.user !== this.userId) {
      return true;
    }
    return false;
  }

  stopShareTemplate(template): any {
    this.dialog
      .open(ConfirmComponent, {
        data: {
          title: 'Stop Sharing',
          message: 'Are you sure to remove this template?',
          cancelLabel: 'No',
          confirmLabel: 'Remove'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.teamService.removeTemplate(template._id).subscribe(
            (res) => {
              const index = this.templates.findIndex(
                (item) => item._id === template._id
              );
              if (index >= 0) {
                this.templates.splice(index, 1);
              }
              const filterIndex = this.filteredResult.findIndex(
                (item) => item._id === template._id
              );
              if (filterIndex >= 0) {
                this.filteredResult.splice(filterIndex, 1);
              }
              // this.toast.success('You removed the template successfully.');
            },
            (err) => {}
          );
        }
      });
  }

  shareEmailTemplate(): void {
    const hideTemplates = [];
    for (const template of this.templates) {
      hideTemplates.push(template._id);
    }
    this.dialog
      .open(TemplateBrowserComponent, {
        width: '96vw',
        maxWidth: '940px',
        disableClose: true,
        data: {
          team_id: this.team._id,
          hideTemplates
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.templates) {
          this.templates = [...this.templates, ...res.templates];
          this.changeSearchStr();
        }
      });
  }

  duplicateTemplate(template: Template): void {
    this.router.navigate(['/templates/duplicate/' + template._id]);
  }

  getOwner(template): any {
    if (template && template.user) {
      if (template.user._id === this.userId) {
        return 'Me';
      } else {
        return template.user.user_name;
      }
    }
    return '--';
  }

  sort(field: string, keep: boolean = false): void {
    if (this.selectedSort != field) {
      this.selectedSort = field;
      return;
    } else {
      if (field == 'role') {
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
      } else if (field == 'type') {
        const text = this.filteredResult.filter((item) => item.type === 'text');
        const email = this.filteredResult.filter(
          (item) => item.type === 'email'
        );
        const sortedText = sortStringArray(
          text,
          'title',
          this.searchCondition[field]
        );
        const sortedEmail = sortStringArray(
          email,
          'title',
          this.searchCondition[field]
        );
        this.filteredResult = [];
        if (this.searchCondition[field]) {
          this.filteredResult = [...sortedEmail, ...sortedText];
        } else {
          this.filteredResult = [...sortedText, ...sortedEmail];
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
                this.teamService.loadSharedTemplates(this.team._id);
              }
            },
            (err) => {}
          );
        }
      });
  }

  unshareTemplate(template): void {
    if (template.isFolder) {
      this.stopShareFolder(template);
    } else {
      this.stopShareTemplate(template);
    }
  }

  // downloadTemplate(element): void {
  //   if (element.isFolder) {
  //     const newFolder = { ...element };
  //     delete newFolder.role;
  //     delete newFolder._id;
  //     delete newFolder.user;
  //     this.templatesService
  //       .downloadFolder({ folders: [element._id] })
  //       .subscribe((res) => {
  //         if (res) {
  //           this.toast.show('Folder is downloaded successfully.');
  //         }
  //       });
  //     return;
  //   }
  //   let curElement = JSON.parse(JSON.stringify(element));
  //   curElement = _.omit(curElement, ['_id', 'role', 'company']);
  //   this.templatesService.create(curElement).subscribe((res) => {
  //     if (res) {
  //       this.toast.success('Template is downloaded successfully');
  //     }
  //   });
  // }

  downloadTemplate(element: Template): void {
    let isExist = false;
    let ConfirmDialog;
    element.original_id = element._id;
    for (const template of this.ownTemplates) {
      if (template.original_id === element._id) {
        isExist = true;
      }
    }
    if (element.isFolder) {
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
            this._downloadFolder(element);
          }
        });
      } else {
        this._downloadFolder(element);
      }
    } else {
      if (isExist) {
        ConfirmDialog = this.dialog.open(ConfirmComponent, {
          position: { top: '100px' },
          data: {
            title: 'Download Template',
            message: 'Are you sure to download this template again?',
            confirmLabel: 'Download',
            cancelLabel: 'Cancel'
          }
        });
        ConfirmDialog.afterClosed().subscribe((res) => {
          if (res) {
            this._downloadTemplate(element);
          }
        });
      } else {
        this._downloadTemplate(element);
      }
    }
  }

  _downloadFolder(element: any): void {
    this.d_status[element._id] = true;
    this.templatesService
      .downloadFolder({ folders: [element._id] })
      .subscribe((res) => {
        if (res) {
          this.templatesService.loadOwn(true);
          if (!this.user.onboard.template_download) {
            this.user.onboard.template_download = true;
            this.userService
              .updateProfile({ onboard: this.user.onboard })
              .subscribe(() => {
                this.userService.updateProfileImpl({
                  onboard: this.user.onboard
                });
              });
          }
          this.d_status[element._id] = false;
        }
      });
  }

  _downloadTemplate(element: any): void {
    let curElement = JSON.parse(
      JSON.stringify({ ...element, original_id: element._id })
    );
    curElement = _.omit(curElement, ['_id', 'role', 'company']);
    this.templatesService.read(element._id).subscribe((res) => {
      const imageNames = _.uniqBy(res['image_ids'], 'title');
      const videoNames = _.uniqBy(res['video_ids'], 'title');
      const pdfNames = _.uniqBy(res['pdf_ids'], 'title');

      if (
        videoNames.length == 0 &&
        imageNames.length == 0 &&
        pdfNames.length == 0
      ) {
        this.d_status[element._id] = true;
        this.templatesService.createTemplate(curElement).subscribe((res) => {
          if (res) {
            // this.toast.success('Template is downloaded successfully');
            this.templatesService.loadOwn(true);
            if (!this.user.onboard.template_download) {
              this.user.onboard.template_download = true;
              this.userService
                .updateProfile({ onboard: this.user.onboard })
                .subscribe(() => {
                  this.userService.updateProfileImpl({
                    onboard: this.user.onboard
                  });
                });
            }
            this.d_status[element._id] = false;
          }
        });
      } else {
        const dialog = this.dialog.open(ConfirmComponent, {
          maxWidth: '400px',
          width: '96vw',
          position: { top: '100px' },
          data: {
            title: 'Download Templates',
            message: 'Are you sure to download these ones?',
            videos: videoNames,
            images: imageNames,
            pdfs: pdfNames,
            confirmLabel: 'Yes',
            cancelLabel: 'No'
          }
        });
        dialog.afterClosed().subscribe((res) => {
          if (res) {
            this.d_status[element._id] = true;
            this.templatesService
              .createTemplate(curElement)
              .subscribe((res) => {
                if (res) {
                  // this.toast.success('Template is downloaded successfully');
                  this.templatesService.loadOwn(true);
                  if (!this.user.onboard.template_download) {
                    this.user.onboard.template_download = true;
                    this.userService
                      .updateProfile({ onboard: this.user.onboard })
                      .subscribe(() => {
                        this.userService.updateProfileImpl({
                          onboard: this.user.onboard
                        });
                      });
                  }
                  this.d_status[element._id] = false;
                }
              });
          }
        });
      }
    });
  }
}
