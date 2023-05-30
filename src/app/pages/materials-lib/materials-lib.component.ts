import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChildren
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MaterialService } from 'src/app/services/material.service';
import { StoreService } from 'src/app/services/store.service';
import { ToastrService } from 'ngx-toastr';
import { UserService } from 'src/app/services/user.service';
import { TeamService } from '../../services/team.service';
import { Garbage } from 'src/app/models/garbage.model';
import { environment } from 'src/environments/environment';
import { BulkActions, THEMES } from 'src/app/constants/variable.constants';
import { MaterialEditTemplateComponent } from 'src/app/components/material-edit-template/material-edit-template.component';
import { Subscription } from 'rxjs';
import { ConfirmComponent } from 'src/app/components/confirm/confirm.component';
import { VideoEditComponent } from 'src/app/components/video-edit/video-edit.component';
import { PdfEditComponent } from 'src/app/components/pdf-edit/pdf-edit.component';
import { ImageEditComponent } from 'src/app/components/image-edit/image-edit.component';
import { STATUS } from 'src/app/constants/variable.constants';
import { MaterialSendComponent } from 'src/app/components/material-send/material-send.component';
import { Material } from 'src/app/models/material.model';
import { Clipboard } from '@angular/cdk/clipboard';
import * as _ from 'lodash';
import { FolderComponent } from 'src/app/components/folder/folder.component';
import { MoveFolderComponent } from 'src/app/components/move-folder/move-folder.component';
import { NotifyComponent } from 'src/app/components/notify/notify.component';
import { DeleteFolderComponent } from '../../components/delete-folder/delete-folder.component';
import { HandlerService } from 'src/app/services/handler.service';
import { SocialShareComponent } from 'src/app/components/social-share/social-share.component';
import { TeamMaterialShareComponent } from 'src/app/components/team-material-share/team-material-share.component';
import { saveAs } from 'file-saver';
import { VideoPopupComponent } from 'src/app/components/video-popup/video-popup.component';
import { Location } from '@angular/common';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { User } from 'src/app/models/user.model';
import { LeadCaptureFormComponent } from 'src/app/components/lead-capture-form/lead-capture-form.component';
import userflow from 'userflow.js';

@Component({
  selector: 'app-materials-lib',
  templateUrl: './materials-lib.component.html',
  styleUrls: ['./materials-lib.component.scss']
})
export class MaterialsLibComponent implements OnInit, AfterViewInit {
  user: User = new User();
  DISPLAY_COLUMNS = [
    // 'select',
    'material_name',
    'creator',
    'share',
    // 'theme',
    'type',
    // 'created_at',
    // 'analytics',
    'sub_actions'
    // 'actions'
  ];
  SORT_TYPES = [
    { id: '', label: 'All types' },
    { id: 'folder', label: 'Folder' },
    { id: 'video', label: 'Video' },
    { id: 'pdf', label: 'Pdf' },
    { id: 'image', label: 'Image' }
  ];
  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  themes = THEMES;
  ACTIONS = BulkActions.Materials;
  FOLDER_ACTIONS = BulkActions.Folders;
  STATUS = STATUS;
  siteUrl = environment.website;

  d_status = {};
  user_id = '';
  themeJSON = {};
  sortType = this.SORT_TYPES[0];

  pageSize = this.PAGE_COUNTS[2];
  page = 1;

  garbage: Garbage = new Garbage();
  global_theme = '';
  material_themes = {};
  materials: any[] = [];
  libraries: any[] = [];
  filteredLibraries: any[] = [];
  filteredFiles: any[] = [];
  selectedFolders: any[] = [];
  selectedFiles: any[] = [];

  curFolder: any = null;
  convertLoaderTimer;
  downloadTimer;
  convertingVideos = {};
  videoConvertingLoadSubscription: Subscription;
  convertCallingTimes = {};
  convertCallSubscription = {};

  captureVideos = [];
  editedVideos;
  capturePdfs = [];
  editedPdfs;
  captureImages = [];
  editedImages;

  profileSubscription: Subscription;
  garbageSubscription: Subscription;
  loadSubscription: Subscription;
  materialSubscription: Subscription;
  materialDeleteSubscription: Subscription;
  routeChangeSubscription: Subscription;
  themesListSubscription: Subscription;

  // Folders
  folders: Material[] = [];
  foldersKeyValue = {};

  // Search Option
  selectedFolder: Material;
  searchStr = '';
  matType = '';
  teamOptions = [];
  userOptions = [];
  folderOptions = [];
  isAdmin = false;
  selectedSort = 'owner';

  searchCondition = {
    title: true,
    owner: true,
    material_type: true,
    created_at: true,
    views: true
  };

  // User permission management
  disableActions = [];
  isPackageText = true;
  isPackageCapture = true;

  @ViewChildren('mainDrop') dropdowns: QueryList<NgbDropdown>;
  dropdown: NgbDropdown;

  MAT_TYPE_SORT_LEVEL = {
    folder: 0,
    video: 1,
    pdf: 2,
    image: 3,
    normal: 4
  };
  MAT_OWNER_SORT_LEVEL = {
    Admin: 0,
    Me: 1,
    Other: 2
  };

