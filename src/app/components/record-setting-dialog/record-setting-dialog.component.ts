import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  Inject,
  NgZone
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NotifyComponent } from '../notify/notify.component';
import { FileUploader } from 'ng2-file-upload';
import { environment } from 'src/environments/environment';
import { UserService } from '../../services/user.service';
import { HelperService } from 'src/app/services/helper.service';
import { ToastrService } from 'ngx-toastr';
import { MaterialService } from 'src/app/services/material.service';
import * as ebml from 'ts-ebml';
import { Subscription, timer } from 'rxjs';
import * as RecordRTC from 'recordrtc';
import { ConfirmComponent } from '../confirm/confirm.component';
import { Router } from '@angular/router';
import { Video } from 'src/app/models/video.model';
import { RECORDING_POPUP } from 'src/app/constants/variable.constants';
import { between } from 'src/app/helper';
import { HandlerService } from 'src/app/services/handler.service';

@Component({
  selector: 'app-record-setting-dialog',
  templateUrl: './record-setting-dialog.component.html',
  styleUrls: ['./record-setting-dialog.component.scss']
})
export class RecordSettingDialogComponent implements OnInit {
  hasCamera = false;
  hasMic = false;
  isCamAlreadyCaptured = false;
  isMicAlreadyCaptured = false;

  @ViewChild('video') video: ElementRef;

  recorder;
  deviceConstraint = {};

  screenStream;
  cameraStream;

  micFlag = false;
  micRecording = false;
  mode = 'screen';

  recording = false;
  countNum = 3;

  cameraList = [];
  micList = [];
  selectedCamera = '';
  selectedMic = '';
  hovered = '';
  pauseFlag = false;
  collapse = false;
  recordStep = 1;
  popup;
  recordUrl = RECORDING_POPUP;
  redirectUrl = environment.front;
  authToken = '';
  userId = '';
  serverVideoId = '';
  completedRecord = false;
  recordedBuffer = [];
  serverBuffer = [];
  sentSize = 0;
  receivedSize = 0;
  convertCallSubscription: Subscription;
  audioDetectStream;
  elapseTime = '0:00';
  videoDurTimer;
  videoDuration = 0;
  counterDirection = 1;
  limitTime = 0;
  alertBounce = 60 * 1000;
  counterTimeStart = 300 * 1000;
  tempCount = 4;
  recordIndex = 0;
  uploading = false;
  passAlertBounce = false;

  @ViewChild('dialog') dialogEl: ElementRef;
  profileSubscription: Subscription;

