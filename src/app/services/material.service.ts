import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { catchError, filter, finalize, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { VIDEO, PDF, IMAGE, MATERIAL } from '../constants/api.constant';
import { Image } from '../models/image.model';
import { Pdf } from '../models/pdf.model';
import { Video } from '../models/video.model';
import { ErrorService } from './error.service';
import { HttpService } from './http.service';
import { StoreService } from './store.service';
import { STATUS } from '../constants/variable.constants';
import { ACTIVITY } from '../constants/api.constant';
import { Material } from '../models/material.model';
import { Activity } from '../models/activity.model';

@Injectable({
  providedIn: 'root'
})
export class MaterialService extends HttpService {
  constructor(
    errorService: ErrorService,
    private httpClient: HttpClient,
    private storeService: StoreService
  ) {
    super(errorService);
  }

  loadVideoStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loadingVideo$ = this.loadVideoStatus.asObservable();
  loadPdfStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loadingPdf$ = this.loadPdfStatus.asObservable();
  loadImageStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loadingImage$ = this.loadImageStatus.asObservable();
  loading: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loading$ = this.loading.asObservable();

  pageOption: BehaviorSubject<any> = new BehaviorSubject({
    page: 1,
    pageSize: 25,
    sort: 'owner',
    selectedFolder: null,
    searchStr: '',
    matType: '',
    teamOptions: [],
    userOptions: [],
    folderOptions: [],
    isAdmin: false
  });
  pageOption$ = this.pageOption.asObservable();
  loadLibrarySubscription: Subscription;

  /**
   * LOAD MATERIALS
   * @param force Flag to load force
   */

  loadVideosImpl(): Observable<Video[]> {
    return this.httpClient.get(this.server + VIDEO.LOAD).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('LOAD VIDEOS', []))
    );
  }
  loadPdfsImpl(): Observable<Pdf[]> {
    return this.httpClient.get(this.server + PDF.LOAD).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('LOAD PDFS', []))
    );
  }
  loadImagesImpl(): Observable<Image[]> {
    return this.httpClient.get(this.server + IMAGE.LOAD).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('LOAD IMAGES', []))
    );
  }
  loadVideos(force = false): void {
    if (!force) {
      const loadVidoeStatus = this.loadVideoStatus.getValue();
      if (loadVidoeStatus != STATUS.NONE && loadVidoeStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.loadVideoStatus.next(STATUS.REQUEST);
    this.loadVideosImpl().subscribe((videos) => {
      videos
        ? this.loadVideoStatus.next(STATUS.SUCCESS)
        : this.loadVideoStatus.next(STATUS.FAILURE);
      this.storeService.videos.next(videos);
    });
  }
  loadPdfs(force = false): void {
    if (!force) {
      const loadPdfStatus = this.loadPdfStatus.getValue();
      if (loadPdfStatus != STATUS.NONE && loadPdfStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.loadPdfStatus.next(STATUS.REQUEST);
    this.loadPdfsImpl().subscribe((pdfs) => {
      pdfs
        ? this.loadPdfStatus.next(STATUS.SUCCESS)
        : this.loadPdfStatus.next(STATUS.FAILURE);
      this.storeService.pdfs.next(pdfs);
    });
  }
  loadImages(force = false): void {
    if (!force) {
      const loadImageStatus = this.loadImageStatus.getValue();
      if (loadImageStatus != STATUS.NONE && loadImageStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.loadImageStatus.next(STATUS.REQUEST);
    this.loadImagesImpl().subscribe((images) => {
      images
        ? this.loadImageStatus.next(STATUS.SUCCESS)
        : this.loadImageStatus.next(STATUS.FAILURE);
      this.storeService.images.next(images);
    });
  }

  createVideo(video: any): any {
    return this.httpClient.post(this.server + VIDEO.CREATE, video).pipe(
      map((res) => res),
      catchError(this.handleError('CREATE VIDEO', null))
    );
  }
  createActivity(data: any): any {
    return this.httpClient.post(this.server + ACTIVITY.CREATE, data).pipe(
      map((res) => res),
      catchError(this.handleError('CREATE ACTIVITY', null))
    );
  }

  uploadVideoDetail(id: string, video: any): any {
    return this.httpClient
      .put(this.server + VIDEO.UPDATE_VIDEO_DETAIL + id, video)
      .pipe(
        map((res) => res),
        catchError(this.handleError('UPDATE VIDEO DETAIL', null))
      );
  }

  updateVideo(id: string, video: any): any {
    return this.httpClient.put(this.server + VIDEO.UPDATE + id, video).pipe(
      map((res) => res),
      catchError(this.handleError('UPDATE VIDEO', null))
    );
  }

  updateConvertStatus(id: string, status: any): any {
    return this.httpClient
      .put(this.server + VIDEO.UPDATE_CONVERTING + id, status)
      .pipe(
        map((res) => res),
        catchError(this.handleError('CONVERT STATUS', null))
      );
  }

  updateAdminVideo(id: string, video: any): any {
    return this.httpClient
      .post(this.server + VIDEO.UPDATE_ADMIN, {
        id,
        video
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('UPDATE ADMIN VIDEO', null))
      );
  }

  initRecord(): any {
    return this.httpClient.post(this.server + VIDEO.INIT_RECORD, {}).pipe(
      map((res) => res),
      catchError(this.handleError('INIT RECORD', null))
    );
  }

  uploadVideoChunk(id: string, data: any, token: string): any {
    const method = 'POST';
    const myHeaders = new Headers();
    myHeaders.append('Authorization', token);
    return fetch(this.server + VIDEO.UPLOAD_CHUNK + id, {
      method,
      headers: myHeaders,
      body: data
    }).then(
      (res) => res.json(),
      catchError(this.handleError('UPLOAD VIDEO', null))
    );
  }

  uploadVideoChunk2(id: string, data: any): Observable<any> {
    const reqHeader = new HttpHeaders({
      'No-Content': 'True'
    });
    return this.httpClient.post(this.server + VIDEO.UPLOAD_CHUNK2 + id, data, {
      headers: reqHeader,
      reportProgress: true,
      observe: 'events'
    });
  }

  uploadSingle(id: string, data: any): Observable<any> {
    const reqHeader = new HttpHeaders({
      'No-Content': 'True'
    });
    return this.httpClient.post(this.server + VIDEO.UPLOAD_SINGLE + id, data, {
      headers: reqHeader,
      reportProgress: true,
      observe: 'events'
    });
  }

  mergeChunks(data): Observable<any> {
    return this.httpClient.post(this.server + VIDEO.MERGE_FILES, data).pipe(
      map((res) => res),
      catchError(this.handleError('Merge video chunks'))
    );
  }

  completeRecord(data: any): any {
    return this.httpClient.post(this.server + VIDEO.COMPLETE_RECORD, data).pipe(
      map((res) => res),
      catchError(this.handleError('COMPLETE RECORD', null))
    );
  }

  deleteVideo(id: string): any {
    return this.httpClient.delete(this.server + VIDEO.DELETE + id).pipe(
      map((res) => res),
      catchError(this.handleError('DELETE VIDEO', null))
    );
  }

  createPdf(pdf: any): any {
    return this.httpClient.post(this.server + PDF.CREATE, pdf).pipe(
      map((res) => res),
      catchError(this.handleError('CREATE PDF', null))
    );
  }

  updatePdf(id: string, pdf: any): any {
    return this.httpClient.put(this.server + PDF.UPDATE + id, pdf).pipe(
      map((res) => res),
      catchError(this.handleError('UPDATE PDF', null))
    );
  }

  updateAdminPdf(id: string, pdf: any): any {
    return this.httpClient
      .post(this.server + PDF.UPDATE_ADMIN, {
        id,
        pdf
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('UPDATE ADMIN PDF', null))
      );
  }

  deletePdf(id: string): any {
    return this.httpClient.delete(this.server + PDF.DELETE + id).pipe(
      map((res) => res),
      catchError(this.handleError('DELETE PDF', null))
    );
  }

  createImage(image: any): any {
    return this.httpClient.post(this.server + IMAGE.CREATE, image).pipe(
      map((res) => res),
      catchError(this.handleError('CREATE IMAGE', null))
    );
  }

  updateImage(id: string, image: any): any {
    return this.httpClient.put(this.server + IMAGE.UPDATE + id, image).pipe(
      map((res) => res),
      catchError(this.handleError('UPDATE IMAGE', null))
    );
  }

  updateAdminImage(id: string, image: any): any {
    return this.httpClient
      .post(this.server + IMAGE.UPDATE_ADMIN, {
        id,
        image
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('UPDATE ADMIN IMAGE', null))
      );
  }

  deleteImage(id: string): any {
    return this.httpClient.delete(this.server + IMAGE.DELETE + id).pipe(
      map((res) => res),
      catchError(this.handleError('DELETE IMAGE', null))
    );
  }

  sendMaterials(data: any): Observable<any> {
    return this.httpClient.post(this.server + MATERIAL.EMAIL, data).pipe(
      map((res) => res),
      catchError(this.handleError('SEND MATERIALS', false, true))
    );
  }

  sendText(data: any, materialType: string): Observable<boolean> {
    let api = 'video/bulk-text';
    switch (materialType) {
      case 'video':
        api = MATERIAL.VIDEO_TEXT;
        break;
      case 'pdf':
        api = MATERIAL.PDF_TEXT;
        break;
      case 'image':
        api = MATERIAL.IMAGE_TEXT;
        break;
    }
    return this.httpClient.post(this.server + api, data).pipe(
      map((res) => res['status']),
      catchError(this.handleError('SEND TEXT MATERIALS', false))
    );
  }

  sendMessage(data: any): Observable<boolean> {
    return this.httpClient.post(this.server + MATERIAL.BULK_TEXT, data).pipe(
      map((res) => res['status']),
      catchError(this.handleError('SEND MESSAGE', false))
    );
  }

  loadMaterial(force = false): void {
    if (!force) {
      const loading = this.loading.getValue();
      if (loading != STATUS.NONE && loading != STATUS.FAILURE) {
        return;
      }
    }
    this.loading.next(STATUS.REQUEST);
    this.loadOwnImp().subscribe((materials) => {
      materials
        ? this.loading.next(STATUS.SUCCESS)
        : this.loading.next(STATUS.FAILURE);
      this.storeService.materials.next(materials);
    });
  }
  loadMaterialImp(): Observable<Material[]> {
    return this.httpClient.get(this.server + MATERIAL.LOAD).pipe(
      map((res) =>
        (res['data'] || []).map((e) => new Material().deserialize(e))
      ),
      catchError(this.handleError('LOAD MATERIALS', []))
    );
  }
  loadOwn(force = false): void {
    if (!force) {
      const loading = this.loading.getValue();
      if (loading != STATUS.NONE && loading != STATUS.FAILURE) {
        return;
      }
    }
    this.loading.next(STATUS.REQUEST);
    this.loadOwnImp().subscribe((materials) => {
      materials
        ? this.loading.next(STATUS.SUCCESS)
        : this.loading.next(STATUS.FAILURE);
      this.storeService.materials.next(materials);
    });
  }
  loadOwnImp(): Observable<Material[]> {
    return this.httpClient.get(this.server + MATERIAL.LOAD_OWN).pipe(
      map((res) =>
        (res['data'] || []).map((e) => new Material().deserialize(e))
      ),
      catchError(this.handleError('LOAD MY MATERIALS', []))
    );
  }
  loadLibrary(force = false): void {
    if (!force) {
      const loading = this.loading.getValue();
      if (loading != STATUS.NONE && loading != STATUS.FAILURE) {
        return;
      }
    }
    this.loading.next(STATUS.REQUEST);
    this.loadLibrarySubscription && this.loadLibrarySubscription.unsubscribe();
    this.loadLibrarySubscription = this.loadLibraryImp().subscribe(
      (libraries) => {
        libraries
          ? this.loading.next(STATUS.SUCCESS)
          : this.loading.next(STATUS.FAILURE);
        this.storeService.libraries.next(libraries);
      }
    );
  }
  loadLibraryImp(): Observable<Material[]> {
    return this.httpClient.post(this.server + MATERIAL.LOAD_LIBRARY, {}).pipe(
      map((res) =>
        (res['data'] || []).map((e) => new Material().deserialize(e))
      ),
      catchError(this.handleError('LOAD LIBRARY', []))
    );
  }
  bulkRemove(data): Observable<any> {
    return this.httpClient.post(this.server + MATERIAL.BULK_REMOVE, data).pipe(
      map((res) => res),
      catchError(this.handleError('REMOVE MATERIALS', false))
    );
  }

  getVimeoMeta(id: string): any {
    return this.httpClient
      .get(`https://api.vimeo.com/videos/${id}`, {
        headers: new HttpHeaders({
          Authorization: `basic ${environment.API_KEY.Vimeo}`
        })
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('GET VIMEO', null))
      );
  }

  getYoutubeMeta(id: string): any {
    return this.httpClient
      .get(
        `https://www.googleapis.com/youtube/v3/videos?id=${id}&key=${environment.API_KEY.Youtube}&part=snippet,contentDetails`
      )
      .pipe(
        map((res) => res),
        catchError(this.handleError('GET YOUTUBE', null))
      );
  }

  checkVideosCount = this.storeService.videos$.pipe(
    filter((val) => val.length > 100)
  );

  loadConvertingStatus(videos: any): any {
    return this.httpClient
      .post(this.server + VIDEO.LOAD_CONVERTING_STATUS, {
        videos
      })
      .pipe(
        map((res) => res),
        catchError(this.handleError('LOAD CONVERT STATUS', null))
      );
  }

  getS3ConvertingStatus(video_id: any): any {
    return this.httpClient
      .get(
        'https://f8nhu9b8o4.execute-api.us-east-2.amazonaws.com/default/convert-status?video_id=' +
          video_id
      )
      .pipe(
        map((res) => res),
        catchError(this.handleError('GET CONVERT STATUS', null))
      );
  }

  getAnalytics(id: string, type: string): Observable<Video[]> {
    if (type == 'video') {
      return this.httpClient.get(this.server + VIDEO.ANALYTICS + id).pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('LOAD VIDEO ANALYTICS', []))
      );
    } else if (type == 'pdf') {
      return this.httpClient.get(this.server + PDF.ANALYTICS + id).pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('LOAD VIDEO ANALYTICS', []))
      );
    } else {
      return this.httpClient.get(this.server + IMAGE.ANALYTICS + id).pipe(
        map((res) => res['data'] || []),
        catchError(this.handleError('LOAD VIDEO ANALYTICS', []))
      );
    }
  }

  getVideoById(id: string): Observable<Video[]> {
    return this.httpClient.get(this.server + VIDEO.READ + id).pipe(
      map((res) => res['data'] || []),
      catchError(this.handleError('LOAD VIDEO DATA', []))
    );
  }

  createFolder(material: any): Observable<Material> {
    return this.httpClient
      .post(this.server + MATERIAL.CREATE_FOLDER, material)
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('CREATE FOLDER', null))
      );
  }
  updateFolder(_id: string, data: any): Observable<boolean> {
    return this.httpClient
      .put(this.server + MATERIAL.UPDATE_FOLDER + _id, data)
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('UPDATE FOLDER', false))
      );
  }
  updateFolders(ids: string[], data: any): Observable<boolean> {
    return this.httpClient
      .post(this.server + MATERIAL.UPDATE_FOLDERS, {
        ids,
        data
      })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('UPDATE FOLDERS', false))
      );
  }
  removeFolder(data): Observable<boolean> {
    return this.httpClient
      .post(this.server + MATERIAL.REMOVE_FOLDER, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('DELETE FOLDER', null))
      );
  }
  removeFolders(data): Observable<boolean> {
    return this.httpClient
      .post(this.server + MATERIAL.REMOVE_FOLDERS, data)
      .pipe(
        map((res) => res),
        catchError(this.handleError('DELETE FOLDERS', null))
      );
  }
  moveFiles(
    materials: any,
    target: string,
    source: string
  ): Observable<Material> {
    return this.httpClient
      .post(this.server + MATERIAL.MOVE_FILES, { materials, target, source })
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('MOVE MATERIALS', null))
      );
  }
  downloadVideo(id: string): any {
    return this.httpClient.get(this.server + VIDEO.DOWNLOAD + id).pipe(
      map((res) => res),
      catchError(this.handleError('DOWNLOAD VIDEO', null))
    );
  }

  leadCapture(data: any): any {
    return this.httpClient.post(this.server + MATERIAL.LEAD_CAPTURE, data).pipe(
      map((res) => res),
      catchError(this.handleError('LEAD CAPTURE', null))
    );
  }

  create$(material: any): void {
    const materials = this.storeService.materials.getValue();
    materials.unshift(material);
    this.storeService.materials.next([...materials]);
  }

  updateConvert$(_id, data): void {
    const materials = this.storeService.materials.getValue();
    materials.some((e) => {
      if (e._id === _id) {
        e.progress = data['progress'];
        if (data['converted']) {
          e.converted = data['converted'];
        }
        if (data['preview']) {
          e.preview = data['preview'];
        }
        return true;
      }
    });
  }

  update$(_id: string, data: any): void {
    const materials = this.storeService.materials.getValue();
    materials.some((e) => {
      if (e._id === _id) {
        e.deserialize(data);
        return true;
      }
    });
    // this.storeService.materials.next(materials);
  }
  updateFolder$(_id: string, matType: string, matId: string): void {
    const materials = this.storeService.materials.getValue();
    materials.some((e) => {
      if (e._id === _id) {
        if (e[matType]) {
          e[matType].push(matId);
        } else {
          e[matType] = [matId];
        }
        return true;
      }
    });
  }

  bulkUpdate$(ids: string[], data: any): void {
    const materials = this.storeService.materials.getValue();
    materials.forEach((e) => {
      if (ids.indexOf(e._id) !== -1) {
        e.deserialize(data);
      }
    });
    this.storeService.materials.next(materials);
  }

  add$(element: Material): void {
    const materials = this.storeService.materials.getValue();
    this.storeService.materials.next([...materials, element]);
  }

  delete$(ids: string[]): void {
    const materials = this.storeService.materials.getValue();
    const remained = materials.filter((e) => {
      if (ids.indexOf(e._id) === -1) {
        return true;
      }
    });
    this.storeService.materials.next(remained);
  }

  removeFolder$(folder: string): void {
    const materials = this.storeService.materials.getValue();
    materials.forEach((e) => {
      if (e.folder === folder) {
        e.folder = '';
      }
    });
    this.storeService.materials.next(materials);
  }

  removeFolders$(folders: string[]): void {
    const materials = this.storeService.materials.getValue();
    materials.forEach((e) => {
      if (folders.indexOf(e.folder) !== -1) {
        e.folder = '';
      }
    });
  }

  updatePageOption(data): void {
    let option = this.pageOption.getValue();
    option = { ...option, ...data };
    this.pageOption.next({ ...option });
  }

  clear$(): void {
    this.loading.next(STATUS.NONE);
    this.loadVideoStatus.next(STATUS.NONE);
    this.loadPdfStatus.next(STATUS.NONE);
    this.loadImageStatus.next(STATUS.NONE);
  }
}
