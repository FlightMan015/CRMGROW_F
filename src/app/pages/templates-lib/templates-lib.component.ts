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
import userflow from 'userflow.js';
import { User } from 'src/app/models/user.model';
import { HandlerService } from 'src/app/services/handler.service';
import { TeamService } from 'src/app/services/team.service';

@Component({
  selector: 'app-templates-lib',
  templateUrl: './templates-lib.component.html',
  styleUrls: ['./templates-lib.component.scss']
})
export class TemplatesLibComponent implements OnInit, OnDestroy {
  user: User = new User();
  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  DISPLAY_COLUMNS = [
    'title',
    'owner',
    'template-content',
    'template-type',
    'template-sub-action'
  ];
  STATUS = STATUS;

  pageSize = this.PAGE_COUNTS[1];

  d_status = {};
  page = 1;
  userId = '';
  emailDefault = '';
  smsDefault = '';
  isSetting = false;
  deleting = false;
  currentUser: any;

  templates: Template[] = [];
  libraries: Template[] = [];
  filteredResult: Template[] = [];
  searchStr = '';
  selectedSort = 'type';

  downloadTimer;
  folder: any = null;

  profileSubscription: Subscription;
  garbageSubscription: Subscription;
  loadSubscription: Subscription;
  routeChangeSubscription: Subscription;
  templatesSubscription: Subscription;

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
    private route: ActivatedRoute,
    private toast: ToastrService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    const previousUrl = this.handlerService.previousUrl || '';
    this.templatesService.loadLibrary(true);

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
        if (profile._id) {
          this.userId = profile._id;
          this.user = profile;
          if (!this.user.onboard.template_download && userflow.isIdentified()) {
            userflow.start('e9c24f48-c420-488a-9855-aeed7f3828fb');
          }
        }
      }
    );
    this.templatesSubscription && this.templatesSubscription.unsubscribe();
    this.templatesSubscription = this.templatesService.templates$.subscribe(
      (res) => {
        this.templates = res;
      }
    );
    this.routeChangeSubscription && this.routeChangeSubscription.unsubscribe();
    this.routeChangeSubscription = this.route.params.subscribe((params) => {
      const currentPath = this.route.snapshot.routeConfig['path'];
      if (params['tab'] === 'library') {
        const folder_id = params['folder'];

        this.loadSubscription && this.loadSubscription.unsubscribe();
        this.loadSubscription = this.templatesService.libraries$.subscribe(
          (libraries) => {
            this.libraries = libraries;
            this.libraries = _.uniqBy(this.libraries, '_id');
            if (folder_id) {
              this.folder = this.libraries.filter(
                (e) => e.isFolder && e._id === folder_id
              )[0];
            }
            if (this.folder) {
              const folderTemplates = this.folder.templates;
              this.filteredResult = this.libraries.filter((e) =>
                folderTemplates.includes(e._id)
              );
            } else {
              let folderFiles = [];
              this.libraries.forEach((e) => {
                if (e.isFolder) {
                  const files = e.templates || [];
                  folderFiles = [...folderFiles, ...files];
                }
              });
              this.filteredResult = this.libraries.filter(
                (e) => !folderFiles.includes(e._id)
              );
            }
            if (this.libraries.length) {
              this.sort('type', true);
            }
          }
        );
      }
      // this.loadSubscription && this.loadSubscription.unsubscribe();
      // this.loadSubscription = this.templatesService.templates$.subscribe(
      //   (templates) => {
      //     this.templates = templates;
      //     this.templates = _.uniqBy(this.templates, '_id');
      //     if (folder_id) {
      //       this.folder = this.templates.filter(
      //         (e) => e.isFolder && e._id == folder_id
      //       )[0];
      //     }
      //     if (this.folder) {
      //       const folderTemplates = this.folder.templates || [];
      //       this.filteredResult = this.templates.filter((e) =>
      //         folderTemplates.includes(e._id)
      //       );
      //     } else {
      //       let folderFiles = [];
      //       this.templates.forEach((e) => {
      //         if (e.isFolder) {
      //           const files = e.templates || [];
      //           folderFiles = [...folderFiles, ...files];
      //         }
      //       });
      //       this.filteredResult = this.templates.filter(
      //         (e) => !folderFiles.includes(e._id)
      //       );
      //     }
      //     if (this.templates.length) {
      //       this.sort('type', true);
      //     }
      //   }
      // );
    });
    // this.templatesService.loadAll(true);
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.loadSubscription && this.loadSubscription.unsubscribe();
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
  _fakeDownloading(tId: any): void {
    // this.d_status[tId] = true;
    // this.downloadTimer = setInterval(() => {
    //   this.d_status[tId] = false;
    //   clearInterval(this.downloadTimer);
    // }, 2000);
  }
  downloadTemplate(element: Template): void {
    let isExist = false;
    let ConfirmDialog;
    element.original_id = element._id;
    for (const template of this.templates) {
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
            this._fakeDownloading(element._id);
            this._downloadFolder(element);
          }
        });
      } else {
        this._fakeDownloading(element._id);
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
            this._fakeDownloading(element._id);
            this._downloadTemplate(element);
          }
        });
      } else {
        this._fakeDownloading(element._id);
        this._downloadTemplate(element);
      }
    }
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
    this.router.navigate(['/templates/new/' + template._id]);
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
    const filtered = this.libraries.filter((template) => {
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
          this.searchCondition[field]
        );
        const sortedEmail = sortStringArray(
          email,
          'title',
          this.searchCondition[field]
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

  unshareTemplate(template): void {
    if (template.isFolder) {
      const data = { folders: [template._id] };
      this.teamService.unshareFolders(data).subscribe(() => {
        this.templatesService.loadLibrary(true);
        // this.toast.show('This folder is private again.');
        this.templatesService.update$(template._id, { role: '' });
      });
    } else {
      const data = { templates: [template._id] };
      this.teamService.unshareTemplates(data).subscribe(() => {
        this.templatesService.loadLibrary(true);
        // this.toast.show('This template is private again.');
        this.templatesService.update$(template._id, { role: '' });
      });
    }
  }
}
