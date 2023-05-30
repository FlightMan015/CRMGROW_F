import { DOCUMENT } from '@angular/common';
import {
  ApplicationRef,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Input,
  NgZone,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { QuillEditorComponent } from 'ngx-quill';
import { FileService } from 'src/app/services/file.service';
import * as QuillNamespace from 'quill';
import { promptForFiles, loadBase64, ByteToSize } from 'src/app/helper';
import { TemplatesService } from 'src/app/services/templates.service';
import { Template } from 'src/app/models/template.model';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { ToastrService } from 'ngx-toastr';
import { HandlerService } from 'src/app/services/handler.service';
import { ConnectService } from 'src/app/services/connect.service';
import { UserService } from 'src/app/services/user.service';
import { Subscription } from 'rxjs';
const Quill: any = QuillNamespace;
const Delta = Quill.import('delta');
const Parchment = Quill.import('parchment');
const ImageBlot = Quill.import('formats/image');
import { StripTagsPipe } from 'ngx-pipes';
import { Material } from 'src/app/models/material.model';
import { ConfirmComponent } from '../confirm/confirm.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { StoreService } from 'src/app/services/store.service';
import { MaterialService } from 'src/app/services/material.service';
import {
  AUTOMATION_ATTACH_SIZE,
  RECORDING_POPUP
} from 'src/app/constants/variable.constants';
// import ImageResize from 'quill-image-resize-module';
// Quill.register('modules/imageResize', ImageResize);
import { ScheduleService } from 'src/app/services/schedule.service';

@Component({
  selector: 'app-html-editor',
  templateUrl: './html-editor.component.html',
  styleUrls: ['./html-editor.component.scss'],
  providers: [StripTagsPipe]
})
export class HtmlEditorComponent implements OnInit {
  @Input() submitted: boolean = false;
  @Input() placeholder: string = '';
  @Input() style: any = { height: '180px' };
  @Input() class = '';
  @Input() hasToken: boolean = false;
  @Input() required: boolean = false;
  @Input() subject: string = '';
  @Input() hasScheduler: boolean = true;
  @Input()
  public set hasAttachment(val: boolean) {
    if (val) {
      this.config.toolbar.container.unshift(['attachment']);
    }
  }
  @Input()
  public set hasTemplates(val: boolean) {
    if (val) {
      this.config.toolbar.container.push(['template']);
    }
  }
  @Input()
  public set hasEmoji(val: boolean) {
    if (val) {
      this.config.toolbar.container.push(['emoji']);
    }
  }
  @Input()
  public set hasCalendly(val: boolean) {
    if (val) {
      this.config.toolbar.container.push(['calendly']);
      this.connectService.loadCalendlyAll(false);
    }
  }
  // @Input()
  // public set hasScheduler(val) {
  //   console.log('val', val);
  //   if (val) {
  //     this.scheduleService.getEventTypes(false);
  //   } else {
  //     this.config.toolbar.container.unshift(['scheduler']);
  //   }
  // }
  @Input()
  public set hasRecord(val: boolean) {
    if (val) {
      this.config.toolbar.container.push(['record']);
    }
  }
  @Input()
  public set noImage(val: boolean) {
    if (val) {
      this.config.toolbar.container.forEach((e) => {
        e.some((item, index) => {
          if (item === 'image' || item.list === 'image') {
            e.splice(index, 1);
            return true;
          }
        });
      });
    }
  }
  @Input()
  public set noFont(val: boolean) {
    if (val) {
      this.config.toolbar.container.forEach((e) => {
        e.some((item, index) => {
          if (item.hasOwnProperty('font')) {
            delete item['font'];
          }
          if (Object.keys(item).length === 0) {
            e.splice(index, 1);
          }
        });
      });
    }
  }
  @Input()
  public set noSize(val: boolean) {
    if (val) {
      this.config.toolbar.container.forEach((e) => {
        e.some((item, index) => {
          if (item.hasOwnProperty('size')) {
            delete item['size'];
          }
          if (Object.keys(item).length === 0) {
            e.splice(index, 1);
          }
        });
      });
    }
  }
  @Input() templateSelectMethod = 'insert';
  @Input() hasNewTemplateLink = true;
  @Input() public set attach(val: any) {
    if (val) {
      this.attachments = val;
    }
  }

  @Input() value: string = '';
  @Input() limit: number = 0;
  @Output() valueChange: EventEmitter<string> = new EventEmitter();
  @Output() onFocus: EventEmitter<boolean> = new EventEmitter();
  @Output() attachmentChange: EventEmitter<any> = new EventEmitter();
  @Output() onInit: EventEmitter<boolean> = new EventEmitter();
  @Output() onChangeTemplate: EventEmitter<Template> = new EventEmitter();
  @Output() onCreateEvent: EventEmitter<string> = new EventEmitter();
  @Output() onRecordCompleted: EventEmitter<Material> = new EventEmitter();

  editorForm: FormControl = new FormControl();
  @ViewChild('emailEditor') emailEditor: QuillEditorComponent;
  showTemplates: boolean = false;
  showCalendly: boolean = false;
  showScheduler: boolean = false;
  showEmoji: boolean = false;
  showLink: boolean = false;
  displayText = '';
  displayLink = '';
  isSelected = false;
  selectedIndex;
  selectedLength;
  set = 'twitter';
  userId = '';
  authToken = '';
  recordUrl = RECORDING_POPUP;
  quillEditorRef;
  popup;
  attachments = [];
  config = {
    toolbar: {
      container: [
        [{ size: ['0.75em', false, '1.5em', '2em'] }],
        [
          {
            font: [
              'arial',
              'times new roman',
              'monospace',
              'arial black',
              'arial narrow',
              'comic sans ms',
              'garamond',
              'georgia',
              'tahoma',
              'trebuchet ms',
              'verdana'
            ]
          }
        ],
        ['bold', 'italic', 'underline'],
        [{ list: 'bullet' }],
        ['link', 'image'],
        ['scheduler']
      ],
      handlers: {
        attachment: () => {
          promptForFiles().then((files) => {
            [].forEach.call(files, (file) => {
              loadBase64(file).then((base64) => {
                const i = Math.floor(Math.log(file.size) / Math.log(1024));
                const size = file.size / Math.pow(1024, i);
                if ((size > 25 && i == 2) || i > 2) {
                  this.zone.run(() => {
                    this.toast.error(
                      'You can send up to 25 MB in attachments.',
                      '',
                      { timeOut: 3000 }
                    );
                    this.emailEditor.quillEditor.focus();
                    this.cdr.detectChanges();
                  });
                } else {
                  const attachment = {
                    filename: file.name,
                    type: file.type,
                    content: base64.substr(base64.indexOf(',') + 1),
                    size: ByteToSize(file.size),
                    byte: file.size
                  };
                  if (this.limit) {
                    let attachmentSize = 0;
                    for (const attach of this.attachments) {
                      attachmentSize += attach.byte;
                    }
                    attachmentSize += file.size;
                    if (attachmentSize / 1024 > this.limit) {
                      this.zone.run(() => {
                        this.toast.error(
                          `You can send up to ${this.limit} KB in attachments in automation.`,
                          '',
                          { timeOut: 3000 }
                        );
                        this.emailEditor.quillEditor.focus();
                        this.cdr.detectChanges();
                      });
                    } else {
                      this.attachments.unshift(attachment);
                      this.attachmentChange.emit(this.attachments);
                      this.cdr.detectChanges();
                    }
                  } else {
                    this.attachments.unshift(attachment);
                    this.attachmentChange.emit(this.attachments);
                    this.cdr.detectChanges();
                  }
                }
              });
            });
          });
        },
        link: () => {
          if (this.emailEditor.quillEditor.getSelection().length !== 0) {
            const range = this.emailEditor.quillEditor.getSelection();
            const delta = this.emailEditor.quillEditor.getContents(
              range.index,
              range.length
            );
            this.displayText = delta.ops[0].insert;
            this.isSelected = true;
            this.selectedIndex = range.index;
            this.selectedLength = range.length;
          } else {
            this.displayText = '';
          }
          this.displayLink = '';
          this.showLink = !this.showLink;
          this.cdr.detectChanges();
        },
        template: () => {
          this.showTemplates = !this.showTemplates;
          this.cdr.detectChanges();
        },
        emoji: () => {
          this.showEmoji = !this.showEmoji;
          this.cdr.detectChanges();
        },
        calendly: () => {
          this.showCalendly = !this.showCalendly;
          this.cdr.detectChanges();
        },
        record: () => {
          const w = 750;
          const h = 450;
          const dualScreenLeft =
            window.screenLeft !== undefined
              ? window.screenLeft
              : window.screenX;
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
          const ref = window.location.href;
          if (!this.popup || this.popup.closed) {
            this.popup = window.open(
              this.recordUrl +
                '/index.html?token=' +
                this.authToken +
                '&method=website&userId=' +
                this.userId +
                '&prev=' +
                encodeURIComponent(ref),
              'record',
              option
            );
            window.addEventListener('message', (e) => {
              console.log('message');
              if (e && e.data) {
                try {
                  const recordedVideo = new Material().deserialize(e.data);
                  recordedVideo.material_type = 'video';
                  if (!this.hasSameMaterial(recordedVideo)) {
                    this.insertMaterials(e.data, true);
                    this.materialService.create$(recordedVideo);
                    this.onRecordCompleted.emit(recordedVideo);
                  }
                } catch (err) {
                  console.log('Insert Material is failed', err);
                }
              }
              return;
            });
          } else {
            this.popup.focus();
          }
          this.cdr.detectChanges();
        },
        scheduler: () => {
          this.showScheduler = !this.showScheduler;
          this.cdr.detectChanges();
        }
      }
    },
    table: false,
    'better-table': {
      operationMenu: {
        items: {
          unmergeCells: {
            text: 'Another unmerge cells name'
          }
        },
        color: {
          colors: ['green', 'red', 'yellow', 'blue', 'white'],
          text: 'Background Colors:'
        }
      }
    },
    blotFormatter: {}
  };

  @ViewChild('createNewContent') createNewContent: TemplateRef<unknown>;
  overlayRef: OverlayRef;
  templatePortal: TemplatePortal;

  profileSubscription: Subscription;

  constructor(
    private dialog: MatDialog,
    private userService: UserService,
    private fileService: FileService,
    public templateService: TemplatesService,
    private handlerService: HandlerService,
    private materialService: MaterialService,
    public connectService: ConnectService,
    @Inject(DOCUMENT) private Document: Document,
    private cdr: ChangeDetectorRef,
    private overlay: Overlay,
    private _viewContainerRef: ViewContainerRef,
    private toast: ToastrService,
    private appRef: ApplicationRef,
    private stripTags: StripTagsPipe,
    private router: Router,
    private zone: NgZone,
    public scheduleService: ScheduleService
  ) {
    this.templateService.loadAll(false);
    this.authToken = this.userService.getToken();
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((user) => {
      this.userId = user._id;
    });

    if (this.hasScheduler !== false) {
      this.scheduleService.getEventTypes(false);
    }
  }

  ngOnInit(): void {
    setTimeout(() => {
      if (this.hasScheduler === false) {
        const toolbar = this.emailEditor.quillEditor.getModule('toolbar');
        const scheduler_button = toolbar.container.querySelector(
          '.ql-scheduler'
        );
        scheduler_button.remove();
      }
    }, 150);
  }

  insertValue(value: string): void {
    if (value && this.quillEditorRef && this.quillEditorRef.clipboard) {
      this.emailEditor.quillEditor.focus();
      const range = this.emailEditor.quillEditor.getSelection();
      let index = 0;
      if (range) {
        index = range.index;
      }
      const delta = this.quillEditorRef.clipboard.convert({
        html: value
      });
      this.emailEditor.quillEditor.updateContents(
        new Delta().retain(index).concat(delta),
        'user'
      );
      const length = this.emailEditor.quillEditor.getLength();
      this.emailEditor.quillEditor.setSelection(length, 0, 'user');
      // this.emailEditor.quillEditor.setContents(delta, 'user');
    }
  }

  insertLink(): void {
    let url;
    if (
      !this.displayLink.includes('http:') &&
      !this.displayLink.includes('https:')
    ) {
      this.displayLink = 'http://' + this.displayLink;
    }
    if (this.displayText != '') {
      url =
        `<a href="${this.displayLink}" target="_blank">${this.displayText}</a>` +
        '\n';
    } else {
      url =
        `<a href="${this.displayLink}" target="_blank">${this.displayLink}</a>` +
        '\n';
    }
    if (this.isSelected) {
      this.emailEditor.quillEditor.deleteText(
        this.selectedIndex,
        this.selectedLength,
        'user'
      );
      this.isSelected = false;
    }
    this.insertValue(url);
    this.showLink = false;
    this.cdr.detectChanges();
  }

  setValue(value: string, materials: any = null): void {
    if (value && this.quillEditorRef && this.quillEditorRef.clipboard) {
      const delta = this.quillEditorRef.clipboard.convert({ html: value });
      if (materials && Object.keys(materials).length) {
        delta.forEach((e) => {
          if (e.insert?.materialLink?._id) {
            const materialId = e.insert?.materialLink?._id;
            if (materials[materialId]?.material_type) {
              e.insert.materialLink.material_type =
                materials[materialId]?.material_type;
            }
          }
        });
      }
      this.emailEditor.quillEditor.setContents(delta, 'user');
    }
  }

  getEditorInstance(editorInstance: any): void {
    this.quillEditorRef = editorInstance;
    const toolbar = this.quillEditorRef.getModule('toolbar');
    toolbar.addHandler('image', this.initImageHandler);
    if (this.value) {
      this.setValue(this.value);
    }
    this.onInit.emit();

    this.emailEditor.quillEditor.container.addEventListener('click', (ev) => {
      const img = Parchment.Registry.find(ev.target);
      if (img instanceof ImageBlot) {
        this.emailEditor.quillEditor.setSelection(
          img.offset(this.emailEditor.quillEditor.scroll),
          1,
          'user'
        );
      }
    });

    const fonts = Quill.import('attributors/style/font');
    fonts.whitelist = [
      'arial',
      'times new roman',
      'monospace',
      'arial black',
      'arial narrow',
      'comic sans ms',
      'garamond',
      'georgia',
      'tahoma',
      'trebuchet ms',
      'verdana'
    ];
    Quill.register(fonts, true);

    const tooltip = this.emailEditor.quillEditor.theme.tooltip;
    const input = tooltip.root.querySelector('input[data-link]');
    const link_button = toolbar.container.querySelector('.ql-link');
    const image_button = toolbar.container.querySelector('.ql-image');
    const template_button = toolbar.container.querySelector('.ql-template');
    const emoji_button = toolbar.container.querySelector('.ql-emoji');
    const calendly_button = toolbar.container.querySelector('.ql-calendly');
    const scheduler_button = toolbar.container.querySelector('.ql-scheduler');
    const record_button = toolbar.container.querySelector('.ql-record');
    const attachment_button = toolbar.container.querySelector('.ql-attachment');
    const bold_button = toolbar.container.querySelector('.ql-bold');
    const italic_button = toolbar.container.querySelector('.ql-italic');
    const underline_button = toolbar.container.querySelector('.ql-underline');
    const list_button = toolbar.container.querySelector('.ql-list');
    if (link_button) {
      link_button.insertAdjacentHTML(
        'beforeend',
        `<i class="i-icon s-14 i-link-inverse bgc-dark d-block"></i>`
      );
      link_button.setAttribute('data-tip', 'Link');
      link_button.classList.add('qtip');
      link_button.classList.add('tip-bottom');
    }
    if (image_button) {
      image_button.setAttribute('data-tip', 'Image');
      image_button.classList.add('qtip');
      image_button.classList.add('tip-bottom');
    }
    if (template_button) {
      template_button.insertAdjacentHTML(
        'beforeend',
        `<i class="i-icon i-template bgc-dark d-block"></i>`
      );
      template_button.setAttribute('data-tip', 'Template');
      template_button.classList.add('qtip');
      template_button.classList.add('tip-bottom');
    }
    if (emoji_button) {
      emoji_button.setAttribute('data-tip', 'Emoji');
      emoji_button.classList.add('qtip');
      emoji_button.classList.add('tip-bottom');
    }
    if (calendly_button) {
      calendly_button.insertAdjacentHTML(
        'beforeend',
        `<i class="i-icon i-calendly bgc-dark d-block"></i>`
      );
      calendly_button.setAttribute('data-tip', 'Calendly');
      calendly_button.classList.add('qtip');
      calendly_button.classList.add('tip-bottom');
    }
    if (record_button) {
      record_button.insertAdjacentHTML(
        'beforeend',
        `<i class="i-icon i-record-toolbar d-block"></i>`
      );
      record_button.setAttribute('data-tip', 'Record');
      record_button.classList.add('qtip');
      record_button.classList.add('tip-bottom');
    }
    if (attachment_button) {
      attachment_button.setAttribute('data-tip', 'Attachment');
      attachment_button.classList.add('qtip');
      attachment_button.classList.add('tip-bottom');
    }
    if (bold_button) {
      bold_button.setAttribute('data-tip', 'Bold');
      bold_button.classList.add('qtip');
      bold_button.classList.add('tip-bottom');
    }
    if (italic_button) {
      italic_button.setAttribute('data-tip', 'Italic');
      italic_button.classList.add('qtip');
      italic_button.classList.add('tip-bottom');
    }
    if (underline_button) {
      underline_button.setAttribute('data-tip', 'Underline');
      underline_button.classList.add('qtip');
      underline_button.classList.add('tip-bottom');
    }
    if (list_button) {
      list_button.setAttribute('data-tip', 'List');
      list_button.classList.add('qtip');
      list_button.classList.add('tip-bottom');
    }
    input.dataset.link = 'www.crmgrow.com';

    if (scheduler_button) {
      scheduler_button.insertAdjacentHTML(
        'beforeend',
        `<i class="i-icon i-event-note bgc-dark d-block"></i>`
      );
      scheduler_button.setAttribute('data-tip', 'Scheduler');
      scheduler_button.classList.add('qtip');
      scheduler_button.classList.add('tip-bottom');
      this.scheduleService.eventTypes$.subscribe((res) => {
        if (res.length > 0) {
          scheduler_button.classList.remove('disable');
        } else {
          scheduler_button.classList.add('disable');
        }
      });
    }
  }

  initImageHandler = (): void => {
    const imageInput: HTMLInputElement = this.Document.createElement('input');
    imageInput.type = 'file';
    imageInput.accept = 'image/*';

    imageInput.addEventListener('change', () => {
      if (imageInput.files != null && imageInput.files[0] != null) {
        const file = imageInput.files[0];
        this.fileService.attachImage(file).then((res) => {
          this.insertImageToEditor(res['url']);
        });
      }
    });
    imageInput.click();
  };

  insertImageToEditor(url: string): void {
    const range = this.quillEditorRef.getSelection();
    this.emailEditor.quillEditor.insertEmbed(range.index, `image`, url, 'user');
    this.emailEditor.quillEditor.setSelection(range.index + 1, 0, 'user');
  }

  insertEmailContentValue(value: string): void {
    this.emailEditor.quillEditor.focus();
    const range = this.emailEditor.quillEditor.getSelection();
    this.emailEditor.quillEditor.insertText(range.index, value, 'user');
    this.emailEditor.quillEditor.setSelection(
      range.index + value.length,
      0,
      'user'
    );
  }

  onChangeValue(value: string): void {
    this.valueChange.emit(value);
  }

  insertBeforeMaterials(): void {
    this.emailEditor.quillEditor.focus();
    const range = this.quillEditorRef.getSelection();
    const length = this.emailEditor.quillEditor.getLength();

    let next;
    let prev;
    let selection = 0;
    if (range && range.index) {
      const prevDelta = this.emailEditor.quillEditor.getContents(
        range.index - 1,
        1
      );
      const nextDelta = this.emailEditor.quillEditor.getContents(
        range.index,
        1
      );
      next = nextDelta.ops[0].insert;
      prev = prevDelta.ops[0].insert;
      selection = range.index;
    } else {
      const nextDelta = this.emailEditor.quillEditor.getContents(length - 1, 1);
      const prevDelta = this.emailEditor.quillEditor.getContents(length - 2, 1);
      next = (nextDelta.ops[0] && nextDelta.ops[0].insert) || '\n';
      prev = (prevDelta.ops[0] && prevDelta.ops[0].insert) || '\n';
      selection = length;
    }

    if (next === '\n' && prev === '\n') {
      return;
    } else if (next === '\n') {
      this.emailEditor.quillEditor.insertText(selection, '\n', {}, 'user');
      this.emailEditor.quillEditor.setSelection(selection + 1, 0, 'user');
      return;
    } else if (prev === '\n') {
      return;
    } else {
      this.emailEditor.quillEditor.insertText(selection, '\n', {}, 'user');
      this.emailEditor.quillEditor.setSelection(selection + 1, 0, 'user');
    }
  }

  insertAfterMaterials(): void {
    this.emailEditor.quillEditor.focus();
    const range = this.quillEditorRef.getSelection();
    const length = this.emailEditor.quillEditor.getLength();
    let selection = 0;
    if (range && range.index) {
      selection = range.index;
    } else {
      selection = length;
    }
    this.emailEditor.quillEditor.insertText(selection, '\n\n', {}, 'user');
    this.emailEditor.quillEditor.setSelection(selection + 2, 0, 'user');
  }

  insertMaterials(material: any, noTitle = false): void {
    this.emailEditor.quillEditor.focus();

    const range = this.quillEditorRef.getSelection();
    const length = this.emailEditor.quillEditor.getLength();

    let selection;
    if (!(this.stripTags.transform(this.value || '') || '').trim()) {
      selection = range.index;
      if (!noTitle) {
        this.emailEditor.quillEditor.insertText(
          selection,
          material.title + '\n',
          'bold',
          'user'
        );
        selection += material.title.length + 1;
      }
      this.emailEditor.quillEditor.insertEmbed(
        selection,
        `materialLink`,
        {
          _id: material._id,
          preview: material.preview || material.thumbnail,
          type: material.material_type
        },
        'user'
      );
      selection += 1;
      this.emailEditor.quillEditor.setSelection(selection, 0, 'user');

      this.emailEditor.quillEditor.insertText(selection, '\n\n\n', {}, 'user');
      this.emailEditor.quillEditor.setSelection(selection + 3, 0, 'user');
    } else {
      if (range && range.index) {
        selection = range.index;
        this.emailEditor.quillEditor.insertText(selection, '\n', {}, 'user');
        selection += 1;
        if (!noTitle) {
          this.emailEditor.quillEditor.insertText(
            selection,
            material.title + '\n',
            'bold',
            'user'
          );
          selection += material.title.length + 1;
        }
        this.emailEditor.quillEditor.insertEmbed(
          selection,
          `materialLink`,
          {
            _id: material._id,
            preview: material.preview || material.thumbnail,
            type: material.material_type
          },
          'user'
        );
        selection += 1;
        this.emailEditor.quillEditor.setSelection(selection, 0, 'user');
      } else {
        selection = length;
        this.emailEditor.quillEditor.insertText(selection, '\n', {}, 'user');
        selection += 1;
        if (!noTitle) {
          this.emailEditor.quillEditor.insertText(
            length,
            material.title,
            'bold',
            'user'
          );
          selection += material.title.length + 1;
        }
        this.emailEditor.quillEditor.insertEmbed(
          selection,
          `materialLink`,
          {
            _id: material._id,
            preview: material.preview || material.thumbnail,
            type: material.material_type
          },
          'user'
        );
        selection += 1;
        this.emailEditor.quillEditor.setSelection(selection, 0, 'user');
      }

      this.emailEditor.quillEditor.insertText(selection, '\n\n', {}, 'user');
      this.emailEditor.quillEditor.setSelection(selection + 2, 0, 'user');
    }
  }
  removeAttachment(index: number): void {
    this.attachments.splice(index, 1);
    this.cdr.detectChanges();
    this.attachmentChange.emit(this.attachments);
  }
  hasSameMaterial(material: Material): boolean {
    if (this.value && this.value.indexOf(`{{${material._id}}}`) !== -1) {
      return true;
    } else {
      return false;
    }
  }

  clearAttachments(): void {
    this.attachments = [];
    this.cdr.detectChanges();
    this.attachmentChange.emit(this.attachments);
  }

  onFocusEvt(): void {
    this.onFocus.emit();
  }

  closeTemplates(event: MouseEvent): void {
    const target = <HTMLElement>event.target;
    if (target.classList.contains('ql-template')) {
      return;
    }
    this.showTemplates = false;
  }

  closeCalendly(event: MouseEvent): void {
    const target = <HTMLElement>event.target;
    if (target.classList.contains('ql-calendly')) {
      return;
    }
    this.showCalendly = false;
  }
  closeScheduler(event: MouseEvent): void {
    const target = <HTMLElement>event.target;
    if (target.classList.contains('ql-scheduler')) {
      return;
    }
    this.showScheduler = false;
  }

  closeEmoji(event: MouseEvent): void {
    const target = <HTMLElement>event.target;
    if (target.classList.contains('ql-emoji')) {
      return;
    }
    this.showEmoji = false;
  }

  closeLink(event: MouseEvent): void {
    const target = <HTMLElement>event.target;
    if (target.classList.contains('ql-link')) {
      return;
    }
    this.showLink = false;
    this.isSelected = false;
  }

  selectTemplate(template: Template, emit: boolean = false): void {
    if (emit) {
      this.onChangeTemplate.emit(template);
    }
    // this.attachments = template.attachments;
    if (this.templateSelectMethod === 'insert') {
      this.insertValue(template.content + '<br>');
    } else {
      this.setValue(template.content + '<br>');
    }
    this.showTemplates = false;
  }

  selectCalendly(url: string): void {
    const data = '<a href="' + url + '">' + url + '</a>';
    this.insertValue(data + '<br>' + '<br>');
    this.showCalendly = false;
  }

  createNew(): void {
    this.templatePortal = new TemplatePortal(
      this.createNewContent,
      this._viewContainerRef
    );
    if (this.overlayRef) {
      if (this.overlayRef.hasAttached()) {
        this.overlayRef.detach();
        return;
      } else {
        this.overlayRef.attach(this.templatePortal);
        return;
      }
    } else {
      this.overlayRef = this.overlay.create({
        hasBackdrop: true,
        backdropClass: 'template-backdrop',
        panelClass: 'template-panel',
        width: '96vw',
        maxWidth: '480px'
      });
      this.overlayRef.outsidePointerEvents().subscribe((event) => {
        this.overlayRef.detach();
        return;
      });
      this.overlayRef.attach(this.templatePortal);
    }
  }

  closeOverlay(flag: boolean): void {
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef.detachBackdrop();
    }
    if (flag) {
      // this.toast.success('', 'New template is created successfully.', {
      //   closeButton: true
      // });
      setTimeout(() => {
        this.appRef.tick();
      }, 1);
    }
    this.cdr.detectChanges();
  }

  isEmpty(): boolean {
    const hasEmpty = !(this.stripTags.transform(this.value || '') || '').trim();
    if (hasEmpty) {
      if (this.value && this.value.indexOf('<img') !== -1) {
        return false;
      }
      return true;
    } else {
      return false;
    }
  }

  insertNote(data): void {
    this.emailEditor.quillEditor.insertEmbed(0, 'audioNote', data, 'user');
  }
}
// [{ font: [] }],
// [{ size: ['small', false, 'large', 'huge'] }],
// ['bold', 'italic', 'underline', 'strike'],
// [{ header: 1 }, { header: 2 }],
// [{ color: [] }, { background: [] }],
// [{ list: 'ordered' }, { list: 'bullet' }],
// [{ align: [] }],
// ['link', 'image']
