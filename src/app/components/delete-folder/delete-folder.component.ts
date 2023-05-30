import { Component, Inject, OnInit } from '@angular/core';
import { Material } from '../../models/material.model';
import { Subscription } from 'rxjs';
import { StoreService } from '../../services/store.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialService } from '../../services/material.service';
import * as _ from 'lodash';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-delete-folder',
  templateUrl: './delete-folder.component.html',
  styleUrls: ['./delete-folder.component.scss']
})
export class DeleteFolderComponent implements OnInit {
  currentOption = 'remove-all';
  selectedFolder: Material = new Material();
  sourceFolders: Material[] = [];
  rootFolder: Material = new Material().deserialize({ _id: 'root' });
  folders: Material[] = [];
  folderLoadSubscription: Subscription;
  currentFolder;
  submitted = false;

  constructor(
    private storeService: StoreService,
    private userService: UserService,
    private materialService: MaterialService,
    private dialogRef: MatDialogRef<DeleteFolderComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data && this.data.material) {
      this.currentFolder = this.data.material;
    }
    if (this.data && this.data.folders) {
      this.sourceFolders = this.data.folders;
    }
  }

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
        this.folders = _.uniqBy(this.folders, '_id');
        if (this.currentFolder) {
          const index = this.folders.findIndex(
            (item) => item._id === this.currentFolder._id
          );
          if (index >= 0) {
            this.folders.splice(index, 1);
          }
        }
        if (this.sourceFolders && this.sourceFolders.length) {
          this.folders = _.xorBy(this.folders, this.sourceFolders, '_id');
        }
      }
    );
  }

  selectOption(type): void {
    this.currentOption = type;
  }

  isSelectedOption(type): any {
    return this.currentOption === type;
  }

  delete(): void {
    this.submitted = true;
    if (this.currentOption === 'move-other') {
      if (!this.selectedFolder._id) {
        return;
      }
    }
    let data;
    if (this.currentFolder && this.currentFolder._id) {
      data = {
        _id: this.currentFolder._id,
        mode: this.currentOption,
        target:
          this.selectedFolder && this.selectedFolder._id
            ? this.selectedFolder._id
            : null
      };
      if (data.target === 'root') {
        data.target = '';
      }
      this.materialService
        .removeFolder(data) // answer
        .subscribe((res) => {
          if (res['status']) {
            if (this.currentOption === 'move-other' && data.target) {
              const _targetVideos = this.selectedFolder.videos;
              const _targetImages = this.selectedFolder.images;
              const _targetPdfs = this.selectedFolder.pdfs;
              const _newVideos = _.union(
                _targetVideos,
                this.currentFolder.videos
              );
              const _newImages = _.union(
                _targetImages,
                this.currentFolder.images
              );
              const _newpdfs = _.union(_targetPdfs, this.currentFolder.pdfs);
              this.materialService.update$(this.selectedFolder._id, {
                videos: _newVideos,
                images: _newImages,
                pdfs: _newpdfs
              });
            }
            if (this.currentOption === 'remove-all') {
              this.materialService.delete$([
                ...this.currentFolder.videos,
                ...this.currentFolder.images,
                ...this.currentFolder.pdfs
              ]);
            }
            this.materialService.delete$([this.currentFolder._id]);
            this.materialService.removeFolder$(this.currentFolder._id);
            this.dialogRef.close();
          }
        });
    }
    if (this.sourceFolders && this.sourceFolders.length) {
      data = {
        ids: this.sourceFolders.map((e) => e._id),
        mode: this.currentOption,
        target:
          this.selectedFolder && this.selectedFolder._id
            ? this.selectedFolder._id
            : null
      };
      if (data.target === 'root') {
        data.target = '';
      }
      this.materialService
        .removeFolders(data) // answer
        .subscribe((res) => {
          if (res['status']) {
            if (this.currentOption === 'move-other' && data.target) {
              const _targetVideos = this.selectedFolder.videos;
              const _targetImages = this.selectedFolder.images;
              const _targetPdfs = this.selectedFolder.pdfs;
              let _newVideos = [..._targetVideos];
              let _newImages = [..._targetImages];
              let _newpdfs = [..._targetPdfs];
              this.sourceFolders.forEach((e) => {
                _newVideos = _.union(_newVideos, e.videos);
                _newImages = _.union(_newImages, e.images);
                _newpdfs = _.union(_newpdfs, e.pdfs);
              });
              this.materialService.update$(this.selectedFolder._id, {
                videos: _newVideos,
                images: _newImages,
                pdfs: _newpdfs
              });
            }
            if (this.currentOption === 'remove-all') {
              let _removeVideos = [];
              let _removeImages = [];
              let _removePdfs = [];
              this.sourceFolders.forEach((e) => {
                _removeVideos = _.union(_removeVideos, e.videos);
                _removeImages = _.union(_removeImages, e.images);
                _removePdfs = _.union(_removePdfs, e.pdfs);
              });
              this.materialService.delete$([
                ..._removeVideos,
                ..._removeImages,
                ..._removePdfs
              ]);
            }
            this.materialService.delete$(data.ids);
            this.materialService.removeFolders$(data.ids);
            this.materialService.loadMaterial(true);
            this.dialogRef.close();
          }
        });
    }
  }
}