  constructor(
    private dialog: MatDialog,
    private userService: UserService,
    private toast: ToastrService,
    private handlerService: HandlerService,
    private router: Router,
    private ngZone: NgZone,
    private materialService: MaterialService
  ) {
    this.authToken = this.userService.getToken();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        this.userId = profile._id;
      }
    );
  }

  ngOnInit(): void {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator['enumerateDevices'] = function (callback) {
        navigator.mediaDevices.enumerateDevices().then(callback);
      };

      this.checkDeviceSupport(() => {
        if (this.hasCamera) {
          this.deviceConstraint['video'] = {};
        }
        if (this.hasMic) {
          this.deviceConstraint['audio'] = {};
        }
      });

      this.initDeviceList();
    } else {
      this.showAlert(
        'This browser or webpage does not support the media devices(Camera and Microphone).'
      );
    }
  }

  ngOnDestroy(): void {
    if (this.audioDetectStream) {
      this.audioDetectStream.getTracks().forEach((track) => {
        track.stop();
      });
    }
  }

  toggleRecording(): void {
    this.pauseFlag = !this.pauseFlag;
    if (this.pauseFlag) {
      this.recorder.pauseRecording();
    } else {
      this.recorder.resumeRecording();
    }
  }

  count(): void {
    this.countNum = 3;
    const counter = setInterval(() => {
      this.countNum--;
      if (this.countNum === 0) {
        this.recordStep = 3;
        setTimeout(() => {
          this.recordImpl();
        }, 500);
        clearInterval(counter);
      }
    }, 1000);
  }

  setRecordMode(mode: string): void {
    if (mode === 'screenCam') {
      this.mode = mode;
    } else if (mode === 'camera') {
      if (this.hasCamera) {
        if (this.isCamAlreadyCaptured) {
          this.mode = 'camera';
        } else {
          navigator.mediaDevices
            .getUserMedia({ video: true })
            .then(() => {
              this.mode = 'camera';
            })
            .catch(() => {
              this.dialog.open(NotifyComponent, {
                position: { top: '100px' },
                width: '100vw',
                maxWidth: '400px',
                data: {
                  message: 'Camera is denied on this page.'
                }
              });
            });
        }
      } else {
        this.dialog.open(NotifyComponent, {
          position: { top: '100px' },
          width: '100vw',
          maxWidth: '400px',
          data: {
            message: 'Camera is not connected. Please connect the camera.'
          }
        });
      }
    } else if (mode === 'screen') {
      this.mode = mode;
    }
  }

  toggleMic(): void {
    if (this.cameraStream) {
      [this.cameraStream].forEach((stream) => {
        stream.getTracks().forEach((t) => {
          if (t.kind === 'audio') {
            t.enabled = !t.enabled;
            this.micRecording = !this.micRecording;
          }
        });
      });
    }
  }

  cancelRecording(): void {
    if (!this.recorder) {
      return;
    }
    this.completedRecord = false;
    this.recorder.stopRecording(() => {
      this.recording = false;
      this.recordStep = 4;

      if (this.cameraStream && this.screenStream) {
        [this.cameraStream, this.screenStream].forEach((stream) => {
          stream.getTracks().forEach((track) => {
            track.stop();
          });
        });
      } else if (this.cameraStream) {
        [this.cameraStream].forEach((stream) => {
          stream.getTracks().forEach((track) => {
            track.stop();
          });
        });
      } else if (this.screenStream) {
        [this.screenStream].forEach((stream) => {
          stream.getTracks().forEach((track) => {
            track.stop();
          });
        });
      }
      this.removeRecording();
    });
  }

  stopRecording(): void {
    if (!this.recorder) {
      return;
    }
    this.completedRecord = true;
    clearInterval(this.videoDurTimer);
    this.completeRecording();
    if (this.recorder.state !== 'stopped') {
      this.recorder.stopRecording(() => {
        this.recording = false;
        this.recordStep = 4;

        if (this.cameraStream && this.screenStream) {
          [this.cameraStream, this.screenStream].forEach((stream) => {
            stream.getTracks().forEach((track) => {
              track.stop();
            });
          });
        } else if (this.cameraStream) {
          [this.cameraStream].forEach((stream) => {
            stream.getTracks().forEach((track) => {
              track.stop();
            });
          });
        } else if (this.screenStream) {
          [this.screenStream].forEach((stream) => {
            stream.getTracks().forEach((track) => {
              track.stop();
            });
          });
        }
      });
    }
  }

  removeRecording(): void {
    const data = {
      video: this.serverVideoId,
      action: 'delete'
    };
    this.materialService.completeRecord(data).subscribe((res) => {
      if (res['status']) {
        this.handlerService.openRecording.next(null);
        this.completedRecord = false;
        this.serverVideoId = undefined;
        this.recorder = undefined;
      }
    });
  }

  saveRecording(): void {
    const data = {
      video: this.serverVideoId,
      count: this.recordIndex,
      action: 'save',
      duration: this.videoDuration <= 0 ? -1 : this.videoDuration
    };
    this.materialService.completeRecord(data).subscribe((res) => {
      if (res['status']) {
        const videoId = res.video.id;
        this.completedRecord = false;
        this.serverVideoId = undefined;
        this.recorder = undefined;
        this.handlerService.openRecording.next(null);
        this.ngZone.run(() => {
          this.router.navigate(['/materials'], {
            queryParams: { video: videoId }
          });
        });
      }
    });
  }

  completeRecording(): void {
    if (this.recordedBuffer.length) {
      let file;
      try {
        file = new File(
          this.recordedBuffer,
          this.serverVideoId + '-' + this.recordIndex + '.webm'
        );
      } catch {
        const blob = new Blob(this.recordedBuffer);
        Object.assign(blob, {});
        file = blob;
      }
      this.serverBuffer.push({ index: this.recordIndex, file });
      this.recordedBuffer = [];
      this.recordIndex++;
    }
    if (!this.uploading) {
      for (let i = this.serverBuffer.length - 1; i >= 0; i--) {
        const chunk = this.serverBuffer[i];
        if (!chunk) {
          this.serverBuffer.splice(i, 1);
        }
      }
      if (this.serverBuffer.length) {
        this.uploadVideo();
      } else {
        this.saveRecording();
      }
    }
  }

  recordImpl(): void {
    const videoSize = {
      height: window.screen.height,
      width: window.screen.width
    };
    if (this.cameraStream) {
      this.screenStream.addTrack(this.cameraStream.getTracks()[0]);
    } else {
      this.micRecording = false;
      this.micFlag = false;
    }
    this.screenStream.width = window.screen.width;
    this.screenStream.height = window.screen.height;
    this.screenStream.fullcanvas = true;

    this.passAlertBounce = false;
    this.videoDurTimer = setInterval(() => {
      if (this.recording && !this.pauseFlag) {
        if (this.counterDirection === 1) {
          this.videoDuration += 500;
        } else {
          if (this.videoDuration > 500) {
            this.videoDuration -= 500;
          } else {
            this.videoDuration = 0;
          }
        }
        this.elapseTime = this.formatTime(this.videoDuration);
        if (
          this.counterDirection === -1 &&
          this.videoDuration <= this.alertBounce
        ) {
          this.passAlertBounce = true;
        }
      }
    }, 500);

    this.recorder = RecordRTC(this.screenStream, {
      type: 'video',
      mimeType: 'video/x-matroska;codecs=vp8,opus',
      video: videoSize,
      timeSlice: 2000,
      ondataavailable: (data) => {
        if (this.recordedBuffer.length < this.tempCount) {
          this.recordedBuffer.push(data);
        }
        if (this.recordedBuffer.length === this.tempCount) {
          let file;
          try {
            file = new File(
              this.recordedBuffer,
              this.serverVideoId + '-' + this.recordIndex + '.webm'
            );
          } catch {
            const blob = new Blob(this.recordedBuffer);
            Object.assign(blob, {});
            file = blob;
          }
          this.serverBuffer.push({ index: this.recordIndex, file });
          this.recordedBuffer = [];
          this.recordIndex++;
        }
        if (!this.uploading) {
          for (let i = this.serverBuffer.length - 1; i >= 0; i--) {
            const chunk = this.serverBuffer[i];
            if (!chunk) {
              this.serverBuffer.splice(i, 1);
            }
          }
          if (this.serverBuffer.length) {
            this.uploadVideo();
          }
        }
      }
    });
    const video: HTMLVideoElement = this.video.nativeElement;
    video.muted = true;
    video.srcObject = this.screenStream;
    video.play();

    if (this.recorder) {
      this.recorder.startRecording();
      this.recording = true;
    }
  }

  uploadVideo(): void {
    const formData = new FormData();
    let newFiles = 0;
    const chunkIndexesToUpload = [];
    for (let i = 0; i < this.serverBuffer.length; i++) {
      const e = this.serverBuffer[i];
      if (e) {
        formData.append(
          'file',
          e.file,
          this.serverVideoId + '-' + e.index + '.webm'
        );
        chunkIndexesToUpload.push(e.index);
        newFiles++;
      }
    }
    if (!newFiles) {
      this.uploading = false;
      if (this.completedRecord) {
        this.saveRecording();
      }
      return;
    }
    this.uploading = true;
    this.materialService
      .uploadVideoChunk(this.serverVideoId, formData, this.authToken)
      .then((res) => {
        if (res['status']) {
          for (let i = this.serverBuffer.length - 1; i >= 0; i--) {
            const chunk = this.serverBuffer[i];
            if (chunk && chunkIndexesToUpload.indexOf(chunk.index) !== -1) {
              this.serverBuffer[i] = null;
            }
          }
          this.uploadVideo();
        } else {
          this.uploading = false;
        }
      });
  }

  captureMicro(): void {
    const constraint = { ...this.deviceConstraint };
    constraint['video'] = false;
    if (this.selectedMic) {
      constraint['audio']['deviceId'] = { exact: this.selectedMic };
    }
    navigator.mediaDevices
      .getUserMedia(constraint)
      .then((stream) => {
        this.cameraStream = stream;
        if (!this.serverVideoId) {
          this.materialService.initRecord().subscribe((res) => {
            if (res['status']) {
              this.videoDuration = 0;
              this.limitTime = res.data.max_duration - res.data.duration || 0;
              if (this.limitTime > this.counterTimeStart) {
                this.counterDirection = 1;
              } else {
                this.counterDirection = -1;
              }
              this.serverVideoId =
                'web-' +
                this.userId +
                '-' +
                new Date().getTime() +
                '-' +
                between(1000, 9999);
              this.count();
              this.recordStep = 2;
            }
          });
        }
      })
      .catch(() => {
        if (!this.serverVideoId) {
          this.materialService.initRecord().subscribe((res) => {
            if (res['status']) {
              this.videoDuration = 0;
              this.limitTime = res.data.max_duration - res.data.duration || 0;
              if (this.limitTime > this.counterTimeStart) {
                this.counterDirection = 1;
              } else {
                this.counterDirection = -1;
              }
              this.serverVideoId =
                this.userId +
                '-' +
                new Date().getTime() +
                '-' +
                between(1000, 9999);
              this.count();
              this.recordStep = 2;
            }
          });
        }
      });
  }

  captureScreen(): void {
    if (!this.selectedMic) {
      this.dialog
        .open(ConfirmComponent, {
          position: { top: '100px' },
          width: '98vw',
          maxWidth: '500px',
          disableClose: true,
          data: {
            title: 'Your microphone is muted',
            message:
              'Heads up! To have sound in your video, you must unmute your microphone. Do you wish to proceed anyway?',
            confirmLabel: 'Yes, proceed'
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            this.invokeGetDisplayMedia(
              (screen) => {
                this.addStreamStopListener(screen, this.stopRecording);
                this.screenStream = screen;
                this.captureMicro();
              },
              () => {}
            );
          } else {
            return;
          }
        });
    } else {
      this.invokeGetDisplayMedia(
        (screen) => {
          this.addStreamStopListener(screen, this.stopRecording);
          this.screenStream = screen;
          this.captureMicro();
        },
        () => {}
      );
    }
  }

  record(): void {
    this.captureScreen();
  }

  addStreamStopListener(stream, callback): void {
    stream.addEventListener(
      'ended',
      () => {
        this.stopRecording();
      },
      false
    );
    stream.addEventListener(
      'inactive',
      () => {
        this.stopRecording();
      },
      false
    );
    stream.getTracks().forEach((track) => {
      track.addEventListener(
        'ended',
        () => {
          this.stopRecording();
        },
        false
      );
      track.addEventListener(
        'inactive',
        () => {
          this.stopRecording();
        },
        false
      );
    });
  }

  invokeGetDisplayMedia(success, error): void {
    const displaymediastreamconstraints = {
      video: true
    };

    if (navigator.mediaDevices['getDisplayMedia']) {
      navigator.mediaDevices['getDisplayMedia'](displaymediastreamconstraints)
        .then(success)
        .catch(error);
    } else {
      navigator['getDisplayMedia'](displaymediastreamconstraints)
        .then(success)
        .catch(error);
    }
  }

  checkDeviceSupport(callback): void {
    let canEnumerate = false;
    if (
      typeof MediaStreamTrack !== 'undefined' &&
      'getSources' in MediaStreamTrack
    ) {
      canEnumerate = true;
    } else if (
      navigator.mediaDevices &&
      !!navigator.mediaDevices.enumerateDevices
    ) {
      canEnumerate = true;
    }
    if (!canEnumerate) {
      return;
    }

    if (!navigator['enumerateDevices'] && navigator['enumerateDevices']) {
      navigator['enumerateDevices'] = navigator['enumerateDevices'].bind(
        navigator
      );
    }

    if (!navigator['enumerateDevices']) {
      if (callback) {
        callback();
      }
      return;
    }

    const MediaDevices = [];
    navigator['enumerateDevices']((devices) => {
      devices.forEach((_device) => {
        const device = {};
        for (const d in _device) {
          device[d] = _device[d];
        }

        if (device['kind'] === 'audio') {
          device['kind'] = 'audioinput';
        }

        if (device['kind'] === 'video') {
          device['kind'] = 'videoinput';
        }

        let skip;
        MediaDevices.forEach((d) => {
          if (d.id === device['id'] && d.kind === device['kind']) {
            skip = true;
          }
        });

        if (skip) {
          return;
        }

        if (!device['deviceId']) {
          device['deviceId'] = device['id'];
        }

        if (!device['id']) {
          device['id'] = device['deviceId'];
        }

        const isHTTPs = location.protocol === 'https:';
        if (!device['label']) {
          device['label'] = 'Please invoke getUserMedia once.';
          if (!isHTTPs) {
            device['label'] =
              'HTTPs is required to get label of this ' +
              device['kind'] +
              ' device.';
          }
        } else {
          if (device['kind'] === 'videoinput' && !this.isCamAlreadyCaptured) {
            this.isCamAlreadyCaptured = true;
          }

          if (device['kind'] === 'audioinput' && !this.isMicAlreadyCaptured) {
            this.isMicAlreadyCaptured = true;
          }
        }

        if (device['kind'] === 'audioinput') {
          this.hasMic = true;
        }

        if (device['kind'] === 'videoinput') {
          this.hasCamera = true;
        }

        // there is no 'videoouput' in the spec.
        MediaDevices.push(device);
      });

      if (callback) {
        callback();
      }
    });
  }

  initDeviceList(): void {
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        devices.forEach((device) => {
          if (
            device.kind === 'audioinput' &&
            device.deviceId !== 'default' &&
            device.deviceId !== 'communications'
          ) {
            this.micList.push(device);
          }

          if (
            device.kind === 'videoinput' &&
            device.deviceId !== 'default' &&
            device.deviceId !== 'communications'
          ) {
            this.cameraList.push(device);
          }
        });
        if (this.cameraList && this.cameraList.length) {
          this.selectedCamera = this.cameraList[0]['deviceId'];
        }
        if (this.micList && this.micList.length) {
          this.selectedMic = this.micList[0]['deviceId'];
          this.detectAudio(this.selectedMic);
        }
      })
      .catch((err) => {
        this.cameraList = [];
        this.micList = [];
      });
  }

  downloadApp(): void {
    const dom = document.createElement('a');
    if (window.navigator.userAgent.indexOf('Win') !== -1) {
      dom.href =
        'https://teamgrow.s3.us-east-2.amazonaws.com/recorder/crmrecorder+Setup+0.1.4.exe';
      dom.click();
    } else {
      dom.href =
        'https://teamgrow.s3.us-east-2.amazonaws.com/recorder/crmrecorder-0.1.4.dmg';
      dom.click();
    }
  }

  openApp(): void {
    const dom = document.createElement('a');
    dom.href = 'crmrecord://';
    dom.click();
  }

  openWidget(): void {
    const w = 750;
    const h = 450;
    const dualScreenLeft =
      window.screenLeft !== undefined ? window.screenLeft : window.screenX;
    const dualScreenTop =
      window.screenTop !== undefined ? window.screenTop : window.screenY;

    const width = window.innerWidth
      ? window.innerWidth
      : document.documentElement.clientWidth
      ? document.documentElement.clientWidth
      : screen.width;
    const height = window.innerHeight
      ? window.innerHeight
      : document.documentElement.clientHeight
      ? document.documentElement.clientHeight
      : screen.height;

    const systemZoom = width / window.screen.availWidth;
    const left = (width - w) / 2 / systemZoom + dualScreenLeft;
    const top = (height - h) / 2 / systemZoom + dualScreenTop;
    const option = `width=${w}, height=${h}, top=${top}, left=${left}`;
    if (!this.popup || this.popup.closed) {
      const camera = this.cameraList.filter((e) => {
        return e.deviceId === this.selectedCamera;
      });
      const microphone = this.micList.filter((e) => {
        return e.deviceId === this.selectedMic;
      });
      const cameraLabel = camera && camera.length ? camera[0]['label'] : '';
      const micLabel =
        microphone && microphone.length ? microphone[0]['label'] : '';
      const ref = window.location.href;
      this.popup = window.open(
        this.recordUrl +
          '/index.html?token=' +
          this.authToken +
          '&method=material&userId=' +
          this.userId +
          '&prev=' +
          encodeURIComponent(ref) +
          '&camera=' +
          cameraLabel +
          '&mic=' +
          micLabel,
        'material',
        option
      );
      window.addEventListener('message', (e) => {
        if (e && e.data && e.origin == this.recordUrl) {
          const videoId = e.data;
          if (ref.includes('materials')) {
            location.href = `${this.redirectUrl}/materials?video=${videoId}`;
          } else {
            let popup;
            if (!popup || popup.closed) {
              popup = window.open(
                `${this.redirectUrl}/materials?video=${videoId}`,
                `camera${videoId}`
              );
            } else {
              popup.focus();
            }
          }
        }
      });
    } else {
      this.popup.focus();
    }
    this.handlerService.openRecording.next(null);
  }

  showAlert(msg: string): MatDialogRef<NotifyComponent> {
    const dialogRef = this.dialog.open(NotifyComponent, {
      position: { top: '100px' },
      width: '100vw',
      maxWidth: '400px',
      data: {
        message: msg
      }
    });
    return dialogRef;
  }

  close(): void {
    this.handlerService.openRecording.next(null);
  }

  collapseVideo(): void {
    this.collapse = !this.collapse;
  }

  hoverButton(type): void {
    this.hovered = type;
  }

  blurButton(): void {
    this.hovered = '';
  }

  detectAudio(audioId): void {
    // const constraints = {
    //   audio: {
    //     deviceId: audioId ? { exact: audioId } : undefined
    //   }
    // };
    // navigator.mediaDevices
    //   .getUserMedia({ ...constraints, video: false })
    //   .then((stream) => {
    //     this.audioDetectStream = stream;
    //     const audioContext = new AudioContext();
    //     const analyser = audioContext.createAnalyser();
    //     const microphone = audioContext.createMediaStreamSource(stream);
    //     const javascriptNode = audioContext.createScriptProcessor(1024, 1, 1);
    //     analyser.smoothingTimeConstant = 1;
    //     analyser.fftSize = 512;
    //     microphone.connect(analyser);
    //     analyser.connect(javascriptNode);
    //     javascriptNode.connect(audioContext.destination);
    //     javascriptNode.onaudioprocess = () => {
    //       const array = new Uint8Array(analyser.frequencyBinCount);
    //       analyser.getByteFrequencyData(array);
    //       let values = 0;
    //       const length = array.length;
    //       for (let i = 0; i < length; i++) {
    //         values += array[i];
    //       }
    //       const average = values / length;
    //       // audioSizeMark.style.height = average + '%';
    //       this.changeAudioStatus(average);
    //     };
    //   })
    //   .catch((err) => {
    //     console.log("Catch Stream Error", err);
    //   });
  }

  changeAudioStatus(avg): void {
    if (this.dialogEl && this.dialogEl.nativeElement) {
      const dialogWrapper = this.dialogEl.nativeElement;
      if (dialogWrapper.querySelector('.mic-status')) {
        dialogWrapper.querySelector('.mic-status').style.height = avg + '%';
      }
      if (dialogWrapper.querySelector('.mic-status-btn')) {
        dialogWrapper.querySelector('.mic-status-btn').style.height = avg + '%';
      }
    }
  }

  formatTime(millisecond): string {
    const date = new Date(0);
    date.setSeconds(millisecond / 1000); // specify value for SECONDS here
    const minute = date.getMinutes();
    const second = date.getSeconds();
    let displaySecond = '00';
    if (second < 10) {
      displaySecond = '0' + second.toString();
    } else {
      displaySecond = second.toString();
    }
    return `${minute}:${displaySecond}`;
  }
}
