import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { Material } from 'src/app/models/material.model';
import { MaterialService } from 'src/app/services/material.service';
import { StoreService } from 'src/app/services/store.service';
import { UserService } from 'src/app/services/user.service';
import * as _ from 'lodash';
import { FolderComponent } from '../folder/folder.component';
@Component({
  selector: 'app-move-folder',
  templateUrl: './move-folder.component.html',
  styleUrls: ['./move-folder.component.scss']
})
export class MoveFolderComponent implements OnInit, OnDestroy {
  folders: Material[] = [];
  isRoot: boolean = true;
  rootFolder: Material = new Material().deserialize({ _id: 'root' });
  newFolder: Material = new Material().deserialize({ _id: 'new' });
  materials: Material[] = [];
  userId = '';
  selectedFolder: Material = new Material();
  currentFolder: Material = new Material();
  moving = false;

  profileSubscription: Subscription;
  folderLoadSubscription: Subscription;
  moveSubscription: Subscription;
  constructor(
    private dialog: MatDialog,
    private storeService: StoreService,
    private materialService: MaterialService,
    private userService: UserService,
    private dialogRef: MatDialogRef<MoveFolderComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    const user_id = this.userService.profile.getValue()._id;
    this.folderLoadSubscription = this.storeService.materials$.subscribe(
      (materials) => {
        this.folders = materials.filter((e) => {
          return (
            e.material_type === 'folder' &&
            e.user &&
            (e.user === user_id || e.user._id === user_id)
          );
        });
      }
    );
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        this.userId = profile._id;
      }
    );
    if (this.data && this.data.materials) {
      this.materials = this.data.materials;
    }
    if (this.data && this.data.currentFolder) {
      this.isRoot = false;
      this.currentFolder = this.data.currentFolder;
      return;
    }
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.folderLoadSubscription && this.folderLoadSubscription.unsubscribe();
  }

  folderAction(evt: any): void {
    if (evt._id == 'new') {
      this.dialog
        .open(FolderComponent, {
          width: '96vw',
          maxWidth: '400px'
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            this.selectedFolder = res;
          } else {
            this.selectedFolder = new Material();
          }
        });
    }
  }

  move(): void {
    const videos = [];
    const images = [];
    const pdfs = [];
    this.materials.forEach((e) => {
      switch (e.material_type) {
        case 'video':
          videos.push(e._id);
          break;
        case 'pdf':
          pdfs.push(e._id);
          break;
        case 'image':
          images.push(e._id);
          break;
      }
    });

    let source = '';
    if (this.currentFolder && this.currentFolder._id) {
      source = this.currentFolder._id;
    }

    if (this.selectedFolder._id !== 'root') {
      this.moving = true;
      this.moveSubscription = this.materialService
        .moveFiles({ videos, images, pdfs }, this.selectedFolder._id, source)
        .subscribe((status) => {
          this.moving = false;
          if (status) {
            this.closeDlg(
              source,
              this.selectedFolder._id,
              videos,
              images,
              pdfs
            );
          }
        });
    } else {
      this.moving = true;
      this.moveSubscription = this.materialService
        .moveFiles({ videos, images, pdfs }, '', source)
        .subscribe((status) => {
          this.moving = false;
          if (status) {
            this.closeDlg(source, '', videos, images, pdfs);
          }
        });
    }
  }

  closeDlg(
    source: string,
    target: string,
    videos: string[],
    images: string[],
    pdfs: string[]
  ): void {
    if (source) {
      const _currentVideos = this.currentFolder.videos;
      const _currentImages = this.currentFolder.images;
      const _currentPdfs = this.currentFolder.pdfs;
      _.pullAll(_currentVideos, videos);
      _.pullAll(_currentImages, images);
      _.pullAll(_currentPdfs, pdfs);
      this.materialService.update$(source, {
        videos: _currentVideos,
        pdfs: _currentPdfs,
        images: _currentImages
      });
    }
    if (target) {
      const _targetVideos = this.selectedFolder.videos;
      const _targetImages = this.selectedFolder.images;
      const _targetPdfs = this.selectedFolder.pdfs;
      const _newVideos = _.union(_targetVideos, videos);
      const _newImages = _.union(_targetImages, images);
      const _newpdfs = _.union(_targetPdfs, pdfs);
      this.materialService.update$(this.selectedFolder._id, {
        videos: _newVideos,
        images: _newImages,
        pdfs: _newpdfs
      });
      this.materialService.bulkUpdate$([...videos, ...images, ...pdfs], {
        folder: this.selectedFolder._id
      });
    } else {
      this.materialService.bulkUpdate$([...videos, ...images, ...pdfs], {
        folder: ''
      });
    }
    this.dialogRef.close();
  }
}
