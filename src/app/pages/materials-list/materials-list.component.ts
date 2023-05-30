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
import { ConfirmBulkMaterialsComponent } from 'src/app/components/confirm-bulk-materials/confirm-bulk-materials.component';
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
import { v4 as uuidv4 } from 'uuid';
import { MaterialChangeComponent } from 'src/app/components/material-change/material-change.component';
@Component({
  selector: 'app-materials-list',
  templateUrl: './materials-list.component.html',
  styleUrls: ['./materials-list.component.scss']
})
export class MaterialsListComponent implements OnInit, AfterViewInit {
  user: User = new User();
  DISPLAY_COLUMNS = [
    'select',
    'material_name',
    'share',
    'theme',
    'type',
    'created_at',
    'analytics',
    'capture_form',
    'sub_actions',
    'actions'
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

  user_id = '';
  themeJSON = {};
  sortType = this.SORT_TYPES[0];

  pageSize = this.PAGE_COUNTS[2];
  page = 1;

  garbage: Garbage = new Garbage();
  global_theme = '';
  material_themes = {};
  materials: any[] = [];
  filteredMaterials: any[] = [];
  filteredFiles: any[] = [];
  selectedFolders: any[] = [];
  selectedFiles: any[] = [];

  convertLoaderTimer;
  convertingVideos = {};
  videoConvertingLoadSubscription: Subscription;
  convertCallingTimes = {};
  convertCallSubscription = {};

  profileSubscription: Subscription;
  garbageSubscription: Subscription;
  loadSubscription: Subscription;
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
      }
    );
    this.garbageSubscription = this.userService.garbage$.subscribe((res) => {
      this.garbage = new Garbage().deserialize(res);
      this.global_theme = this.garbage.material_theme;
      this.material_themes = this.garbage.material_themes || {};
    });
    this.routeChangeSubscription = this.route.params.subscribe((params) => {
      if (params['page'] === 'library') {
        return;
      }
      const folder_id = params['folder'];

      this.loadSubscription && this.loadSubscription.unsubscribe();
      this.loadSubscription = this.storeService.materials$.subscribe(
        (materials) => {
          this.convertingVideos = {};
          materials.forEach((e) => {
            if (e.material_type === 'video') {
              if (e.converted !== 'completed' && e.converted !== 'failed') {
                this.convertingVideos[e._id] = e.key;
              }
            }
          });

          this.materials = materials;
          this.materials = _.uniqBy(this.materials, '_id');

          const folders = materials.filter((e) => {
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

          materials.forEach((e) => {
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

          if (this.materials.length) {
            for (const material of this.materials) {
              if (material.user) {
                if (material.user._id) {
                  if (material.user._id === this.user_id) {
                    material.owner = 'Me';
                  } else {
                    material.owner = material.user.user_name;
                  }
                } else {
                  if (material.user === this.user_id) {
                    material.owner = 'Me';
                  } else {
                    material.owner = 'Unknown';
                  }
                }
              } else {
                material.owner = 'Admin';
              }
              material.priority = material.priority || 0;

              this.teamService.teams$.subscribe((teams) => {
                for (const team of teams) {
                  let index = -1;
                  if (team.owner && team.owner.length > 0) {
                    index = team.owner.findIndex(
                      (item) => item._id === this.user_id
                    );
                  } else if (team.editors && team.editors.length > 0) {
                    index = team.editors.findIndex(
                      (item) => item._id === this.user_id
                    );
                  }

                  if (index >= 0) {
                    let shared = false;
                    if (material.material_type === 'video') {
                      shared = team.videos.some((item) => item == material._id);
                    } else if (material.material_type === 'image') {
                      shared = team.images.some((item) => item == material._id);
                    } else if (material.material_type === 'pdf') {
                      shared = team.pdfs.some((item) => item == material._id);
                    } else if (material.material_type === 'folder') {
                      shared = team.folders.some(
                        (item) => item == material._id
                      );
                    }

                    if (shared) {
                      if (material.shared_with) {
                        material.shared_with.push({
                          id: team._id,
                          name: team.name
                        });
                        material.shared_with = _.uniqBy(
                          material.shared_with,
                          'id'
                        );
                      } else {
                        material.shared_with = [
                          { id: team._id, name: team.name }
                        ];
                      }
                    }
                  }
                }
              });
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
      this.handlerService.previousUrl.indexOf('/materials') === -1 ||
      this.handlerService.previousUrl.indexOf('/materials/create') !== -1 ||
      this.handlerService.previousUrl.indexOf('/materials/analytics') !== -1
    ) {
      this.teamService.loadAll(true);
      this.materialService.loadOwn(true);
    }
    this.convertLoaderTimer = setInterval(() => {
      if (Object.keys(this.convertingVideos).length) {
        this.loadConvertingStatus();
      }
    }, 5000);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.route.queryParams.subscribe((params) => {
        if (params['video']) {
          this.dialog
            .open(VideoPopupComponent, {
              position: { top: '5vh' },
              width: '100vw',
              maxWidth: '500px',
              disableClose: true,
              data: {
                id: params['video']
              }
            })
            .afterClosed()
            .subscribe((res) => {
              this.materialService.loadMaterial(true);
              this.location.replaceState(`/materials`);
              this.goToMaterial(params['video']);
            });
        }
      });
    }, 1000);
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.themesListSubscription && this.themesListSubscription.unsubscribe();
    clearInterval(this.convertLoaderTimer);
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
    const pageMaterials = this.filteredMaterials
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
    const pageMaterials = this.filteredMaterials
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
  //   const selectedMaterials = this.filteredMaterials
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
  generateTrackableLink(material: Material): void {
    let url;
    let tempData;
    if (material.material_type == 'video') {
      tempData = {
        content: 'generated link',
        send_uuid: uuidv4(),
        type: 'videos',
        videos: [material._id]
      };
    } else if (material.material_type == 'pdf') {
      tempData = {
        content: 'generated link',
        send_uuid: uuidv4(),
        type: 'pdfs',
        pdfs: [material._id]
      };
    } else {
      tempData = {
        content: 'generated link',
        send_uuid: uuidv4(),
        type: 'images',
        images: [material._id]
      };
    }
    this.materialService.createActivity(tempData).subscribe((res) => {
      if (res) {
        if (material.material_type == 'video') {
          url = environment.website + '/video6/' + tempData.send_uuid;
        } else if (material.material_type == 'pdf') {
          url = environment.website + '/pdf6/' + tempData.send_uuid;
        } else if (material.material_type == 'image') {
          url = environment.website + '/image6/' + tempData.send_uuid;
        }
        this.clipboard.copy(url);
        this.toast.success('Generated the trackable link to clipboard');
      }
    });
  }

  copyLink(material: Material): void {
    let url;
    if (material.material_type == 'video') {
      url = environment.website + '/video/' + material._id;
    } else if (material.material_type == 'pdf') {
      url = environment.website + '/pdf/' + material._id;
    } else if (material.material_type == 'image') {
      url = environment.website + '/image1/' + material._id;
    }
    this.clipboard.copy(url);
    this.toast.success('Copied the link to clipboard');
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
                  if (res.failed?.length > 0) {
                    this.dialog.open(ConfirmBulkMaterialsComponent, {
                      position: { top: '100px' },
                      width: '657px',
                      maxWidth: '657px',
                      disableClose: true,
                      data: {
                        title: 'Delete Materials',
                        additional: res.failed,
                        user_id: this.user_id,
                        message:
                          "You can't remove following materials because those have been used in different places. Click expand to see detail reason."
                      }
                    });
                  } else {
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
                  if (res.failed?.length > 0) {
                    this.dialog.open(ConfirmBulkMaterialsComponent, {
                      position: { top: '100px' },
                      width: '657px',
                      maxWidth: '657px',
                      disableClose: true,
                      data: {
                        title: 'Delete Materials',
                        additional: res.failed,
                        user_id: this.user_id,
                        message:
                          "You can't remove following materials because those have been used in different places. Click expand to see detail reason."
                      }
                    });
                  } else {
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
                  if (res.failed?.length > 0) {
                    this.dialog.open(ConfirmBulkMaterialsComponent, {
                      position: { top: '100px' },
                      width: '657px',
                      maxWidth: '657px',
                      disableClose: true,
                      data: {
                        title: 'Delete Materials',
                        additional: res.failed,
                        message:
                          "You can't remove following materials because those have been used in different places. Click expand to see detail reason."
                      }
                    });
                  } else {
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
    this.dialog
      .open(LeadCaptureFormComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '600px',
        disableClose: true,
        data: {
          type: 'single',
          material: material
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          material.enabled_capture = res.enabled_capture;
          material.capture_form = res.capture_form;
        }
      });
  }

  recordSetting(): void {
    this.handlerService.openRecording.next(new Date().getTime());
  }

  doFolderAction(evt: any): void {
    const selectedFolders = this.filteredMaterials.filter((e) => {
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
    const selectedMaterials = this.filteredMaterials.filter((e) => {
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
        const materials = this.materials.filter((e) => {
          if (
            e.material_type !== 'folder' &&
            this.selectedFiles.indexOf(e._id) !== -1
          ) {
            return true;
          }
          return false;
        });
        this.dialog
          .open(LeadCaptureFormComponent, {
            position: { top: '100px' },
            width: '100vw',
            maxWidth: '600px',
            disableClose: true,
            data: {
              type: 'all',
              materials: materials
            }
          })
          .afterClosed()
          .subscribe((res) => {
            if (res) {
              materials.forEach((e) => {
                e.enabled_capture = res.enabled_capture;
              });
              materials.forEach((e) => {
                e.capture_form = res.capture_form;
              });
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
              const selectedVideos = [];
              const selectedPdfs = [];
              const selectedImages = [];
              selectedMaterials.forEach((e) => {
                if (e.material_type === 'video') {
                  selectedVideos.push(e._id);
                } else if (e.material_type === 'pdf') {
                  selectedPdfs.push(e._id);
                } else if (e.material_type === 'image') {
                  selectedImages.push(e._id);
                }
              });
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
                this.materialService.bulkRemove(removeData).subscribe((res) => {
                  if (res.status) {
                    if (res.failed?.length > 0) {
                      this.dialog
                        .open(ConfirmBulkMaterialsComponent, {
                          position: { top: '100px' },
                          width: '657px',
                          maxWidth: '657px',
                          disableClose: true,
                          data: {
                            title: 'Delete Materials',
                            additional: res.failed,
                            message:
                              "You can't remove following materials because those have been used in different places. Click expand to see detail reason."
                          }
                        })
                        .afterClosed()
                        .subscribe(() => {
                          const total =
                            selectedVideos.length +
                            selectedImages.length +
                            selectedPdfs.length;
                          if (res.failed.length !== total) {
                            this.materialService.loadOwn(true);
                          }
                        });
                    } else {
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
                    }
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

  shareFolder(folder: any): void {
    this.dialog.open(TeamMaterialShareComponent, {
      width: '98vw',
      maxWidth: '450px',
      data: {
        folder: folder,
        isFolder: true,
        type: 'material'
      }
    });
  }

  unshareMaterial(element): void {
    let data;
    if (element.material_type === 'folder') {
      data = {
        folder: element,
        isFolder: true,
        type: 'material',
        unshare: true
      };
    } else {
      data = {
        material: element,
        type: 'material',
        unshare: true
      };
    }
    this.dialog.open(TeamMaterialShareComponent, {
      width: '98vw',
      maxWidth: '450px',
      data
    });
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
      selectedMaterials = this.filteredMaterials.filter((e) => {
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
    this.filteredMaterials = this.materials.filter((material) => {
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
    this.filteredFiles = this.filteredMaterials.filter((e) => {
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
      this.filteredMaterials = this.filteredMaterials.sort((a, b) => {
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
      this.filteredMaterials = this.filteredMaterials.sort((a, b) => {
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
    this.dropdown = this.dropdowns['_results'][index];
    if (this.dropdown.isOpen()) {
      this.dropdown.close();
    }
  }

  goToMaterial(id: string): void {
    const index = _.findIndex(this.filteredMaterials, function (e) {
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

  getCaptureForm(id: string): any {
    if (id) {
      return this.garbage?.capture_field?.[id]?.name;
    } else {
      return '';
    }
  }
}
