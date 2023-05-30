import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MaterialService } from 'src/app/services/material.service';
import { StoreService } from 'src/app/services/store.service';
import { ToastrService } from 'ngx-toastr';
import { UserService } from 'src/app/services/user.service';
import { User } from 'src/app/models/user.model';
import { Garbage } from 'src/app/models/garbage.model';
import { TabItem } from 'src/app/utils/data.types';
import { environment } from 'src/environments/environment';
import { BulkActions } from 'src/app/constants/variable.constants';
import { SelectionModel } from '@angular/cdk/collections';
import { MaterialEditTemplateComponent } from 'src/app/components/material-edit-template/material-edit-template.component';
import { RecordSettingDialogComponent } from '../../components/record-setting-dialog/record-setting-dialog.component';
import { Subscription } from 'rxjs';
import { ConfirmComponent } from 'src/app/components/confirm/confirm.component';
import { VideoEditComponent } from 'src/app/components/video-edit/video-edit.component';
import { PdfEditComponent } from 'src/app/components/pdf-edit/pdf-edit.component';
import { ImageEditComponent } from 'src/app/components/image-edit/image-edit.component';
import { STATUS } from 'src/app/constants/variable.constants';
import { MaterialSendComponent } from 'src/app/components/material-send/material-send.component';

@Component({
  selector: 'app-material',
  templateUrl: './material.component.html',
  styleUrls: ['./material.component.scss']
})
export class MaterialComponent implements OnInit {
  mode = '';
  user: User = new User();
  garbage: Garbage = new Garbage();
  BULK_ACTIONS = BulkActions.Materials;
  tabs: TabItem[] = [
    { icon: 'i-icon i-video', label: 'Video', id: 'video' },
    { icon: 'i-icon i-pdf', label: 'Pdf', id: 'pdf' },
    { icon: 'i-icon i-image', label: 'Image', id: 'image' }
  ];
  selectedTab: TabItem = this.tabs[0];
  siteUrl = environment.website;
  user_id = '';
  STATUS = STATUS;

  videos: any[] = [];
  adminVideos: any[] = [];
  ownVideos: any[] = [];
  teamVideos: any[] = [];

  pdfs: any[] = [];
  adminPdfs: any[] = [];
  ownPdfs: any[] = [];
  teamPdfs: any[] = [];

  images: any[] = [];
  adminImages: any[] = [];
  ownImages: any[] = [];
  teamImages: any[] = [];

  convertLoaderTimer;
  convertingVideos = [];
  videoConvertingLoadSubscription: Subscription;

  videoLoadSubscription: Subscription;
  pdfLoadSubscription: Subscription;
  imageLoadSubscription: Subscription;

  videoDeleteSubscription: Subscription;
  pdfDeleteSubscription: Subscription;
  imageDeleteSubscription: Subscription;

  selectedVideoLists = new SelectionModel<any>(true, []);
  selectedPdfLists = new SelectionModel<any>(true, []);
  selectedImageLists = new SelectionModel<any>(true, []);
  captureVideos = [];
  editedVideos;
  capturePdfs = [];
  editedPdfs;
  captureImages = [];
  editedImages;
  currentFolder = '';

  constructor(
    private dialog: MatDialog,
    public storeService: StoreService,
    public materialService: MaterialService,
    private userService: UserService,
    private toast: ToastrService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loadVideos();
    this.loadImages();
    this.loadPdfs();
    this.userService.profile$.subscribe((profile) => {
      this.user = profile;
      this.user_id = this.user._id;
    });
    this.userService.garbage$.subscribe((res) => {
      this.garbage = new Garbage().deserialize(res);
      this.captureVideos = this.garbage['capture_videos'] || [];
      this.editedVideos = this.garbage['edited_video'] || [];
      this.capturePdfs = this.garbage['capture_pdfs'] || [];
      this.editedPdfs = this.garbage['edited_pdf'] || [];
      this.captureImages = this.garbage['capture_images'] || [];
      this.editedImages = this.garbage['edited_image'] || [];
    });
  }

  ngOnInit(): void {
    this.mode = this.route.snapshot.params['id'];
    this.currentFolder = this.route.snapshot.params['folderId'];
    this.materialService.loadVideos(true);
    this.materialService.loadPdfs(true);
    this.materialService.loadImages(true);
    this.convertLoaderTimer = setInterval(() => {
      if (this.convertingVideos.length) {
        this.loadConvertingStatus();
      }
    }, 5000);
  }

  ngOnDestroy(): void {
    this.videoLoadSubscription && this.videoLoadSubscription.unsubscribe();
    this.pdfLoadSubscription && this.pdfLoadSubscription.unsubscribe();
    this.imageLoadSubscription && this.imageLoadSubscription.unsubscribe();
    this.videoDeleteSubscription && this.videoDeleteSubscription.unsubscribe();
    this.pdfDeleteSubscription && this.pdfDeleteSubscription.unsubscribe();
    this.imageDeleteSubscription && this.imageDeleteSubscription.unsubscribe();
    clearInterval(this.convertLoaderTimer);
  }

  changeTab(tab: TabItem): void {
    this.selectedTab = tab;
  }

  loadVideos(): void {
    this.videoLoadSubscription && this.videoLoadSubscription.unsubscribe();
    this.videoLoadSubscription = this.storeService.videos$.subscribe(
      (videos) => {
        this.videos = videos;
        this.adminVideos = [];
        this.ownVideos = [];
        this.teamVideos = [];
        const videoIds = [];
        videos.forEach((e) => {
          if (videoIds.indexOf(e._id) !== -1) {
            return;
          }
          if (e.converted !== 'completed' && e.converted !== 'disabled') {
            this.convertingVideos.push(e._id);
          }
          if (e.role == 'admin') {
            this.adminVideos.push(e);
          } else if (e.role === 'team' && e.user !== this.user_id) {
            this.teamVideos.push(e);
          } else {
            this.ownVideos.push(e);
          }
          videoIds.push(e._id);
        });
      }
    );
  }