  constructor(
    private dialog: MatDialog,
    public storeService: StoreService,
    private handlerService: HandlerService,
    public materialService: MaterialService,
    private userService: UserService,
    public teamService: TeamService,
    private toast: ToastrService,
    private router: Router,
    private clipboard: Clipboard,
    private route: ActivatedRoute,
    private location: Location,
    private myElement: ElementRef
  ) {
    this.themesListSubscription && this.themesListSubscription.unsubscribe();
    this.themesListSubscription = this.userService.themes$.subscribe(
      (themes) => {
        this.themes = themes;
        this.themes.forEach((e) => {
          this.themeJSON[e.id] = e;
        });
      }
    );
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile._id) {
          this.user_id = profile._id;
          this.user = profile;
          this.isPackageCapture = profile.capture_enabled;
          this.isPackageText = profile.text_info?.is_enabled;
          this.disableActions = [];
          if (!this.isPackageCapture) {
            this.disableActions.push({
              label: 'Capture',
              type: 'toggle',
              status: false,
              command: 'lead_capture',
              loading: false
            });
          }
          if (!this.isPackageText) {
            this.disableActions.push({
              label: 'Send via Text',
              type: 'button',
              icon: 'i-sms-sent',
              command: 'text',
              loading: false
            });
          }
          if (!this.user.onboard.material_download && userflow.isIdentified()) {
            userflow.start('adea2a11-196e-45df-a613-48002e2b34cf');
          }
        }
      }
    );
    this.garbageSubscription = this.userService.garbage$.subscribe((res) => {
      this.garbage = new Garbage().deserialize(res);
      this.captureVideos = this.garbage['capture_videos'] || [];
      this.editedVideos = this.garbage['edited_video'] || [];
      this.capturePdfs = this.garbage['capture_pdfs'] || [];
      this.editedPdfs = this.garbage['edited_pdf'] || [];
      this.captureImages = this.garbage['capture_images'] || [];
      this.editedImages = this.garbage['edited_image'] || [];

      this.global_theme = this.garbage.material_theme;
      this.material_themes = this.garbage.material_themes || {};
    });
    this.materialSubscription && this.materialSubscription.unsubscribe();
    this.materialSubscription = this.storeService.materials$.subscribe(
      (res) => {
        this.materials = res;
      }
    );
    this.routeChangeSubscription = this.route.params.subscribe((params) => {
      if (params['page'] !== 'library') {
        return;
      }
      const folder_id = params['folder'];

      this.loadSubscription && this.loadSubscription.unsubscribe();
      this.loadSubscription = this.storeService.libraries$.subscribe(
        (libraries) => {
          this.convertingVideos = {};
          libraries.forEach((e) => {
            if (e.material_type === 'video') {
              if (e.converted !== 'completed' && e.converted !== 'failed') {
                this.convertingVideos[e._id] = e.key;
              }
            }
          });

          this.libraries = libraries;
          this.libraries = _.uniqBy(this.libraries, '_id');

          if (folder_id) {
            this.curFolder = this.libraries.filter(
              (e) => e.isFolder && e._id === folder_id
            )[0];
          }
          const folders = libraries.filter((e) => {
            return e.material_type === 'folder';
          });
          folders.sort((a) => (a.role === 'admin' ? -1 : 1));
          this.folders = folders;
          this.folders.forEach((folder) => {
            this.foldersKeyValue[folder._id] = { ...folder };
          });

          const materialFolderMatch = {};
          folders.forEach((folder) => {
            folder.videos.forEach((e) => {
              materialFolderMatch[e] = folder._id;
            });
            folder.pdfs.forEach((e) => {
              materialFolderMatch[e] = folder._id;
            });
            folder.images.forEach((e) => {
              materialFolderMatch[e] = folder._id;
            });
          });

          libraries.forEach((e) => {
            if (materialFolderMatch[e._id]) {
              e.folder = materialFolderMatch[e._id];
            }
          });

          const pageOption = this.materialService.pageOption.getValue();
          this.page = pageOption['page'];
          this.pageSize = {
            id: pageOption['pageSize'],
            label: pageOption['pageSize'] + ''
          };
          this.selectedSort = pageOption['sort'] || 'owner';
          this.selectedFolder = pageOption['selectedFolder'];
          this.searchStr = pageOption['searchStr'];
          this.matType = pageOption['matType'];
          this.teamOptions = pageOption['teamOptions'];
          this.userOptions = pageOption['userOptions'];
          this.folderOptions = pageOption['folderOptions'];
          this.isAdmin = pageOption['isAdmin'];

          if (this.libraries.length) {
            for (const library of this.libraries) {
              if (library.user) {
                if (library.user._id) {
                  if (library.user._id === this.user_id) {
                    library.owner = 'Me';
                  } else {
                    library.owner = library.user.user_name;
                  }
                } else {
                  if (library.user === this.user_id) {
                    library.owner = 'Me';
                  } else {
                    library.owner = 'Unknown';
                  }
                }
              } else {
                library.owner = 'Admin';
              }
              library.priority = library.priority || 0;
            }
          }

          const prevFolder = this.selectedFolder ? this.selectedFolder._id : '';
          if (folder_id && folder_id !== 'root') {
            this.openFolder(this.foldersKeyValue[folder_id]);
          } else {
            this.selectedFolder = null;
            this.filter();
          }
          const newFolder = this.selectedFolder ? this.selectedFolder._id : '';
          if (newFolder === prevFolder) {
            this.sort(this.selectedSort, true);
          } else {
            this.sort('owner', true);
          }
        }
      );
    });

    this.themes.forEach((e) => {
      this.themeJSON[e.id] = e;
    });
  }

  ngOnInit(): void {
    if (
      !this.handlerService.previousUrl ||
      this.handlerService.previousUrl.indexOf('/library') === -1
    ) {
      // this.materialService.loadMaterial(true);
      this.materialService.loadLibrary(true);
      // this.teamService.loadAll(true);
    }
    this.convertLoaderTimer = setInterval(() => {
      if (Object.keys(this.convertingVideos).length) {
        this.loadConvertingStatus();
      }
    }, 5000);
  }

  ngAfterViewInit(): void {
    // setTimeout(() => {
    //   this.route.queryParams.subscribe((params) => {
    //     if (params['video']) {
    //       this.dialog
    //         .open(VideoPopupComponent, {
    //           position: { top: '5vh' },
    //           width: '100vw',
    //           maxWidth: '500px',
    //           disableClose: true,
    //           data: {
    //             id: params['video']
    //           }
    //         })
    //         .afterClosed()
    //         .subscribe((res) => {
    //           this.materialService.loadMaterial(true);
    //           this.location.replaceState(`/materials`);
    //           this.goToMaterial(params['video']);
    //         });
    //     }
    //   });
    // }, 1000);
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.themesListSubscription && this.themesListSubscription.unsubscribe();
    clearInterval(this.convertLoaderTimer);
  }
  _downloadVideo(material: any, reloadFlag: boolean): void {
    this.materialService.createVideo(material).subscribe((res) => {
      if (res['status']) {
        // this.materialService.add$(res['data']);
        if (reloadFlag) {
          // this.d_status[element._id] = false;
          this.materialService.loadOwn(true);
        }
        if (!this.user.onboard.material_download) {
          this.user.onboard.material_download = true;
          this.userService
            .updateProfile({ onboard: this.user.onboard })
            .subscribe(() => {
              this.userService.updateProfileImpl({
                onboard: this.user.onboard
              });
            });
        }
        // this.toast.success('Library successfully downloaded.');
      }
    });
  }
  _downloadPdf(material: any, reloadFlag: boolean): void {
    this.materialService.createPdf(material).subscribe((res) => {
      if (res['status']) {
        if (reloadFlag) {
          // this.d_status[element._id] = false;
          this.materialService.loadOwn(true);
        }
        if (!this.user.onboard.material_download) {
          this.user.onboard.material_download = true;
          this.userService
            .updateProfile({ onboard: this.user.onboard })
            .subscribe(() => {
              this.userService.updateProfileImpl({
                onboard: this.user.onboard
              });
            });
        }
        // this.toast.success('Library successfully downloaded.');
      }
    });
  }
  _downloadImage(material: any, reloadFlag: boolean): void {
    this.materialService.createImage(material).subscribe((res) => {
      if (res['status']) {
        if (reloadFlag) {
          // this.d_status[element._id] = false;
          this.materialService.loadOwn(true);
        }
        if (!this.user.onboard.material_download) {
          this.user.onboard.material_download = true;
          this.userService
            .updateProfile({ onboard: this.user.onboard })
            .subscribe(() => {
              this.userService.updateProfileImpl({
                onboard: this.user.onboard
              });
            });
        }
        // this.toast.success('Library successfully downloaded.');
      }
    });
  }
  _downloadFolder(mId: any, material: any, reloadFlag: boolean): void {
    this.materialService.createFolder(material).subscribe((res) => {
      if (res) {
        if (this.libraries.length) {
          for (const library of this.libraries) {
            if (library.folder) {
              if (library.folder === mId) {
                library.folder = res._id;
                this.downloadMaterial(library, false);
              }
            }
          }
        }
        if (reloadFlag) {
          // this.d_status[element._id] = false;
          this.materialService.loadOwn(true);
        }
        if (!this.user.onboard.material_download) {
          this.user.onboard.material_download = true;
          this.userService
            .updateProfile({ onboard: this.user.onboard })
            .subscribe(() => {
              this.userService.updateProfileImpl({
                onboard: this.user.onboard
              });
            });
        }
        // this.toast.success('Library successfully downloaded.');
      }
    });
  }
  _fakeDownloading(mId: any): void {
    this.d_status[mId] = true;
    this.downloadTimer = setInterval(() => {
      this.d_status[mId] = false;
      clearInterval(this.downloadTimer);
    }, 2000);
  }
  downloadMaterial(element: Material, reloadFlag: boolean): void {
    let curElement = JSON.parse(JSON.stringify(element));
    curElement = _.omit(curElement, [
      '_id',
      'chunck_count',
      'company',
      'in_template',
      'is_draft',
      'material_type',
      'owner',
      'role',
      'videos',
      'views',
      '_v'
    ]);
    curElement.original_id = element._id;
    let isExist = false;
    let ConfirmDialog;
    for (const material of this.materials) {
      if (material.original_id === element._id) {
        isExist = true;
      }
    }
    if (element.material_type === 'video') {
      if (reloadFlag) {
        if (isExist) {
          ConfirmDialog = this.dialog.open(ConfirmComponent, {
            position: { top: '100px' },
            data: {
              title: 'Download Video',
              message: 'Are you sure to download this video again?',
              confirmLabel: 'Download',
              cancelLabel: 'Cancel'
            }
          });
          ConfirmDialog.afterClosed().subscribe((res) => {
            if (res) {
              this._fakeDownloading(element._id);
              this._downloadVideo(curElement, reloadFlag);
            }
          });
        } else {
          this._fakeDownloading(element._id);
          this._downloadVideo(curElement, reloadFlag);
        }
      } else {
        this._downloadVideo(curElement, reloadFlag);
      }
    } else if (element.material_type === 'pdf') {
      if (reloadFlag) {
        if (isExist) {
          ConfirmDialog = this.dialog.open(ConfirmComponent, {
            position: { top: '100px' },
            data: {
              title: 'Download Pdf',
              message: 'Are you sure to download this pdf again?',
              confirmLabel: 'Download',
              cancelLabel: 'Cancel'
            }
          });
          ConfirmDialog.afterClosed().subscribe((res) => {
            if (res) {
              this._fakeDownloading(element._id);
              this._downloadPdf(curElement, reloadFlag);
            }
          });
        } else {
          this._fakeDownloading(element._id);
          this._downloadPdf(curElement, reloadFlag);
        }
      } else {
        this._downloadPdf(curElement, reloadFlag);
      }
    } else if (element.material_type === 'image') {
      if (reloadFlag) {
        if (isExist) {
          ConfirmDialog = this.dialog.open(ConfirmComponent, {
            position: { top: '100px' },
            data: {
              title: 'Download Pdf',
              message: 'Are you sure to download this pdf again?',
              confirmLabel: 'Download',
              cancelLabel: 'Cancel'
            }
          });
          ConfirmDialog.afterClosed().subscribe((res) => {
            if (res) {
              this._fakeDownloading(element._id);
              this._downloadImage(curElement, reloadFlag);
            }
          });
        } else {
          this._fakeDownloading(element._id);
          this._downloadImage(curElement, reloadFlag);
        }
      } else {
        this._downloadImage(curElement, reloadFlag);
      }
    } else if (element.material_type === 'folder') {
      if (reloadFlag) {
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
              this._downloadFolder(element._id, curElement, reloadFlag);
            }
          });
        } else {
          this._fakeDownloading(element._id);
          this._downloadFolder(element._id, curElement, reloadFlag);
        }
      } else {
        this._downloadFolder(element._id, curElement, reloadFlag);
      }
    }
  }

  unshareMaterial(element): void {
    if (element.material_type === 'folder') {
      const data = { folders: [element._id] };
      this.teamService.unshareFolders(data).subscribe(() => {
        this.materialService.loadLibrary(true);
        // this.toast.success('This folder is private again.');
        this.materialService.update$(element._id, { role: '' });
      });
    } else if (element.material_type === 'video') {
      this.teamService.removeVideo(element._id).subscribe(() => {
        this.materialService.loadLibrary(true);
        // this.toast.success('This material is private again.');
        this.materialService.update$(element._id, { role: '' });
      });
    } else if (element.material_type === 'pdf') {
      this.teamService.removePdf(element._id).subscribe(() => {
        this.materialService.loadLibrary(true);
        // this.toast.success('This material is private again.');
        this.materialService.update$(element._id, { role: '' });
      });
    } else if (element.material_type === 'image') {
      this.teamService.removeImage(element._id).subscribe(() => {
        this.materialService.loadLibrary(true);
        // this.toast.success('This material is private again.');
        this.materialService.update$(element._id, { role: '' });
      });
    }
  }

  isSelected(element: Material): boolean {
    const pos = [...this.selectedFolders, ...this.selectedFiles].indexOf(
      element._id
    );
    if (pos !== -1) {
      return true;
    } else {
      return false;
    }
  }

  pageMasterToggle(): void {
    const start = (this.page - 1) * this.pageSize.id;
    const end = start + this.pageSize.id;
    const pageMaterials = this.filteredLibraries
      .slice(start, end)
      .filter((e) => {
        return e.material_type !== 'folder';
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
    const pageMaterials = this.filteredLibraries
      .slice(start, end)
      .filter((e) => {
        return e.material_type !== 'folder';
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

  isAllSelected(): boolean {
    // const selectionLength =
    //   this.selectedFolders.length + this.selectedFiles.length;
    // return (
    //   this.filteredMaterials.length &&
    //   selectionLength === this.filteredMaterials.length
    // );
    return this.filteredFiles.length === this.selectedFiles.length;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selectedFiles = [];
    } else {
      this.selectedFiles = this.filteredFiles.map((e) => e._id);
    }
    // this.changeCaptureAction();
  }

  toggleElement(element: Material): void {
    let selectionTemp;
    if (element.material_type === 'folder') {
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

  // changeCaptureAction(): void {
  //   // Check the lead capture Status
  //   const selectedMaterials = this.filteredLibraries
  //     .filter((e) => {
  //       if (
  //         e.material_type !== 'folder' &&
  //         this.selectedFiles.indexOf(e._id) !== -1
  //       ) {
  //         return true;
  //       }
  //       return false;
  //     })
  //     .map((e) => e._id);
  //   // Check the lead Capture Status
  //   const _intersection = _.intersection(selectedMaterials, [
  //     ...this.captureVideos,
  //     ...this.capturePdfs,
  //     ...this.captureImages
  //   ]);
  //   const bulkSetCapture = this.ACTIONS.filter(
  //     (action) => action.label == 'Capture'
  //   );
  //   if (!selectedMaterials.length) {
  //     bulkSetCapture[0].status = false;
  //     return;
  //   }
  //   if (_intersection.length === selectedMaterials.length) {
  //     // Enable the Lead Capture Status
  //     bulkSetCapture[0].status = true;
  //   } else {
  //     // Disable the Lead Capture Status
  //     bulkSetCapture[0].status = false;
  //   }
  // }

  clearSearchStr(): void {
    this.searchStr = '';
    this.filter();
  }

  createMaterial(type): void {
    if (this.selectedFolder) {
      this.router.navigate([
        `./materials/create/${type}/${this.selectedFolder._id}`
      ]);
    } else {
      this.router.navigate([`./materials/create/${type}`]);
    }
  }

  sendMaterial(material: Material, type: string = 'email'): void {
    this.dialog
      .open(MaterialSendComponent, {
        position: { top: '5vh' },
        width: '100vw',
        maxWidth: '600px',
        disableClose: true,
        data: {
          material: [material],
          type: type
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.redirect) {
          this.router.navigate(['/settings/integration']);
        }
      });
  }

  copyLink(material: Material): void {
    let url;
    if (material.material_type == 'video') {
      url =
        environment.website +
        '/video?video=' +
        material._id +
        '&user=' +
        this.user_id;
    } else if (material.material_type == 'pdf') {
      url =
        environment.website +
        '/pdf?pdf=' +
        material._id +
        '&user=' +
        this.user_id;
    } else if (material.material_type == 'image') {
      url =
        environment.website +
        '/image?image=' +
        material._id +
        '&user=' +
        this.user_id;
    }
    this.clipboard.copy(url);
    this.toast.success('Copied the link to clipboard');
  }

  setCapture(material: Material): void {
    const updateData = {};
    let pos;
    switch (material.material_type) {
      case 'video':
        pos = this.captureVideos.indexOf(material._id);
        const capturedVideos = [...this.captureVideos];
        if (pos !== -1) {
          capturedVideos.splice(pos, 1);
        } else {
          capturedVideos.push(material._id);
        }
        updateData['capture_videos'] = capturedVideos;
        break;
      case 'pdf':
        pos = this.capturePdfs.indexOf(material._id);
        const capturedPdfs = [...this.capturePdfs];
        if (pos !== -1) {
          capturedPdfs.splice(pos, 1);
        } else {
          capturedPdfs.push(material._id);
        }
        updateData['capture_pdfs'] = capturedPdfs;
        break;
      case 'image':
        pos = this.captureImages.indexOf(material._id);
        const capturedImages = [...this.captureImages];
        if (pos !== -1) {
          capturedImages.splice(pos, 1);
        } else {
          capturedImages.push(material._id);
        }
        updateData['capture_images'] = capturedImages;
        break;
    }
    this.userService.updateGarbage(updateData).subscribe((status) => {
      if (status) {
        this.userService.updateGarbageImpl(updateData);
        // this.changeCaptureAction();
      }
    });
  }

  isCaptured(material: Material): boolean {
    if (material.material_type === 'video') {
      if (this.captureVideos.indexOf(material._id) !== -1) {
        return true;
      }
      return false;
    } else if (material.material_type === 'pdf') {
      if (this.capturePdfs.indexOf(material._id) !== -1) {
        return true;
      }
      return false;
    } else if (material.material_type === 'image') {
      if (this.captureImages.indexOf(material._id) !== -1) {
        return true;
      }
      return false;
    }
  }

  editMaterial(material: Material): void {
    if (material.material_type === 'video') {
      this.editVideo(material);
    } else if (material.material_type === 'pdf') {
      this.editPdf(material);
    } else if (material.material_type === 'image') {
      this.editImage(material);
    }
  }

  editVideo(video: any): void {
    this.dialog.open(VideoEditComponent, {
      position: { top: '5vh' },
      width: '100vw',
      maxWidth: '500px',
      disableClose: true,
      data: {
        material: { ...video },
        type: 'edit'
      }
    });
  }

  editPdf(pdf: any): void {
    this.dialog.open(PdfEditComponent, {
      position: { top: '5vh' },
      width: '100vw',
      maxWidth: '500px',
      disableClose: true,
      data: {
        material: { ...pdf },
        type: 'edit'
      }
    });
  }

  editImage(image: any): void {
    this.dialog.open(ImageEditComponent, {
      position: { top: '5vh' },
      width: '100vw',
      maxWidth: '500px',
      disableClose: true,
      data: {
        material: { ...image },
        type: 'edit'
      }
    });
  }

  duplicateMaterial(material: any): void {
    switch (material.material_type) {
      case 'video':
        this.dialog.open(VideoEditComponent, {
          position: { top: '5vh' },
          width: '100vw',
          maxWidth: '500px',
          disableClose: true,
          data: {
            material: { ...material },
            type: 'duplicate'
          }
        });
        break;
      case 'pdf':
        this.dialog.open(PdfEditComponent, {
          position: { top: '5vh' },
          width: '100vw',
          maxWidth: '500px',
          disableClose: true,
          data: {
            material: { ...material },
            type: 'duplicate'
          }
        });
        break;
      case 'image':
        this.dialog.open(ImageEditComponent, {
          position: { top: '5vh' },
          width: '100vw',
          maxWidth: '500px',
          disableClose: true,
          data: {
            material: { ...material },
            type: 'duplicate'
          }
        });
        break;
    }
  }

  shareMaterial(material: any): void {
    const url = `${this.siteUrl}/${material.material_type}?${material.material_type}=${material._id}&user=${this.user_id}`;
    this.dialog.open(SocialShareComponent, {
      position: { top: '100px' },
      width: '100vw',
      maxWidth: '600px',
      data: {
        url: url
      }
    });
  }

  shareTeam(material: any): void {
    this.dialog.open(TeamMaterialShareComponent, {
      width: '98vw',
      maxWidth: '450px',
      data: {
        material: material,
        type: 'material'
      }
    });
  }

  hideMaterial(material: any): void {
    if (material.role === 'admin') {
      switch (material.material_type) {
        case 'video':
          this.dialog
            .open(ConfirmComponent, {
              position: { top: '100px' },
              data: {
                title: 'Hide Video',
                message: 'Are you sure you want to hide this video?',
                confirmLabel: 'Hide',
                cancelLabel: 'Cancel'
              }
            })
            .afterClosed()
            .subscribe((answer) => {
              if (answer) {
                const pos = this.editedVideos.indexOf(material._id);
                if (pos != -1) {
                  return;
                } else {
                  this.userService
                    .updateGarbage({
                      edited_video: [...this.editedVideos, material._id]
                    })
                    .subscribe(() => {
                      this.editedVideos.push(material._id);
                      this.userService.updateGarbageImpl({
                        edited_video: this.editedVideos
                      });
                      if (this.isSelected(material)) {
                        this.toggleElement(material);
                      }
                      this.materialService.delete$([material._id]);
                      // this.toast.success('Video has been hide successfully.');
                    });
                }
              }
            });
          break;
        case 'image':
          this.dialog
            .open(ConfirmComponent, {
              position: { top: '100px' },
              data: {
                title: 'Hide Image',
                message: 'Are you sure you want to hide this image?',
                confirmLabel: 'Hide',
                cancelLabel: 'Cancel'
              }
            })
            .afterClosed()
            .subscribe((answer) => {
              if (!answer) {
                return;
              }
              const pos = this.editedImages.indexOf(material._id);
              if (pos != -1) {
                return;
              } else {
                this.userService
                  .updateGarbage({
                    edited_image: [...this.editedImages, material._id]
                  })
                  .subscribe(() => {
                    this.editedImages.push(material._id);
                    this.userService.updateGarbageImpl({
                      edited_image: this.editedImages
                    });
                    if (this.isSelected(material)) {
                      this.toggleElement(material);
                    }
                    this.materialService.delete$([material._id]);
                    // this.toast.success('Image has been hide successfully.');
                  });
              }
            });
          break;
        case 'pdf':
          this.dialog
            .open(ConfirmComponent, {
              position: { top: '100px' },
              data: {
                title: 'Hide Pdf',
                message: 'Are you sure you want to delete this pdf?',
                confirmLabel: 'Hide',
                cancelLabel: 'Cancel'
              }
            })
            .afterClosed()
            .subscribe((answer) => {
              if (!answer) {
                return;
              }
              const pos = this.editedPdfs.indexOf(material._id);
              if (pos != -1) {
                return;
              } else {
                this.userService
                  .updateGarbage({
                    edited_pdf: [...this.editedPdfs, material._id]
                  })
                  .subscribe(() => {
                    this.editedPdfs.push(material._id);
                    this.userService.updateGarbageImpl({
                      edited_pdf: this.editedPdfs
                    });
                    if (this.isSelected(material)) {
                      this.toggleElement(material);
                    }
                    this.materialService.delete$([material._id]);
                    // this.toast.success('Pdf has been hide successfully.');
                  });
              }
            });
          break;
      }
    }
  }

  deleteMaterial(material: any): void {
    switch (material.material_type) {
      case 'video':
        const videoConfirmDialog = this.dialog.open(ConfirmComponent, {
          position: { top: '100px' },
          data: {
            title: 'Delete Video',
            message: 'Are you sure to delete this video?',
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel'
          }
        });
        if (material.role !== 'admin') {
          videoConfirmDialog.afterClosed().subscribe((res) => {
            if (res) {
              this.materialDeleteSubscription &&
                this.materialDeleteSubscription.unsubscribe();
              this.materialDeleteSubscription = this.materialService
                .deleteVideo(material._id)
                .subscribe((res) => {
                  if (this.isSelected(material)) {
                    this.toggleElement(material);
                  }
                  this.materialService.delete$([material._id]);
                  if (material.shared_video) {
                    this.materialService.update$(material.shared_video, {
                      has_shared: false,
                      shared_video: ''
                    });
                  }
                  // this.toast.success('Video has been deleted successfully.');
                });
            }
          });
        }
        break;
      case 'image':
        const imageConfirmDialog = this.dialog.open(ConfirmComponent, {
          position: { top: '100px' },
          data: {
            title: 'Delete Image',
            message: 'Are you sure you want to delete this Image?',
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel'
          }
        });
        if (material.role !== 'admin') {
          imageConfirmDialog.afterClosed().subscribe((res) => {
            if (res) {
              this.materialDeleteSubscription &&
                this.materialDeleteSubscription.unsubscribe();
              this.materialDeleteSubscription = this.materialService
                .deleteImage(material._id)
                .subscribe((res) => {
                  if (this.isSelected(material)) {
                    this.toggleElement(material);
                  }
                  this.materialService.delete$([material._id]);
                  if (material.shared_image) {
                    this.materialService.update$(material.shared_image, {
                      has_shared: false,
                      shared_image: ''
                    });
                  }
                  // this.toast.success('Image has been deleted successfully.');
                });
            }
          });
        }
        break;
      case 'pdf':
        const pdfConfirmDialog = this.dialog.open(ConfirmComponent, {
          position: { top: '100px' },
          data: {
            title: 'Delete Pdf',
            message: 'Are you sure to delete this pdf?',
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel'
          }
        });
        if (material.role !== 'admin') {
          pdfConfirmDialog.afterClosed().subscribe((res) => {
            if (res) {
              this.materialDeleteSubscription &&
                this.materialDeleteSubscription.unsubscribe();
              this.materialDeleteSubscription = this.materialService
                .deletePdf(material._id)
                .subscribe((res) => {
                  if (this.isSelected(material)) {
                    this.toggleElement(material);
                  }
                  this.materialService.delete$([material._id]);
                  if (material.shared_pdf) {
                    this.materialService.update$(material.shared_pdf, {
                      has_shared: false,
                      shared_pdf: ''
                    });
                  }
                  // this.toast.success('Pdf has been deleted successfully.');
                });
            }
          });
        }
        break;
    }
  }

  editTemplate(material: any): void {
    this.dialog.open(MaterialEditTemplateComponent, {
      position: { top: '10vh' },
      width: '100vw',
      maxWidth: '600px',
      disableClose: true,
      data: {
        id: material._id
      }
    });
  }

  leadCapture(material: any): void {
    this.dialog.open(LeadCaptureFormComponent, {
      position: { top: '100px' },
      width: '100vw',
      maxWidth: '600px',
      disableClose: true,
      data: {
        type: 'single',
        material: material
      }
    });
  }

  recordSetting(): void {
    this.handlerService.openRecording.next(new Date().getTime());
  }

  doFolderAction(evt: any): void {
    const selectedFolders = this.filteredLibraries.filter((e) => {
      if (
        e.material_type === 'folder' &&
        this.selectedFolders.indexOf(e._id) !== -1
      ) {
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
          this.removeFolder(selectedFolders[0]);
          break;
        case 'deselect':
          this.selectedFolders = [];
          break;
      }
      return;
    }
    switch (evt.command) {
      case 'edit':
        this.dialog.open(FolderComponent, {
          width: '96vw',
          maxWidth: '400px',
          data: {
            folders: [...this.selectedFolders]
          }
        });
        break;
      case 'delete':
        this.dialog.open(DeleteFolderComponent, {
          width: '96vw',
          maxWidth: '500px',
          data: {
            folders: [...selectedFolders]
          }
        });
        break;
      case 'deselect':
        this.selectedFolders = [];
        break;
    }
  }

  doAction(evt: any): void {
    const selectedMaterials = this.filteredLibraries.filter((e) => {
      if (
        e.material_type !== 'folder' &&
        this.selectedFiles.indexOf(e._id) !== -1
      ) {
        return true;
      }
      return false;
    });
    switch (evt.command) {
      case 'email':
        this.dialog.open(MaterialSendComponent, {
          position: { top: '5vh' },
          width: '96vw',
          maxWidth: '600px',
          disableClose: true,
          data: {
            material: [...selectedMaterials],
            type: 'email'
          }
        });
        break;
      case 'text':
        this.dialog.open(MaterialSendComponent, {
          position: { top: '5vh' },
          width: '96vw',
          maxWidth: '600px',
          disableClose: true,
          data: {
            material: [...selectedMaterials],
            type: 'text'
          }
        });
        break;
      case 'deselect':
        this.selectedFiles = [];
        break;
      case 'lead_capture':
        const materials = this.libraries.filter((e) => {
          if (
            e.material_type !== 'folder' &&
            this.selectedFiles.indexOf(e._id) !== -1
          ) {
            return true;
          }
          return false;
        });
        this.dialog.open(LeadCaptureFormComponent, {
          position: { top: '100px' },
          width: '100vw',
          maxWidth: '600px',
          disableClose: true,
          data: {
            type: 'all',
            materials: materials
          }
        });
        break;
      case 'folder':
        this.moveToFolder();
        break;
      case 'delete':
        if (!selectedMaterials.length) {
          return;
        } else {
          const confirmDialog = this.dialog.open(ConfirmComponent, {
            position: { top: '100px' },
            data: {
              title: 'Delete Materials',
              message: 'Are you sure to delete these selected materials?',
              confirmLabel: 'Delete',
              cancelLabel: 'Cancel'
            }
          });
          confirmDialog.afterClosed().subscribe((res) => {
            if (res) {
              const selectedAdminVideos = [];
              const selectedAdminPdfs = [];
              const selectedAdminImages = [];
              const selectedVideos = [];
              const selectedPdfs = [];
              const selectedImages = [];
              selectedMaterials.forEach((e) => {
                if (e.material_type === 'video') {
                  if (e.role === 'admin') {
                    selectedAdminVideos.push(e._id);
                  } else {
                    selectedVideos.push(e._id);
                  }
                } else if (e.material_type === 'pdf') {
                  if (e.role === 'admin') {
                    selectedAdminPdfs.push(e._id);
                  } else {
                    selectedPdfs.push(e._id);
                  }
                } else if (e.material_type === 'image') {
                  if (e.role === 'admin') {
                    selectedAdminImages.push(e._id);
                  } else {
                    selectedImages.push(e._id);
                  }
                }
              });
              if (
                selectedAdminVideos.length ||
                selectedAdminPdfs.length ||
                selectedAdminImages.length
              ) {
                const updateData = {};
                if (selectedAdminVideos.length) {
                  const editedVideos = _.union(
                    this.editedVideos,
                    selectedAdminVideos
                  );
                  updateData['edited_video'] = editedVideos;
                }
                if (selectedAdminPdfs.length) {
                  const editedPdfs = _.union(
                    this.editedPdfs,
                    selectedAdminPdfs
                  );
                  updateData['edited_pdf'] = editedPdfs;
                }
                if (selectedAdminImages.length) {
                  const editedImages = _.union(
                    this.editedImages,
                    selectedAdminImages
                  );
                  updateData['edited_image'] = editedImages;
                }

                // Call the Garbage Update
                this.userService
                  .updateGarbage(updateData)
                  .subscribe((status) => {
                    if (status) {
                      this.userService.updateGarbageImpl(updateData);
                      this.materialService.delete$([
                        ...updateData['edited_video'],
                        ...updateData['edited_image'],
                        ...updateData['edited_pdf']
                      ]);
                    }
                  });
              }

              if (
                selectedVideos.length ||
                selectedImages.length ||
                selectedPdfs.length
              ) {
                const removeData = {
                  videos: selectedVideos,
                  pdfs: selectedPdfs,
                  images: selectedImages
                };
                this.materialService
                  .bulkRemove(removeData)
                  .subscribe((status) => {
                    if (status) {
                      this.materialService.delete$([
                        ...selectedVideos,
                        ...selectedImages,
                        ...selectedPdfs
                      ]);
                      // Shared Materials Reset
                      const shared_materials = [];
                      selectedMaterials.forEach((e) => {
                        if (e.shared_video) {
                          shared_materials.push(e.shared_video);
                          return;
                        }
                        if (e.shared_pdf) {
                          shared_materials.push(e.shared_pdf);
                          return;
                        }
                        if (e.shared_image) {
                          shared_materials.push(e.shared_image);
                          return;
                        }
                      });
                      this.materialService.bulkUpdate$([...shared_materials], {
                        has_shared: false,
                        shared_video: '',
                        shared_pdf: '',
                        shared_image: ''
                      });
                      // this.toast.success(
                      //   'Selected materials have been deleted successfully.'
                      // );
                    }
                  });
              }
            }
          });
        }
        break;
      case 'template':
        this.dialog.open(MaterialEditTemplateComponent, {
          position: { top: '10vh' },
          width: '100vw',
          maxWidth: '600px',
          disableClose: true,
          data: {
            type: 'all',
            materials: selectedMaterials
          }
        });
        break;
    }
  }

  loadConvertingStatus(): void {
    const bucketVideos = [];
    const siteVideos = [];
    const keyId = {};
    for (const id in this.convertingVideos) {
      if (this.convertingVideos[id]) {
        bucketVideos.push(this.convertingVideos[id]);
        keyId[this.convertingVideos[id]] = id;
      } else {
        siteVideos.push(id);
      }
    }
    bucketVideos.forEach((e) => {
      this.convertCallSubscription[e] &&
        this.convertCallSubscription[e].unsubscribe();
      this.convertCallSubscription[
        e
      ] = this.materialService.getS3ConvertingStatus(e).subscribe(
        (res) => {
          if (
            res['converted'] === 100 &&
            res['streamd'] === 100 &&
            res['preview']
          ) {
            // Remove From Converting Video Status
            delete this.convertingVideos[keyId[e]];
            this.materialService
              .updateConvertStatus(keyId[e], res)
              .subscribe((_res) => {
                // Update the Video Convert Status
                this.materialService.updateConvert$(keyId[e], {
                  progress: 100,
                  converted: 'completed',
                  preview: _res.data && _res.data['preview']
                });
              });
          } else if (res['converted'] === 100 && res['error']) {
            delete this.convertingVideos[keyId[e]];
            this.materialService
              .updateConvertStatus(keyId[e], res)
              .subscribe((_res) => {
                // Update the Video Convert Status
                this.materialService.updateConvert$(keyId[e], {
                  progress: 100,
                  converted: 'completed',
                  preview: _res.data && _res.data['preview']
                });
              });
          } else if (res['error']) {
            if (this.convertCallingTimes[e]) {
              this.convertCallingTimes[e] = 1;
            } else {
              this.convertCallingTimes[e]++;
            }
          }
          this.materialService.updateConvert$(keyId[e], {
            progress: res['converted'] || 0
          });

          if (this.convertCallingTimes[e] && this.convertCallingTimes[e] > 10) {
            delete this.convertingVideos[keyId[e]];
          }
        },
        () => {
          if (this.convertCallingTimes[e]) {
            this.convertCallingTimes[e] = 1;
          } else {
            this.convertCallingTimes[e]++;
          }
          if (this.convertCallingTimes[e] && this.convertCallingTimes[e] > 10) {
            delete this.convertingVideos[keyId[e]];
          }
        }
      );
    });
    // this.videoConvertingLoadSubscription &&
    //   this.videoConvertingLoadSubscription.unsubscribe();
    // this.videoConvertingLoadSubscription = this.materialService
    //   .loadConvertingStatus(this.convertingVideos)
    //   .subscribe((res) => {
    //     this.materials.forEach((e) => {
    //       if (e.material_type !== 'video') {
    //         return;
    //       }
    //       if (e.converted !== 'completed' && e.converted !== 'disabled') {
    //         const convertingStatus = res[e._id];
    //         if (!convertingStatus) {
    //           return;
    //         }
    //         if (convertingStatus.status && convertingStatus.progress == 100) {
    //           e['converted'] = 'completed';
    //           const pos = this.convertingVideos.indexOf(e._id);
    //           if (pos !== -1) {
    //             this.convertingVideos.splice(pos, 1);
    //           }
    //         }
    //         if (convertingStatus.status && convertingStatus.progress < 100) {
    //           e['progress'] = convertingStatus.progress;
    //         }
    //         if (!convertingStatus.status) {
    //           e['convertingStatus'] = 'error';
    //           const pos = this.convertingVideos.indexOf(e._id);
    //           if (pos !== -1) {
    //             this.convertingVideos.splice(pos, 1);
    //           }
    //         }
    //       }
    //     });
    //   });
  }

  showAllCommonVideos(): void {
    this.userService.updateGarbage({ edited_video: [] }).subscribe(() => {
      this.editedVideos = [];
      this.userService.updateGarbageImpl({ edited_video: [] });
      this.materialService.loadVideos(true);
    });
  }

  showAllCommonPdfs(): void {
    this.userService.updateGarbage({ edited_pdf: [] }).subscribe(() => {
      this.editedPdfs = [];
      this.userService.updateGarbageImpl({ edited_pdf: [] });
      this.materialService.loadPdfs(true);
    });
  }

  showAllCommonImages(): void {
    this.userService.updateGarbage({ edited_image: [] }).subscribe(() => {
      this.editedImages = [];
      this.userService.updateGarbageImpl({ edited_image: [] });
      this.materialService.loadImages(true);
    });
  }

  openFolder(element: Material): void {
    this.selectedFolder = element;
    this.searchStr = '';
    this.matType = '';
    this.isAdmin = false;
    this.userOptions = [];
    this.teamOptions = [];
    this.folderOptions = [];
    this.filter();
  }
  toRoot(): void {
    this.selectedFolder = null;
    this.searchStr = '';
    this.matType = '';
    this.isAdmin = false;
    this.userOptions = [];
    this.teamOptions = [];
    this.folderOptions = [];
    this.filter();
  }

  createFolder(): void {
    this.dialog.open(FolderComponent, {
      width: '96vw',
      maxWidth: '400px'
    });
  }

  removeFolder(material: Material): void {
    if (
      material.videos.length +
      material.pdfs.length +
      material.images.length
    ) {
      this.dialog.open(DeleteFolderComponent, {
        width: '96vw',
        maxWidth: '500px',
        data: {
          material
        }
      });
    } else {
      this.dialog
        .open(ConfirmComponent, {
          width: '96vw',
          maxWidth: '400px',
          data: {
            title: 'Delete folder',
            message: 'Are you sure you want to remove the folder?',
            confirmLabel: 'Delete'
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            const data = {
              _id: material._id,
              mode: 'only-folder'
            };
            this.materialService
              .removeFolder(data) // answer
              .subscribe((res) => {
                if (res['status']) {
                  this.materialService.delete$([material._id]);
                }
              });
          }
        });
    }
  }

  editFolder(material: Material): void {
    this.dialog.open(FolderComponent, {
      width: '96vw',
      maxWidth: '400px',
      data: {
        folder: { ...material }
      }
    });
  }

  moveToFolder(material: any = null): void {
    let selectedMaterials = [];
    if (material) {
      selectedMaterials = [material];
    } else {
      selectedMaterials = this.filteredLibraries.filter((e) => {
        if (
          e.material_type !== 'folder' &&
          this.selectedFiles.indexOf(e._id) !== -1
        ) {
          return true;
        }
        return false;
      });
    }
    if (!selectedMaterials.length) {
      this.dialog.open(NotifyComponent, {
        width: '96vw',
        maxWidth: '360px',
        data: {
          message: 'You have to select material(s) to move those to the folder.'
        }
      });
      return;
    }
    if (selectedMaterials.length > 0) {
      this.dialog
        .open(MoveFolderComponent, {
          width: '96vw',
          maxWidth: '400px',
          data: {
            materials: selectedMaterials,
            currentFolder: this.selectedFolder
          }
        })
        .afterClosed()
        .subscribe((status) => {
          if (status) {
            this.selectedFiles = [];
          }
        });
    }
  }

  toggleAdminOption(): void {
    this.isAdmin = !this.isAdmin;
    this.filter();
  }
  toggleTeamOption(id: string): void {
    this.teamOptions = _.xor(this.teamOptions, [id]);
    this.filter();
  }
  toggleFolderOption(id: string): void {
    this.folderOptions = _.xor(this.folderOptions, [id]);
    this.filter();
  }
  toggleUserOption(id: string): void {
    this.userOptions = _.xor(this.userOptions, [id]);
    this.filter();
  }
  clearAllFilters(): void {
    this.searchStr = '';
    this.matType = '';
    this.isAdmin = false;
    this.userOptions = [];
    this.teamOptions = [];
    this.folderOptions = [];
    this.filter();
  }
  isEnableSearchOptions(): boolean {
    return !!(
      this.searchStr ||
      this.matType ||
      this.isAdmin ||
      this.userOptions.length ||
      this.teamOptions.length ||
      this.folderOptions.length
    );
  }

  changeSort(type: any): void {
    this.matType = type.id;
    this.sortType = type;
    this.filter();
  }

  filter(): void {
    this.selectedFolders = [];
    this.selectedFiles = [];
    const words = _.uniqBy(
      this.searchStr.split(' ').sort((a, b) => (a.length > b.length ? -1 : 1)),
      (e) => e.toLowerCase()
    );
    const reg = new RegExp(words.join('|'), 'gi');
    this.filteredLibraries = this.libraries.filter((material) => {
      if (this.selectedFolder) {
        if (this.selectedFolder._id !== material.folder) {
          return false;
        }
      } else if (!this.isEnableSearchOptions() && material.folder) {
        return false;
      }
      if (this.matType && material.material_type != this.matType) {
        return false;
      }
      if (
        this.searchStr &&
        words.length &&
        _.uniqBy((material.title || '').match(reg), (e) => e.toLowerCase())
          .length !== words.length
      ) {
        return false;
      }
      if (
        this.folderOptions.length &&
        (!material.folder || this.folderOptions.indexOf(material.folder) === -1)
      ) {
        return false;
      }
      if (
        this.teamOptions.length &&
        (!material.team || this.teamOptions.indexOf(material.team._id) === -1)
      ) {
        return false;
      }
      if (this.isAdmin && this.userOptions.length) {
        if (material.role === 'admin') {
          return true;
        }
        const userId =
          material.user && material.user._id
            ? material.user._id
            : material.user;
        if (this.userOptions.indexOf(userId) !== -1) {
          return true;
        }
        return false;
      }
      if (this.isAdmin && material.role != 'admin') {
        return false;
      }
      if (this.userOptions.length) {
        const userId =
          material.user && material.user._id
            ? material.user._id
            : material.user;
        if (this.userOptions.indexOf(userId) === -1) {
          return false;
        }
      }
      return true;
    });
    this.filteredFiles = this.filteredLibraries.filter((e) => {
      return e.material_type !== 'folder';
    });
    // this.page = 1;
    this.materialService.updatePageOption({
      selectedFolder: this.selectedFolder,
      searchStr: this.searchStr,
      matType: this.matType,
      teamOptions: this.teamOptions,
      userOptions: this.userOptions,
      folderOptions: this.folderOptions,
      isAdmin: this.isAdmin
      // page: 1
    });
  }

  changePageSize(type: any): void {
    this.pageSize = type;
    this.materialService.updatePageOption({ pageSize: this.pageSize.id });
  }

  download(video): void {
    if (!video.bucket) {
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = video.url;
      a.click();
    } else {
      this.materialService.downloadVideo(video._id).subscribe((res) => {
        if (res['status']) {
          saveAs(res['data'], res['title'] + '.mp4');
        } else {
          this.toast.warning(`Downloading is failed.`);
        }
      });
    }
  }

  /**
   * Sort the materials
   * @param field: Title, Owner, material_type, created_at, views
   * @param keep
   * @returns
   */
  sort(field: string, keep: boolean = false): void {
    let gravity = 1;
    if (!keep) {
      if (this.selectedSort === field) {
        this.searchCondition[field] = !this.searchCondition[field];
      } else {
        this.selectedSort = field;
        this.searchCondition[field] = true;
        this.materialService.updatePageOption({
          sort: field
        });
      }
    } else {
      this.selectedSort = field;
      this.searchCondition[field] = this.searchCondition[field];
    }
    gravity = this.searchCondition[field] ? 1 : -1;
    if (field !== 'material_type') {
      this.filteredLibraries = this.filteredLibraries.sort((a, b) => {
        const aMatType = a.material_type === 'folder' ? 'folder' : 'normal';
        const bMatType = b.material_type === 'folder' ? 'folder' : 'normal';
        if (aMatType === bMatType) {
          const aOwner =
            a.owner !== 'Admin' && a.owner !== 'Me' ? 'Other' : a.owner;
          const bOwner =
            b.owner !== 'Admin' && b.owner !== 'Me' ? 'Other' : b.owner;
          if (field === 'owner') {
            if (aOwner === bOwner) {
              if (aOwner === 'Other') {
                if (a.owner < b.owner) {
                  return -1 * gravity;
                } else {
                  return 1 * gravity;
                }
              } else if (aOwner === 'Admin') {
                if (a.material_type === b.material_type) {
                  if (a.priority < b.priority) {
                    return -1;
                  } else if (a.priority > b.priority) {
                    return 1;
                  } else {
                    return 0;
                  }
                } else {
                  return (
                    this.MAT_TYPE_SORT_LEVEL[a.material_type] -
                    this.MAT_TYPE_SORT_LEVEL[b.material_type]
                  );
                }
              } else if (aOwner === 'Me') {
                if (a.material_type === b.material_type) {
                  if (
                    (a.title || '').toLowerCase() <
                    (b.title || '').toLowerCase()
                  ) {
                    return -1;
                  } else {
                    return 1;
                  }
                } else {
                  return (
                    this.MAT_TYPE_SORT_LEVEL[a.material_type] -
                    this.MAT_TYPE_SORT_LEVEL[b.material_type]
                  );
                }
              }
            } else {
              return (
                (this.MAT_OWNER_SORT_LEVEL[aOwner] -
                  this.MAT_OWNER_SORT_LEVEL[bOwner]) *
                gravity
              );
            }
          } else {
            const aFieldVal =
              field === 'title' ? (a[field] || '').toLowerCase() : a[field];
            const bFieldVal =
              field === 'title' ? (b[field] || '').toLowerCase() : b[field];
            if (aFieldVal < bFieldVal) {
              return -1 * gravity;
            }
            if (aFieldVal > bFieldVal) {
              return 1 * gravity;
            }
            if (aOwner === bOwner) {
              if (aOwner === 'Other') {
                if (a.owner < b.owner) {
                  return -1;
                } else {
                  return 1;
                }
              } else if (aOwner === 'Admin') {
                if (a.priority < b.priority) {
                  return -1;
                } else if (a.priority < b.priority) {
                  return 1;
                } else {
                  return 0;
                }
              } else if (aOwner === 'Me') {
                if (
                  (a.title || '').toLowerCase() < (b.title || '').toLowerCase()
                ) {
                  return -1;
                } else {
                  return 1;
                }
              }
            } else {
              return (
                this.MAT_OWNER_SORT_LEVEL[aOwner] -
                this.MAT_OWNER_SORT_LEVEL[bOwner]
              );
            }
          }
        } else {
          return (
            this.MAT_TYPE_SORT_LEVEL[aMatType] -
            this.MAT_TYPE_SORT_LEVEL[bMatType]
          );
        }
      });
    } else {
      this.filteredLibraries = this.filteredLibraries.sort((a, b) => {
        if (a.material_type === b.material_type) {
          const aOwner =
            a.owner !== 'Admin' && a.owner !== 'Me' ? 'Other' : a.owner;
          const bOwner =
            b.owner !== 'Admin' && b.owner !== 'Me' ? 'Other' : b.owner;
          if (aOwner === bOwner) {
            if (aOwner === 'Other') {
              if (a.owner < b.owner) {
                return -1;
              } else {
                return 1;
              }
            } else if (aOwner === 'Admin') {
              if (a.priority < b.priority) {
                return -1;
              } else if (a.priority > b.priority) {
                return 1;
              } else {
                return 0;
              }
            } else {
              if (
                (a.title || '').toLowerCase() < (b.title || '').toLowerCase()
              ) {
                return -1;
              } else {
                return 1;
              }
            }
          } else {
            return (
              this.MAT_OWNER_SORT_LEVEL[aOwner] -
              this.MAT_OWNER_SORT_LEVEL[bOwner]
            );
          }
        } else {
          return (
            (this.MAT_TYPE_SORT_LEVEL[a.material_type] -
              this.MAT_TYPE_SORT_LEVEL[b.material_type]) *
            gravity
          );
        }
      });
    }
  }

  changePage(event) {
    this.page = event;
    this.materialService.updatePageOption({ page: this.page });
  }

  checkType(url: string): boolean {
    if (!url) {
      return true;
    }
    if (url.indexOf('youtube.com') == -1 && url.indexOf('vimeo.com') == -1) {
      return true;
    } else {
      return false;
    }
  }

  rowHover(index: any): void {
    // this.dropdown = this.dropdowns['_results'][index];
    // if (this.dropdown.isOpen()) {
    //   this.dropdown.close();
    // }
  }

  goToMaterial(id: string): void {
    const index = _.findIndex(this.filteredLibraries, function (e) {
      return e._id == id;
    });
    const page = Math.ceil((index + this.folders.length) / this.pageSize.id);
    this.changePage(page);
    setTimeout(() => {
      const el = this.myElement.nativeElement.querySelector(
        '#material-video-' + id
      );
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('focus');
        setTimeout(() => {
          if (el) {
            el.classList.remove('focus');
          }
        }, 2000);
      }
    }, 2000);
  }
}
