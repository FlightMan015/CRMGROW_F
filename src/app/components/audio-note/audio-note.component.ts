import {
  Component,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  EventEmitter
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import * as moment from 'moment';
import * as RecordRTC from 'recordrtc';
import { interval, Subscription } from 'rxjs';
declare const annyang: any;

@Component({
  selector: 'app-audio-note',
  templateUrl: './audio-note.component.html',
  styleUrls: ['./audio-note.component.scss']
})
export class AudioNoteComponent implements OnInit, OnDestroy {
  // Interface
  @Input()
  public set url(val: string) {
    if (val) {
      this.dataURL = val;
    }
  }
  @Output() onRecorded = new EventEmitter();
  @Output() onRemoved = new EventEmitter();
  // Devices
  microphones = [];
  microphone: string = '';
  error: string = null;
  // Status
  recordStarted: boolean = false;
  recording: boolean = false;
  recordedTime: number = 0;
  timer: Subscription = null;
  // Data
  recordStream = null;
  mediaRecorder = null;
  dataURL = null;
  // Inspector
  audioContext;
  analyser;
  analyserStream;
  scriptProcessor;
  measureStream;
  @ViewChild('meterWrapper') meterWrapper;
  // constants
  MESSAGES = {
    require_microphone: 'Please select microphone.'
  };

  constructor(private ngZone: NgZone, public domSanitizer: DomSanitizer) {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(() => {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => this.loadDevices(devices))
        .catch((err) => this.onErrorHandle('Device Capture', err));
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.analyserStream && this.analyserStream.disconnect(this.analyser);
    this.analyser && this.analyser.disconnect(this.scriptProcessor);
    this.scriptProcessor &&
      this.scriptProcessor.disconnect(this.audioContext.destination);
    if (this.scriptProcessor) {
      this.scriptProcessor.onaudioprocess = null;
    }
    this.scriptProcessor = null;
    this.analyserStream = null;
    this.analyser = null;
  }

  onErrorHandle(operation: string, err: Error) {}

  /**
   * Load Devices
   * @param devices: devices
   */
  loadDevices(devices: any[]): void {
    const loadedDeviceIds = [];
    const microphoneList = [];
    devices.forEach((device) => {
      if (device.kind === 'audioinput') {
        if (
          loadedDeviceIds.indexOf(device.deviceId) === -1 &&
          device.deviceId !== 'communications' &&
          device.deviceId !== 'default'
        ) {
          microphoneList.push(device);
        }
      }
    });
    this.microphones = microphoneList;
  }

  /**
   * Select microphone and reset the volumn meter
   * @param $event: string
   * @returns
   */
  selectDevice($event): void {
    this.error = null;
    this.analyserStream && this.analyserStream.disconnect(this.analyser);
    this.analyser && this.analyser.disconnect(this.scriptProcessor);
    this.scriptProcessor &&
      this.scriptProcessor.disconnect(this.audioContext.destination);
    if (this.scriptProcessor) {
      this.scriptProcessor.onaudioprocess = null;
    }
    this.scriptProcessor = null;
    this.analyserStream = null;
    this.analyser = null;
    this.closeMeasureStream();
    if (!$event) {
      return;
    }
    navigator.mediaDevices
      .getUserMedia({
        audio: { deviceId: { exact: $event } },
        video: false
      })
      .then((stream) => {
        this.measureStream = stream;
        this.audioContext = new AudioContext();
        this.analyser = this.audioContext.createAnalyser();
        this.analyserStream = this.audioContext.createMediaStreamSource(stream);
        this.scriptProcessor = this.audioContext.createScriptProcessor(
          2048,
          1,
          1
        );

        this.analyser.smoothingTimeConstant = 0.8;
        this.analyser.fftSize = 1024;

        this.analyserStream.connect(this.analyser);
        this.analyser.connect(this.scriptProcessor);
        this.scriptProcessor.connect(this.audioContext.destination);
        this.scriptProcessor.onaudioprocess = () => {
          const array = new Uint8Array(this.analyser.frequencyBinCount);
          this.analyser.getByteFrequencyData(array);
          const arraySum = array.reduce((a, value) => a + value, 0);
          const average = arraySum / array.length;
          const numberOfPidsToColor = Math.round(average / 10);
          if (this.meterWrapper?.nativeElement) {
            const allPids = Array.from(
              this.meterWrapper.nativeElement.querySelectorAll('.pid')
            );
            const pidsToColor = allPids.slice(0, numberOfPidsToColor);
            for (const pid of allPids) {
              const pidEl = <HTMLDivElement>pid;
              pidEl.style.backgroundColor = '#e6e7e8';
            }
            for (const pid of pidsToColor) {
              const pidEl = <HTMLDivElement>pid;
              pidEl.style.backgroundColor = '#69ce2b';
            }
          }
        };
      })
      .catch((err) => {
        /* handle the error */
        console.error(err);
      });
  }

  /**
   * Toggle starting
   */
  toggleStart(): void {
    if (this.recordStarted) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  /**
   * Toggle recording
   */
  toggleRecording(): void {
    if (this.recording) {
      this.mediaRecorder.pause();
      this.recording = false;
    } else {
      this.mediaRecorder.resume();
      this.recording = true;
    }
  }

  /**
   * Start recording
   */
  startRecording(): void {
    if (!this.microphone) {
      this.error = 'require_microphone';
      return;
    }
    navigator.mediaDevices
      .getUserMedia({
        audio: { deviceId: { exact: this.microphone } },
        video: false
      })
      .then((stream) => {
        this.recordedTime = 0;
        this.recordStream = stream;
        const options = {
          mimeType: 'audio/wav',
          numberOfAudioChannels: 2
        };
        const StereoAudioRecorder = RecordRTC.StereoAudioRecorder;
        this.mediaRecorder = new StereoAudioRecorder(stream, options);
        this.mediaRecorder.record();
        this.recordStarted = true;
        this.recording = true;
        this.timer = interval(1000).subscribe(() => {
          this.recording && this.recordedTime++;
          if (this.recordedTime >= 120) {
            this.stopRecording();
          }
        });
      });
  }

  /**
   * Stop recording
   */
  stopRecording(): void {
    this.mediaRecorder.stop((blob) => {
      this.dataURL = URL.createObjectURL(blob);
      this.recordStarted = false;
      this.recording = false;
      this.timer.unsubscribe();
      this.microphone = '';
      this.closeMicStream();
      let file;
      // try {
      //   file = new File(blob, 'audio.webm');
      // } catch {
      //   const b = new Blob(blob);
      //   Object.assign(b, {});
      //   file = b;
      // }
      console.log('fiel', blob, file);
      this.onRecorded.emit({ file: blob, url: this.dataURL, content: '' });
    });
  }

  /**
   * Close the microphone stream
   */
  closeMicStream(): void {
    if (this.measureStream) {
      this.measureStream.getTracks().forEach((track) => {
        track.stop();
      });
    }
    if (this.recordStream) {
      this.recordStream.getTracks().forEach((track) => {
        track.stop();
      });
    }
  }

  /**
   * Close the measure stream
   */
  closeMeasureStream(): void {
    if (this.measureStream) {
      this.measureStream.getTracks().forEach((track) => {
        track.stop();
      });
    }
  }

  /**
   * Download Video
   */
  download(): void {
    
  }

  /**
   * Clear the dataURL
   */
  remove(): void {
    this.dataURL = false;
    this.onRemoved.emit();
  }

  /**
   * Convert the seconds to mm:ss format
   * @param time: number of seconds
   * @returns: formatted result
   */
  convertTimeFormat(time: number): string {
    return moment(time * 1000).format('mm:ss');
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// Voice speech recognization part //////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////
  voiceActiveSectionDisabled: boolean = true;
  voiceActiveSectionError: boolean = false;
  voiceActiveSectionSuccess: boolean = false;
  voiceActiveSectionListening: boolean = false;
  voiceText: any;
  initializeVoiceRecognitionCallback(): void {
    annyang.addCallback('error', (err) => {
      if (err.error === 'network') {
        this.voiceText = 'Internet is require';
        annyang.abort();
        this.ngZone.run(() => (this.voiceActiveSectionSuccess = true));
      } else if (this.voiceText === undefined) {
        this.ngZone.run(() => (this.voiceActiveSectionError = true));
        annyang.abort();
      }
    });

    annyang.addCallback('soundstart', (res) => {
      this.ngZone.run(() => (this.voiceActiveSectionListening = true));
    });

    annyang.addCallback('end', () => {
      if (this.voiceText === undefined) {
        this.ngZone.run(() => (this.voiceActiveSectionError = true));
        annyang.abort();
      }
    });

    annyang.addCallback('result', (userSaid) => {
      console.log('userSaid', userSaid);
      this.ngZone.run(() => (this.voiceActiveSectionError = false));

      const queryText: any = userSaid[0];

      annyang.abort();

      this.voiceText = queryText;

      this.ngZone.run(() => (this.voiceActiveSectionListening = false));
      this.ngZone.run(() => (this.voiceActiveSectionSuccess = true));
    });
  }

  startVoiceRecognition(): void {
    this.voiceActiveSectionDisabled = false;
    this.voiceActiveSectionError = false;
    this.voiceActiveSectionSuccess = false;
    this.voiceText = undefined;

    if (annyang) {
      this.initializeVoiceRecognitionCallback();

      annyang.start({ autoRestart: false });
    }
  }

  closeVoiceRecognition(): void {
    this.voiceActiveSectionDisabled = true;
    this.voiceActiveSectionError = false;
    this.voiceActiveSectionSuccess = false;
    this.voiceActiveSectionListening = false;
    this.voiceText = undefined;

    if (annyang) {
      annyang.abort();
    }
  }
}