  loadPdfs(): void {
    this.pdfLoadSubscription && this.pdfLoadSubscription.unsubscribe();
    this.pdfLoadSubscription = this.storeService.pdfs$.subscribe((pdfs) => {
      this.pdfs = pdfs;
      this.adminPdfs = [];
      this.teamPdfs = [];
      this.ownPdfs = [];
      const pdfIds = [];
      pdfs.forEach((e) => {
        if (pdfIds.indexOf(e._id) !== -1) {
          return;
        }
        if (e.role == 'admin') {
          this.adminPdfs.push(e);
        } else if (e.role == 'team' && e.user != this.user_id) {
          this.teamPdfs.push(e);
        } else {
          this.ownPdfs.push(e);
        }
        pdfIds.push(e._id);
      });
    });
  }

  loadImages(): void {
    this.imageLoadSubscription && this.imageLoadSubscription.unsubscribe();
    this.imageLoadSubscription = this.storeService.images$.subscribe(
      (images) => {
        this.images = images;
        this.adminImages = [];
        this.ownImages = [];
        this.teamImages = [];
        const imageIds = [];
        images.forEach((e) => {
          if (imageIds.indexOf(e._id) !== -1) {
            return;
          }
          if (e.role == 'admin') {
            this.adminImages.push(e);
          } else if (e.role == 'team' && e.user != this.user_id) {
            this.teamImages.push(e);
          } else {
            this.ownImages.push(e);
          }
          imageIds.push(e._id);
        });
      }
    );
  }

  createVideo(): void {
    this.router.navigate([`./materials/create/${this.selectedTab.id}`]);
  }

  goToBack(): void {
    this.router.navigate(['./materials']);
  }

  sendMaterial(material: any, type: string): void {
    this.dialog.open(MaterialSendComponent, {
      position: { top: '5vh' },
      width: '100vw',
      maxWidth: '600px',
      disableClose: false,
      data: {
        material: [material],
        materialType: type
      }
    });
  }

  copyLink(material: any, type: string): void {
    let url;

    if (type == 'video') {
      url =
        environment.website +
        '/video?video=' +
        material._id +
        '&user=' +
        this.user_id;
    } else if (type == 'pdf') {
      url =
        environment.website +
        '/pdf?pdf=' +
        material._id +
        '&user=' +
        this.user_id;
    } else if (type == 'image') {
      url =
        environment.website +
        '/image?image=' +
        material._id +
        '&user=' +
        this.user_id;
    }
    const el = document.createElement('textarea');
    el.value = url;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    this.toast.success('Copied the link to clipboard');
  }

  selectAllPage(type: string): void {
    const bulkSetCapture = this.BULK_ACTIONS.filter(
      (action) => action.label == 'Lead Capture'
    );
    switch (type) {
      case 'video':
        if (this.isSelectedPage(type)) {
          this.selectedVideoLists.clear();
        } else {
          if (this.mode == 'provided') {
            this.adminVideos.forEach((e) =>
              this.selectedVideoLists.select(e._id)
            );
          } else if (this.mode == 'own') {
            this.ownVideos.forEach((e) =>
              this.selectedVideoLists.select(e._id)
            );
          } else {
            this.teamVideos.forEach((e) =>
              this.selectedVideoLists.select(e._id)
            );
          }
        }
        const videoCaptureStatus = this.selectedVideoLists.selected.every(
          (video) => this.captureVideos.includes(video)
        );
        // if (videoCaptureStatus) {
        //   bulkSetCapture[0].status = true;
        // } else {
        //   bulkSetCapture[0].status = false;
        // }
        break;
      case 'pdf':
        if (this.isSelectedPage(type)) {
          this.selectedPdfLists.clear();
        } else {
          if (this.mode == 'provided') {
            this.adminPdfs.forEach((e) => this.selectedPdfLists.select(e._id));
          } else if (this.mode == 'own') {
            this.ownPdfs.forEach((e) => this.selectedPdfLists.select(e._id));
          } else {
            this.teamPdfs.forEach((e) => this.selectedPdfLists.select(e._id));
          }
        }
        const pdfCaptureStatus = this.selectedPdfLists.selected.every((pdf) =>
          this.capturePdfs.includes(pdf)
        );
        // if (pdfCaptureStatus) {
        //   bulkSetCapture[0].status = true;
        // } else {
        //   bulkSetCapture[0].status = false;
        // }
        break;
      case 'image':
        if (this.isSelectedPage(type)) {
          this.selectedImageLists.clear();
        } else {
          if (this.mode == 'provided') {
            this.adminImages.forEach((e) =>
              this.selectedImageLists.select(e._id)
            );
          } else if (this.mode == 'own') {
            this.ownImages.forEach((e) =>
              this.selectedImageLists.select(e._id)
            );
          } else {
            this.teamImages.forEach((e) =>
              this.selectedImageLists.select(e._id)
            );
          }
        }
        const imageCaptureStatus = this.selectedImageLists.selected.every(
          (image) => this.captureImages.includes(image)
        );
        // if (imageCaptureStatus) {
        //   bulkSetCapture[0].status = true;
        // } else {
        //   bulkSetCapture[0].status = false;
        // }
        break;
    }
  }

