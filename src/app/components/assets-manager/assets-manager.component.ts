import { Component, OnInit } from '@angular/core';
import { AssetsService } from 'src/app/services/assets.service';
import { Subscription } from 'rxjs';
import { HelperService } from 'src/app/services/helper.service';
import { environment } from 'src/environments/environment';
import { ASSETS } from 'src/app/constants/api.constant';
import { CropperOptions } from 'ngx-cropperjs-wrapper';
import { MatDialogRef } from '@angular/material/dialog';
import { FileItem, FileUploader, FileUploaderOptions } from 'ng2-file-upload';

@Component({
  selector: 'app-assets-manager',
  templateUrl: './assets-manager.component.html',
  styleUrls: ['./assets-manager.component.scss']
})
export class AssetsManagerComponent implements OnInit {
  loading = false;
  loadSubscription: Subscription;
  removeSubscription: Subscription;
  commonAssets = [];
  myAssets = [];
  selectedMyAssets = [];
  selectedCommonAssets = [];
  loadedAssets = 0;
  page = 1;
  total = 0;
  editorFlag = false;
  selectedAsset;
  assetToEdit;
  uploader = new FileUploaderCustom({
    url: environment.api + ASSETS.UPLOAD,
    authToken: localStorage.getItem('token'),
    itemAlias: 'assets'
  });
  uploading = false;
  uploadProgress;
  replacing = false;
  removing = false;
  reading = false;

  public cropper: Cropper;
  public croppedImage;
  public config = {
    minContainerWidth: 300,
    minContainerHeight: 300,
    minCanvasWidth: 50,
    minCanvasHeight: 50,
    minCropBoxWidth: 50,
    minCropBoxHeight: 50,
    checkCrossOrigin: false,
    dragMode: 'move',
    viewMode: 0
  } as CropperOptions;

  constructor(
    private dialogRef: MatDialogRef<AssetsManagerComponent>,
    private assetsService: AssetsService,
    private helperSerivce: HelperService
  ) {
    this.initUploader();
    this.load();
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.removeSubscription && this.removeSubscription.unsubscribe();
  }

  load(): void {
    this.loading = true;
    this.loadSubscription = this.assetsService.loadAssets(this.page).subscribe(
      (res) => {
        this.loading = false;
        const assets = res['data'];
        this.loadedAssets += assets.length;
        assets.forEach((e) => {
          if (e.user) {
            this.myAssets.push(e);
          } else {
            this.commonAssets.push(e);
          }
        });
        this.total = res['total'];
      },
      () => {
        this.loading = false;
      }
    );
  }
  loadMore(): void {
    this.page++;
    this.load();
  }
  removeAssets(): void {
    this.removing = true;
    this.removeSubscription = this.assetsService
      .deleteAssets(this.selectedMyAssets)
      .subscribe(
        () => {
          this.removing = false;
          this.total -= this.selectedMyAssets.length;
          for (let i = this.myAssets.length - 1; i >= 0; i--) {
            const e = this.myAssets[i];
            const pos = this.selectedMyAssets.indexOf(e._id);
            if (pos !== -1) {
              this.myAssets.splice(i, 1);
            }
          }
          this.selectedMyAssets = [];
        },
        () => {
          this.removing = false;
        }
      );
  }
  close(): void {
    this.dialogRef.close();
  }
  select(): void {
    const selectedItems = [];
    this.myAssets.forEach((e) => {
      if (this.selectedMyAssets.indexOf(e._id) !== -1) {
        selectedItems.push(e);
      }
    });
    this.commonAssets.forEach((e) => {
      if (this.selectedCommonAssets.indexOf(e._id) !== -1) {
        selectedItems.push(e);
      }
    });
    if (selectedItems.length) {
      this.dialogRef.close({ data: selectedItems });
    } else {
      this.dialogRef.close();
    }
  }