  isSelectedPage(type: string): any {
    switch (type) {
      case 'video':
        let videoCounts, selectedVideoCounts;
        if (this.mode == 'provided') {
          videoCounts = this.adminVideos.length;
          selectedVideoCounts = this.selectedVideoLists.selected.length;
          return videoCounts == selectedVideoCounts;
        } else if (this.mode == 'own') {
          videoCounts = this.ownVideos.length;
          selectedVideoCounts = this.selectedVideoLists.selected.length;
          return videoCounts == selectedVideoCounts;
        } else {
          videoCounts = this.teamVideos.length;
          selectedVideoCounts = this.selectedVideoLists.selected.length;
          return videoCounts == selectedVideoCounts;
        }
      case 'pdf':
        let pdfCounts, selectedPdfCounts;
        if (this.mode == 'provided') {
          pdfCounts = this.adminPdfs.length;
          selectedPdfCounts = this.selectedPdfLists.selected.length;
          return pdfCounts == selectedPdfCounts;
        } else if (this.mode == 'own') {
          pdfCounts = this.ownPdfs.length;
          selectedPdfCounts = this.selectedPdfLists.selected.length;
          return pdfCounts == selectedPdfCounts;
        } else {
          pdfCounts = this.teamPdfs.length;
          selectedPdfCounts = this.selectedPdfLists.selected.length;
          return pdfCounts == selectedPdfCounts;
        }
      case 'image':
        let imageCounts, selectedImageCounts;
        if (this.mode == 'provided') {
          imageCounts = this.adminImages.length;
          selectedImageCounts = this.selectedImageLists.selected.length;
          return imageCounts == selectedImageCounts;
        } else if (this.mode == 'own') {
          imageCounts = this.ownImages.length;
          selectedImageCounts = this.selectedImageLists.selected.length;
          return imageCounts == selectedImageCounts;
        } else {
          imageCounts = this.teamImages.length;
          selectedImageCounts = this.selectedImageLists.selected.length;
          return imageCounts == selectedImageCounts;
        }
    }
  }

  selectMaterial(material_id: string, type: string): void {
    const bulkSetCapture = this.BULK_ACTIONS.filter(
      (action) => action.label == 'Lead Capture'
    );
    switch (type) {
      case 'video':
        this.selectedVideoLists.toggle(material_id);
        const videoCaptureStatus = this.selectedVideoLists.selected.every(
          (video) => this.captureVideos.includes(video)
        );
        // if (videoCaptureStatus) {
        //   bulkSetCapture[0].status = true;
        // } else {
        //   bulkSetCapture[0].status = false;
        // }
        break;
      case 'pdf':
        this.selectedPdfLists.toggle(material_id);
        const pdfCaptureStatus = this.selectedPdfLists.selected.every((pdf) =>
          this.capturePdfs.includes(pdf)
        );
        // if (pdfCaptureStatus) {
        //   bulkSetCapture[0].status = true;
        // } else {
        //   bulkSetCapture[0].status = false;
        // }
        break;
      case 'image':
        this.selectedImageLists.toggle(material_id);
        const imageCaptureStatus = this.selectedImageLists.selected.every(
          (image) => this.captureImages.includes(image)
        );
        // if (imageCaptureStatus) {
        //   bulkSetCapture[0].status = true;
        // } else {
        //   bulkSetCapture[0].status = false;
        // }
        break;
    }
  }

  setCapture(material_id: string, type: string): void {
    const bulkSetCapture = this.BULK_ACTIONS.filter(
      (action) => action.label == 'Lead Capture'
    );
    switch (type) {
      case 'video':
        if (this.captureVideos.indexOf(material_id) === -1) {
          this.captureVideos.push(material_id);
          this.garbage.capture_videos = this.captureVideos;
          this.userService
            .updateGarbage({ capture_videos: this.captureVideos })
            .subscribe(() => {
              this.userService.updateGarbageImpl(this.garbage);
            });
        } else {
          const pos = this.captureVideos.indexOf(material_id);
          this.captureVideos.splice(pos, 1);
          this.garbage.capture_videos = [];
          this.garbage.capture_videos = this.captureVideos;
          this.userService
            .updateGarbage({ capture_videos: this.captureVideos })
            .subscribe(() => {
              this.userService.updateGarbageImpl(this.garbage);
            });
        }

        const videoCaptureStatus = this.selectedVideoLists.selected.every(
          (video) => this.captureVideos.includes(video)
        );
        // if (videoCaptureStatus) {
        //   bulkSetCapture[0].status = true;
        // } else {
        //   bulkSetCapture[0].status = false;
        // }
        break;
      case 'pdf':
        if (this.capturePdfs.indexOf(material_id) === -1) {
          this.capturePdfs.push(material_id);
          this.garbage.capture_pdfs = this.capturePdfs;
          this.userService
            .updateGarbage({ capture_pdfs: this.capturePdfs })
            .subscribe(() => {
              this.userService.updateGarbageImpl(this.garbage);
            });
        } else {
          const pos = this.capturePdfs.indexOf(material_id);
          this.capturePdfs.splice(pos, 1);
          this.garbage.capture_pdfs = [];
          this.garbage.capture_pdfs = this.capturePdfs;
          this.userService
            .updateGarbage({ capture_pdfs: this.capturePdfs })
            .subscribe(() => {
              this.userService.updateGarbageImpl(this.garbage);
            });
        }

        const pdfCaptureStatus = this.selectedPdfLists.selected.every((pdf) =>
          this.capturePdfs.includes(pdf)
        );
        // if (pdfCaptureStatus) {
        //   bulkSetCapture[0].status = true;
        // } else {
        //   bulkSetCapture[0].status = false;
        // }
        break;
      case 'image':
        if (this.captureImages.indexOf(material_id) === -1) {
          this.captureImages.push(material_id);
          this.garbage.capture_images = this.captureImages;
          this.userService
            .updateGarbage({ capture_images: this.captureImages })
            .subscribe(() => {
              this.userService.updateGarbageImpl(this.garbage);
            });
        } else {
          const pos = this.captureImages.indexOf(material_id);
          this.captureImages.splice(pos, 1);
          this.garbage.capture_images = [];
          this.garbage.capture_images = this.captureImages;
          this.userService
            .updateGarbage({ capture_images: this.captureImages })
            .subscribe(() => {
              this.userService.updateGarbageImpl(this.garbage);
            });
        }

        const imageCaptureStatus = this.selectedImageLists.selected.every(
          (image) => this.captureImages.includes(image)
        );
        // if (imageCaptureStatus) {
        //   bulkSetCapture[0].status = true;
        // } else {
        //   bulkSetCapture[0].status = false;
        // }
        break;
    }
  }

  editVideo(video: any): void {
    this.dialog
      .open(VideoEditComponent, {
        position: { top: '5vh' },
        width: '100vw',
        maxWidth: '500px',
        disableClose: true,
        data: {
          material: {
            _id: video._id,
            title: video.title,
            description: video.description,
            thumbnail: video.thumbnail,
            role: video.role
          },
          type: 'edit'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res['status']) {
          if (video.role === 'admin') {
            this.adminVideos.some((e, index) => {
              if (e._id == video._id) {
                this.adminVideos.splice(index, 1);
                return true;
              }
            });
            this.editedVideos.push(video._id);
            this.userService
              .updateGarbage({
                edited_video: this.editedVideos
              })
              .subscribe(() => {
                this.userService.updateGarbageImpl(this.garbage);
              });
            const newVideo = {
              ...video,
              _id: res['data']['_id'],
              title: res['data']['title'],
              description: res['data']['description'],
              thumbnail: res['data']['thumbnail'],
              default_edited: true
            };
            this.ownVideos.push(newVideo);
          } else {
            video.title = res['data']['title'];
            video.description = res['data']['description'];
            video.thumbnail = res['data']['thumbnail'];
          }
        }
      });
  }

  editPdf(pdf: any): void {
    this.dialog
      .open(PdfEditComponent, {
        position: { top: '5vh' },
        width: '100vw',
        maxWidth: '500px',
        disableClose: true,
        data: {
          material: {
            _id: pdf._id,
            title: pdf.title,
            description: pdf.description,
            preview: pdf.preview,
            role: pdf.role
          },
          type: 'edit'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res['status']) {
          if (pdf.role === 'admin') {
            this.adminPdfs.some((e, index) => {
              if (e._id === pdf._id) {
                this.adminPdfs.splice(index, 1);
                return true;
              }
            });
            this.editedPdfs.push(pdf._id);
            this.userService
              .updateGarbage({
                edited_pdf: this.editedPdfs
              })
              .subscribe(() => {
                this.userService.updateGarbageImpl(this.garbage);
              });
            const newPdf = {
              ...pdf,
              _id: res['data']['_id'],
              title: res['data']['title'],
              description: res['data']['description'],
              thumbnail: res['data']['preview'],
              default_edited: true
            };
            this.ownPdfs.push(newPdf);
          } else {
            pdf.title = res['data']['title'];
            pdf.description = res['data']['description'];
            pdf.preview = res['data']['preview'];
          }
        }
      });
  }

  editImage(image: any): void {
    this.dialog
      .open(ImageEditComponent, {
        position: { top: '5vh' },
        width: '100vw',
        maxWidth: '500px',
        disableClose: true,
        data: {
          material: {
            _id: image._id,
            title: image.title,
            description: image.description,
            preview: image.preview
          },
          type: 'edit'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res['status']) {
          if (image.role === 'admin') {
            this.adminImages.some((e, index) => {
              if (e._id == image._id) {
                this.adminImages.splice(index, 1);
                return true;
              }
            });
            this.editedImages.push(image._id);
            this.userService
              .updateGarbage({
                edited_image: this.editedImages
              })
              .subscribe(() => {
                this.userService.updateGarbageImpl(this.garbage);
              });
            const newImage = {
              ...image,
              _id: res['data']['_id'],
              title: res['data']['title'],
              description: res['data']['description'],
              thumbnail: res['data']['preview'],
              default_edited: true
            };
            this.ownImages.push(newImage);
          } else {
            image.title = res['data']['title'];
            image.description = res['data']['description'];
            image.preview = res['data']['preview'];
          }
        }
      });
  }

  duplicateMaterial(material: any, type: string): void {
    switch (type) {
      case 'video':
        this.dialog
          .open(VideoEditComponent, {
            position: { top: '5vh' },
            width: '100vw',
            maxWidth: '500px',
            disableClose: true,
            data: {
              material: {
                _id: material._id,
                url: material.url,
                title: material.title,
                duration: material.duration,
                description: material.description,
                thumbnail: material.thumbnail,
                role: material.role
              },
              type: 'duplicate'
            }
          })
          .afterClosed()
          .subscribe((res) => {
            if (res) {
              const newVideo = {
                ...material,
                _id: res._id,
                title: res.title,
                description: res.description,
                thumbnail: res.thumbnail,
                role: 'user',
                default_edited: true
              };
              this.ownVideos.push(newVideo);
            }
          });
        break;
      case 'pdf':
        this.dialog
          .open(PdfEditComponent, {
            position: { top: '5vh' },
            width: '100vw',
            maxWidth: '500px',
            disableClose: true,
            data: {
              material: {
                _id: material._id,
                url: material.url,
                title: material.title,
                description: material.description,
                preview: material.preview,
                role: material.role
              },
              type: 'duplicate'
            }
          })
          .afterClosed()
          .subscribe((res) => {
            if (res) {
              const newPdf = {
                ...material,
                _id: res._id,
                title: res.title,
                description: res.description,
                preview: res.preview,
                role: 'user',
                default_edited: true
              };
              this.ownPdfs.push(newPdf);
            }
          });
        break;
      case 'image':
        this.dialog
          .open(ImageEditComponent, {
            position: { top: '5vh' },
            width: '100vw',
            maxWidth: '500px',
            disableClose: true,
            data: {
              material: {
                _id: material._id,
                title: material.title,
                description: material.description,
                preview: material.preview,
                role: material.role,
                url: material.url
              },
              type: 'duplicate'
            }
          })
          .afterClosed()
          .subscribe((res) => {
            if (res) {
              const newImage = {
                ...material,
                _id: res._id,
                title: res.title,
                description: res.description,
                preview: res.preview,
                role: 'user',
                default_edited: true
              };
              this.ownImages.push(newImage);
            }
          });
        break;
    }
  }