  openEditor(asset): void {
    this.selectedAsset = asset;
    this.reading = true;
    this.editorFlag = true;
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      this.reading = false;
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        const blob = this.helperSerivce.b64toBlob(base64);
        this.assetToEdit = blob;
      };
      reader.readAsDataURL(xhr.response);
    };
    xhr.open('GET', asset.url);
    xhr.responseType = 'blob';
    xhr.send();
  }

  toggleAsset(asset): void {
    const pos = this.selectedMyAssets.indexOf(asset._id);
    if (pos !== -1) {
      this.selectedMyAssets.splice(pos, 1);
    } else {
      this.selectedMyAssets.push(asset._id);
    }
  }

  toggleCommonAssets(asset): void {
    const pos = this.selectedCommonAssets.indexOf(asset._id);
    if (pos !== -1) {
      this.selectedCommonAssets.splice(pos, 1);
    } else {
      this.selectedCommonAssets.push(asset._id);
    }
  }

  browseAssets(): void {
    this.helperSerivce
      .promptForFiles('', true)
      .then((fileList) => {
        const files = [];
        for (let i = 0; i < fileList.length; i++) {
          files.push(fileList[i]);
        }
        this.uploader = new FileUploaderCustom({
          url: environment.api + ASSETS.UPLOAD,
          authToken: localStorage.getItem('token'),
          itemAlias: 'assets'
        });
        this.initUploader();
        this.uploader.clearQueue();
        this.uploader.addToQueue(files);
        this.uploader.uploadAllFiles();
        this.uploading = true;
      })
      .catch((err) => {
        console.log('Error', err);
      });
  }

  initUploader(): void {
    this.uploader.onSuccessItem = (items, response, status, headers) => {
      const res = JSON.parse(response);
      if (res.status == true) {
        const items = res['data'];
        this.myAssets = [...items, ...this.myAssets];
      }
      this.uploading = false;
    };
    this.uploader.onErrorItem = () => {
      this.uploading = false;
    };
  }

  closeEditor(): void {
    this.editorFlag = false;
  }
  onFail(error): void {
    console.log('Crop Error', error);
  }
  onCropperInit(cropper: Cropper): void {
    this.cropper = cropper;
  }
  onCrop(): void {}
  rotateLeft(): void {
    this.cropper.rotate(-90);
  }
  rotateRight(): void {
    this.cropper.rotate(90);
  }
  duplicate(): void {
    const canvas = this.cropper.getCroppedCanvas();
    const src = canvas.toDataURL();
    canvas.toBlob((blob) => {
      this.croppedImage = src;
      const asset = {
        name: this.selectedAsset.name,
        url: src
      };
      this.editorFlag = false;
      this.uploading = true;
      this.assetsService.createAsset(asset).subscribe((res) => {
        this.uploading = false;
        if (res['status']) {
          this.myAssets.unshift(res['data']);
        }
      });
      // this.editorFlag = false;
    });
  }
  replace(): void {
    const canvas = this.cropper.getCroppedCanvas();
    const src = canvas.toDataURL();
    canvas.toBlob((blob) => {
      this.croppedImage = src;
      const asset = {
        _id: this.selectedAsset._id,
        url: src
      };
      this.replacing = true;
      this.assetsService.replaceAsset(asset).subscribe((res) => {
        this.replacing = false;
        if (res['status']) {
          this.editorFlag = false;
          this.myAssets.some((e) => {
            if (e._id == this.selectedAsset._id) {
              e.url = res['data']['url'];
              return true;
            }
          });
        }
      });
    });
  }
}

export class FileUploaderCustom extends FileUploader {
  constructor(options: FileUploaderOptions) {
    super(options);
  }

  uploadAllFiles(): void {
    const xhr = new XMLHttpRequest();
    const sendable = new FormData();
    const fakeitem: FileItem = null;
    this.onBuildItemForm(fakeitem, sendable);

    for (const item of this.queue) {
      item.isReady = true;
      item.isUploading = true;
      item.isUploaded = false;
      item.isSuccess = false;
      item.isCancel = false;
      item.isError = false;
      item.progress = 0;

      if (typeof item._file.size !== 'number') {
        throw new TypeError('The file specified is no longer valid');
      }
      sendable.append(this.options.itemAlias, item._file, item.file.name);
    }

    if (this.options.additionalParameter !== undefined) {
      Object.keys(this.options.additionalParameter).forEach((key) => {
        sendable.append(key, this.options.additionalParameter[key]);
      });
    }

    xhr.onload = () => {
      const gist =
        (xhr.status >= 200 && xhr.status < 300) || xhr.status === 304
          ? 'Success'
          : 'Error';
      const method = 'on' + gist + 'Item';
      this[method](fakeitem, xhr.response, xhr.status, null);
    };
    xhr.onerror = () => {
      this.onErrorItem(fakeitem, null, xhr.status, null);
    };

    xhr.onabort = () => {
      this.onErrorItem(fakeitem, null, xhr.status, null);
    };

    xhr.upload.onprogress = (event) => {
      const progress = Math.round(
        event.lengthComputable ? (event.loaded * 100) / event.total : 0
      );
      this.progress = progress;
    };

    xhr.open('POST', this.options.url, true);
    xhr.withCredentials = false;
    if (this.options.headers) {
      for (let _i = 0, _a = this.options.headers; _i < _a.length; _i++) {
        const header = _a[_i];
        xhr.setRequestHeader(header.name, header.value);
      }
    }
    if (this.authToken) {
      xhr.setRequestHeader(this.authTokenHeader, this.authToken);
    }
    xhr.send(sendable);
  }

  clearQueue = () => {
    while (this.queue.length) {
      this.queue[0].remove();
    }
    this.progress = 0;
  };
}