  deleteMaterial(material: any, type: string): void {
    switch (type) {
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
        if (material.role == 'admin') {
          videoConfirmDialog.afterClosed().subscribe((res) => {
            if (res) {
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
                    this.userService.updateGarbageImpl(this.garbage);
                    this.adminVideos.some((e, index) => {
                      if (e._id == material._id) {
                        if (this.selectedPdfLists.isSelected(material)) {
                          this.selectedPdfLists.deselect(material);
                        }
                        this.adminVideos.splice(index, 1);
                        return true;
                      }
                    });
                  });
              }
            }
          });
        } else {
          videoConfirmDialog.afterClosed().subscribe((res) => {
            if (res) {
              this.videoDeleteSubscription &&
                this.videoDeleteSubscription.unsubscribe();
              this.videoDeleteSubscription = this.materialService
                .deleteVideo(material._id)
                .subscribe((res) => {
                  this.ownVideos.some((e, index) => {
                    if (e._id == material._id) {
                      if (this.selectedVideoLists.isSelected(material)) {
                        this.selectedVideoLists.deselect(material);
                      }
                      this.ownVideos.splice(index, 1);
                      return true;
                    }
                  });
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
        if (material.role == 'admin') {
          pdfConfirmDialog.afterClosed().subscribe((res) => {
            if (res) {
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
                    this.userService.updateGarbageImpl(this.garbage);
                    this.adminPdfs.some((e, index) => {
                      if (e._id == material._id) {
                        if (this.selectedPdfLists.isSelected(material)) {
                          this.selectedPdfLists.deselect(material);
                        }
                        this.adminPdfs.splice(index, 1);
                        return true;
                      }
                    });
                  });
              }
            }
          });
        } else {
          pdfConfirmDialog.afterClosed().subscribe((res) => {
            if (res) {
              this.pdfDeleteSubscription &&
                this.pdfDeleteSubscription.unsubscribe();
              this.pdfDeleteSubscription = this.materialService
                .deletePdf(material._id)
                .subscribe((res) => {
                  this.ownPdfs.some((e, index) => {
                    if (e._id == material._id) {
                      if (this.selectedPdfLists.isSelected(material)) {
                        this.selectedPdfLists.deselect(material);
                      }
                      this.ownPdfs.splice(index, 1);
                      return true;
                    }
                  });
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
            message: 'Are you sure to delete this Image?',
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel'
          }
        });
        if (material.role == 'admin') {
          imageConfirmDialog.afterClosed().subscribe((res) => {
            if (res) {
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
                    this.userService.updateGarbageImpl(this.garbage);
                    this.adminImages.some((e, index) => {
                      if (e._id == material._id) {
                        if (this.selectedImageLists.isSelected(material)) {
                          this.selectedImageLists.deselect(material);
                        }
                        this.adminImages.splice(index, 1);
                        return true;
                      }
                    });
                  });
              }
            }
          });
        } else {
          imageConfirmDialog.afterClosed().subscribe((res) => {
            if (res) {
              this.imageDeleteSubscription &&
                this.imageDeleteSubscription.unsubscribe();
              this.imageDeleteSubscription = this.materialService
                .deleteImage(material._id)
                .subscribe((res) => {
                  this.ownImages.some((e, index) => {
                    if (e._id == material._id) {
                      if (this.selectedImageLists.isSelected(material)) {
                        this.selectedImageLists.deselect(material);
                      }
                      this.ownImages.splice(index, 1);
                      return true;
                    }
                  });
                });
            }
          });
        }
        break;
    }
  }

  editTemplate(material_id: string): void {
    this.dialog.open(MaterialEditTemplateComponent, {
      position: { top: '10vh' },
      width: '100vw',
      maxWidth: '600px',
      disableClose: true,
      data: {
        id: material_id
      }
    });
  }

  recordSetting(): void {
    if (this.dialog.openDialogs.length > 0) {
      return;
    }
    this.dialog
      .open(RecordSettingDialogComponent, {
        position: { top: '0px' },
        width: '100%',
        height: '100%',
        panelClass: 'trans-modal',
        backdropClass: 'trans'
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.ownVideos.push(res.data);
        }
      });
  }

  doAction(evt: any): void {
    switch (evt.label) {
      case 'Send via email':
        const emailMaterial = [];
        if (this.selectedTab.id == 'video') {
          if (this.mode == 'provided') {
            this.selectedVideoLists.selected.forEach((id) => {
              this.adminVideos.forEach((video) => {
                if (video._id == id) {
                  emailMaterial.push(video);
                }
              });
            });
          } else if (this.mode == 'own') {
            this.selectedVideoLists.selected.forEach((id) => {
              this.ownVideos.forEach((video) => {
                if (video._id == id) {
                  emailMaterial.push(video);
                }
              });
            });
          } else {
            this.selectedVideoLists.selected.forEach((id) => {
              this.teamVideos.forEach((video) => {
                if (video._id == id) {
                  emailMaterial.push(video);
                }
              });
            });
          }
        } else if (this.selectedTab.id == 'pdf') {
          if (this.mode == 'provided') {
            this.selectedPdfLists.selected.forEach((id) => {
              this.adminPdfs.forEach((pdf) => {
                if (pdf._id == id) {
                  emailMaterial.push(pdf);
                }
              });
            });
          } else if (this.mode == 'own') {
            this.selectedPdfLists.selected.forEach((id) => {
              this.ownPdfs.forEach((pdf) => {
                if (pdf._id == id) {
                  emailMaterial.push(pdf);
                }
              });
            });
          } else {
            this.selectedPdfLists.selected.forEach((id) => {
              this.teamPdfs.forEach((pdf) => {
                if (pdf._id == id) {
                  emailMaterial.push(pdf);
                }
              });
            });
          }
        } else {
          if (this.mode == 'provided') {
            this.selectedImageLists.selected.forEach((id) => {
              this.adminImages.forEach((image) => {
                if (image._id == id) {
                  emailMaterial.push(image);
                }
              });
            });
          } else if (this.mode == 'own') {
            this.selectedImageLists.selected.forEach((id) => {
              this.ownImages.forEach((image) => {
                if (image._id == id) {
                  emailMaterial.push(image);
                }
              });
            });
          } else {
            this.selectedImageLists.selected.forEach((id) => {
              this.teamImages.forEach((image) => {
                if (image._id == id) {
                  emailMaterial.push(image);
                }
              });
            });
          }
        }
        this.dialog.open(MaterialSendComponent, {
          position: { top: '5vh' },
          width: '100vw',
          maxWidth: '600px',
          disableClose: false,
          data: {
            material: emailMaterial,
            type: 'email',
            materialType: this.selectedTab.id
          }
        });
        break;
      case 'Send via SMS':
        const textMaterial = [];
        if (this.selectedTab.id == 'video') {
          if (this.mode == 'provided') {
            this.selectedVideoLists.selected.forEach((id) => {
              this.adminVideos.forEach((video) => {
                if (video._id == id) {
                  textMaterial.push(video);
                }
              });
            });
          } else if (this.mode == 'own') {
            this.selectedVideoLists.selected.forEach((id) => {
              this.ownVideos.forEach((video) => {
                if (video._id == id) {
                  textMaterial.push(video);
                }
              });
            });
          } else {
            this.selectedVideoLists.selected.forEach((id) => {
              this.teamVideos.forEach((video) => {
                if (video._id == id) {
                  textMaterial.push(video);
                }
              });
            });
          }
        } else if (this.selectedTab.id == 'pdf') {
          if (this.mode == 'provided') {
            this.selectedPdfLists.selected.forEach((id) => {
              this.adminPdfs.forEach((pdf) => {
                if (pdf._id == id) {
                  textMaterial.push(pdf);
                }
              });
            });
          } else if (this.mode == 'own') {
            this.selectedPdfLists.selected.forEach((id) => {
              this.ownPdfs.forEach((pdf) => {
                if (pdf._id == id) {
                  textMaterial.push(pdf);
                }
              });
            });
          } else {
            this.selectedPdfLists.selected.forEach((id) => {
              this.teamPdfs.forEach((pdf) => {
                if (pdf._id == id) {
                  textMaterial.push(pdf);
                }
              });
            });
          }
        } else {
          if (this.mode == 'provided') {
            this.selectedImageLists.selected.forEach((id) => {
              this.adminImages.forEach((image) => {
                if (image._id == id) {
                  textMaterial.push(image);
                }
              });
            });
          } else if (this.mode == 'own') {
            this.selectedImageLists.selected.forEach((id) => {
              this.ownImages.forEach((image) => {
                if (image._id == id) {
                  textMaterial.push(image);
                }
              });
            });
          } else {
            this.selectedImageLists.selected.forEach((id) => {
              this.teamImages.forEach((image) => {
                if (image._id == id) {
                  textMaterial.push(image);
                }
              });
            });
          }
        }
        this.dialog.open(MaterialSendComponent, {
          position: { top: '5vh' },
          width: '100vw',
          maxWidth: '600px',
          disableClose: false,
          data: {
            material: textMaterial,
            type: 'text',
            materialType: this.selectedTab.id
          }
        });
        break;
      case 'Select all':
        if (this.selectedTab.id == 'video') {
          if (this.mode == 'provided') {
            this.adminVideos.forEach((e) =>
              this.selectedVideoLists.select(e._id)
            );
          } else if (this.mode == 'own') {
            this.ownVideos.forEach((e) =>
              this.selectedVideoLists.select(e._id)
            );
          } else {
            this.teamVideos.forEach((e) =>
              this.selectedVideoLists.select(e._id)
            );
          }
        } else if (this.selectedTab.id == 'pdf') {
          if (this.mode == 'provided') {
            this.adminPdfs.forEach((e) => this.selectedPdfLists.select(e._id));
          } else if (this.mode == 'own') {
            this.ownPdfs.forEach((e) => this.selectedPdfLists.select(e._id));
          } else {
            this.teamPdfs.forEach((e) => this.selectedPdfLists.select(e._id));
          }
        } else {
          if (this.mode == 'provided') {
            this.adminImages.forEach((e) =>
              this.selectedImageLists.select(e._id)
            );
          } else if (this.mode == 'own') {
            this.ownImages.forEach((e) =>
              this.selectedImageLists.select(e._id)
            );
          } else {
            this.teamImages.forEach((e) =>
              this.selectedImageLists.select(e._id)
            );
          }
        }
        break;
      case 'Deselect':
        if (this.selectedTab.id == 'video') {
          this.selectedVideoLists.clear();
        } else if (this.selectedTab.id == 'pdf') {
          this.selectedPdfLists.clear();
        } else {
          this.selectedImageLists.clear();
        }
        break;
      case 'Lead Capture':
        const bulkSetCapture = this.BULK_ACTIONS.filter(
          (action) => action.label == 'Lead Capture'
        );
        // switch (this.selectedTab.id) {
        //   case 'video':
        //     if (bulkSetCapture[0].status) {
        //       this.selectedVideoLists.selected.forEach((video) => {
        //         const pos = this.captureVideos.indexOf(video);
        //         if (pos != -1) {
        //           this.captureVideos.splice(pos, 1);
        //         }
        //       });
        //       this.garbage.capture_videos = [];
        //       this.garbage.capture_videos = this.captureVideos;
        //       this.userService
        //         .updateGarbage({
        //           capture_videos: this.captureVideos
        //         })
        //         .subscribe(() => {
        //           this.userService.updateGarbageImpl(this.garbage);
        //         });
        //       bulkSetCapture[0].status = false;
        //     } else {
        //       this.selectedVideoLists.selected.forEach((video) => {
        //         const pos = this.captureVideos.indexOf(video);
        //         if (pos == -1) {
        //           this.captureVideos.push(video);
        //         }
        //       });
        //       this.garbage.capture_videos = [];
        //       this.garbage.capture_videos = this.captureVideos;
        //       this.userService
        //         .updateGarbage({
        //           capture_videos: this.captureVideos
        //         })
        //         .subscribe(() => {
        //           this.userService.updateGarbageImpl(this.garbage);
        //         });
        //       bulkSetCapture[0].status = true;
        //     }
        //     break;
        //   case 'pdf':
        //     if (bulkSetCapture[0].status) {
        //       this.selectedPdfLists.selected.forEach((pdf) => {
        //         const pos = this.capturePdfs.indexOf(pdf);
        //         if (pos != -1) {
        //           this.capturePdfs.splice(pos, 1);
        //         }
        //       });
        //       this.garbage.capture_pdfs = [];
        //       this.garbage.capture_pdfs = this.capturePdfs;
        //       this.userService
        //         .updateGarbage({
        //           capture_pdfs: this.capturePdfs
        //         })
        //         .subscribe(() => {
        //           this.userService.updateGarbageImpl(this.garbage);
        //         });
        //       bulkSetCapture[0].status = false;
        //     } else {
        //       this.selectedPdfLists.selected.forEach((pdf) => {
        //         const pos = this.capturePdfs.indexOf(pdf);
        //         if (pos == -1) {
        //           this.capturePdfs.push(pdf);
        //         }
        //       });
        //       this.garbage.capture_pdfs = [];
        //       this.garbage.capture_pdfs = this.capturePdfs;
        //       this.userService
        //         .updateGarbage({
        //           capture_pdfs: this.capturePdfs
        //         })
        //         .subscribe(() => {
        //           this.userService.updateGarbageImpl(this.garbage);
        //         });
        //       bulkSetCapture[0].status = true;
        //     }
        //     break;
        //   case 'image':
        //     if (bulkSetCapture[0].status) {
        //       this.selectedImageLists.selected.forEach((image) => {
        //         const pos = this.captureImages.indexOf(image);
        //         if (pos != -1) {
        //           this.captureImages.splice(pos, 1);
        //         }
        //       });
        //       this.garbage.capture_images = [];
        //       this.garbage.capture_images = this.captureImages;
        //       this.userService
        //         .updateGarbage({
        //           capture_images: this.captureImages
        //         })
        //         .subscribe(() => {
        //           this.userService.updateGarbageImpl(this.garbage);
        //         });
        //       bulkSetCapture[0].status = false;
        //     } else {
        //       this.selectedImageLists.selected.forEach((image) => {
        //         const pos = this.captureImages.indexOf(image);
        //         if (pos == -1) {
        //           this.captureImages.push(image);
        //         }
        //       });
        //       this.garbage.capture_images = [];
        //       this.garbage.capture_images = this.captureImages;
        //       this.userService
        //         .updateGarbage({
        //           capture_images: this.captureImages
        //         })
        //         .subscribe(() => {
        //           this.userService.updateGarbageImpl(this.garbage);
        //         });
        //       bulkSetCapture[0].status = true;
        //     }
        //     break;
        // }
        break;
      case 'Delete':
        if (
          this.selectedVideoLists.selected.length +
            this.selectedPdfLists.selected.length +
            this.selectedImageLists.selected.length ==
          0
        ) {
          return;
        } else {
          const confirmDialog = this.dialog.open(ConfirmComponent, {
            position: { top: '100px' },
            data: {
              title: 'Delete Materials',
              message: 'Are you sure to delete these materials?',
              confirmLabel: 'Delete',
              cancelLabel: 'Cancel'
            }
          });
          confirmDialog.afterClosed().subscribe((res) => {
            if (res) {
              if (this.selectedVideoLists.selected.length > 0) {
                this.selectedVideoLists.selected.forEach((e) => {
                  const deleteVideo = this.videos.filter(
                    (video) => video._id == e
                  );
                  if (deleteVideo[0].role == 'admin') {
                    const pos = this.editedVideos.indexOf(deleteVideo[0]._id);

                    if (pos != -1) {
                      return;
                    } else {
                      this.editedVideos.push(deleteVideo[0]._id);
                      this.adminVideos.some((e, index) => {
                        if (e._id == deleteVideo[0]._id) {
                          if (
                            this.selectedVideoLists.isSelected(deleteVideo[0])
                          ) {
                            this.selectedVideoLists.deselect(deleteVideo[0]);
                          }
                          this.adminVideos.splice(index, 1);
                        }
                      });
                    }
                  } else {
                    this.videoDeleteSubscription &&
                      this.videoDeleteSubscription.unsubscribe();
                    this.videoDeleteSubscription = this.materialService
                      .deleteVideo(deleteVideo[0]._id)
                      .subscribe((res) => {
                        this.ownVideos.some((e, index) => {
                          if (e._id == deleteVideo[0]._id) {
                            if (
                              this.selectedVideoLists.isSelected(deleteVideo[0])
                            ) {
                              this.selectedVideoLists.deselect(deleteVideo[0]);
                            }
                            this.ownVideos.splice(index, 1);
                          }
                        });
                      });
                  }
                });
              }
              if (this.selectedPdfLists.selected.length > 0) {
                this.selectedPdfLists.selected.forEach((e) => {
                  const deletePdf = this.pdfs.filter((pdf) => pdf._id == e);
                  if (deletePdf[0].role == 'admin') {
                    const pos = this.editedPdfs.indexOf(deletePdf[0]._id);

                    if (pos != -1) {
                      return;
                    } else {
                      this.editedPdfs.push(deletePdf[0]._id);
                      this.adminPdfs.some((e, index) => {
                        if (e._id == deletePdf[0]._id) {
                          if (this.selectedPdfLists.isSelected(deletePdf[0])) {
                            this.selectedPdfLists.deselect(deletePdf[0]);
                          }
                          this.adminPdfs.splice(index, 1);
                        }
                      });
                    }
                  } else {
                    this.pdfDeleteSubscription &&
                      this.pdfDeleteSubscription.unsubscribe();
                    this.pdfDeleteSubscription = this.materialService
                      .deletePdf(deletePdf[0]._id)
                      .subscribe((res) => {
                        this.ownPdfs.some((e, index) => {
                          if (e._id == deletePdf[0]._id) {
                            if (
                              this.selectedPdfLists.isSelected(deletePdf[0])
                            ) {
                              this.selectedPdfLists.deselect(deletePdf[0]);
                            }
                            this.ownPdfs.splice(index, 1);
                          }
                        });
                      });
                  }
                });
              }
              if (this.selectedImageLists.selected.length > 0) {
                this.selectedImageLists.selected.forEach((e) => {
                  const deleteImage = this.images.filter(
                    (image) => image._id == e
                  );
                  if (deleteImage[0].role == 'admin') {
                    const pos = this.editedImages.indexOf(deleteImage[0]._id);

                    if (pos != -1) {
                      return;
                    } else {
                      this.editedImages.push(deleteImage[0]._id);
                      this.adminImages.some((e, index) => {
                        if (e._id == deleteImage[0]._id) {
                          if (
                            this.selectedImageLists.isSelected(deleteImage[0])
                          ) {
                            this.selectedImageLists.deselect(deleteImage[0]);
                          }
                          this.adminImages.splice(index, 1);
                        }
                      });
                    }
                  } else {
                    this.imageDeleteSubscription &&
                      this.imageDeleteSubscription.unsubscribe();
                    this.imageDeleteSubscription = this.materialService
                      .deleteImage(deleteImage[0]._id)
                      .subscribe((res) => {
                        this.ownImages.some((e, index) => {
                          if (e._id == deleteImage[0]._id) {
                            if (
                              this.selectedImageLists.isSelected(deleteImage[0])
                            ) {
                              this.selectedImageLists.deselect(deleteImage[0]);
                            }
                            this.ownImages.splice(index, 1);
                          }
                        });
                      });
                  }
                });
              }
              this.userService
                .updateGarbage({
                  edited_video: this.editedVideos,
                  edited_pdf: this.editedPdfs,
                  edited_image: this.editedImages
                })
                .subscribe(() => {
                  this.userService.updateGarbageImpl(this.garbage);
                });
            }
          });
        }
        break;
    }
  }

  loadConvertingStatus(): void {
    this.videoConvertingLoadSubscription &&
      this.videoConvertingLoadSubscription.unsubscribe();
    this.videoConvertingLoadSubscription = this.materialService
      .loadConvertingStatus(this.convertingVideos)
      .subscribe((res) => {
        this.ownVideos.forEach((e) => {
          if (e.converted !== 'completed' && e.converted !== 'disabled') {
            const convertingStatus = res[e._id];
            if (!convertingStatus) {
              return;
            }
            if (convertingStatus.status && convertingStatus.progress == 100) {
              e['converted'] = 'completed';
              const pos = this.convertingVideos.indexOf(e._id);
              if (pos !== -1) {
                this.convertingVideos.splice(pos, 1);
              }
            }
            if (convertingStatus.status && convertingStatus.progress < 100) {
              e['progress'] = convertingStatus.progress;
            }
            if (!convertingStatus.status) {
              e['convertingStatus'] = 'error';
              const pos = this.convertingVideos.indexOf(e._id);
              if (pos !== -1) {
                this.convertingVideos.splice(pos, 1);
              }
            }
          }
        });

        this.adminVideos.forEach((e) => {
          if (e.converted !== 'completed' && e.converted !== 'disabled') {
            const convertingStatus = res[e._id];
            if (!convertingStatus) {
              return;
            }
            if (convertingStatus.status && convertingStatus.progress == 100) {
              e['converted'] = 'completed';
              const pos = this.convertingVideos.indexOf(e._id);
              if (pos !== -1) {
                this.convertingVideos.splice(pos, 1);
              }
            }
            if (convertingStatus.status && convertingStatus.progress < 100) {
              e['progress'] = convertingStatus.progress;
            }
            if (!convertingStatus.status) {
              e['convertingStatus'] = 'error';
              const pos = this.convertingVideos.indexOf(e._id);
              if (pos !== -1) {
                this.convertingVideos.splice(pos, 1);
              }
            }
          }
        });

        this.teamVideos.forEach((e) => {
          if (e.converted !== 'completed' && e.converted !== 'disabled') {
            const convertingStatus = res[e._id];
            if (!convertingStatus) {
              return;
            }
            if (convertingStatus.status && convertingStatus.progress == 100) {
              e['converted'] = 'completed';
              const pos = this.convertingVideos.indexOf(e._id);
              if (pos !== -1) {
                this.convertingVideos.splice(pos, 1);
              }
            }
            if (convertingStatus.status && convertingStatus.progress < 100) {
              e['progress'] = convertingStatus.progress;
            }
            if (!convertingStatus.status) {
              e['convertingStatus'] = 'error';
              const pos = this.convertingVideos.indexOf(e._id);
              if (pos !== -1) {
                this.convertingVideos.splice(pos, 1);
              }
            }
          }
        });
      });
  }

  showAnalytics(material): void {}

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
}
