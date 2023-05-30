import {
  Component,
  OnInit,
  ViewChild,
  OnDestroy,
  ElementRef,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { TemplatesService } from 'src/app/services/templates.service';
import { HtmlEditorComponent } from 'src/app/components/html-editor/html-editor.component';
import { Template } from 'src/app/models/template.model';
import { PageCanDeactivate } from '../../variables/abstractors';
import { ToastrService } from 'ngx-toastr';
import { HandlerService } from 'src/app/services/handler.service';
import { ROUTE_PAGE } from 'src/app/constants/variable.constants';
import { Garbage } from 'src/app/models/garbage.model';
import { UserService } from 'src/app/services/user.service';
import { ConnectService } from 'src/app/services/connect.service';
import { HelperService } from 'src/app/services/helper.service';
import { isEmptyHtml } from 'src/app/utils/functions';
import { MatDialog } from '@angular/material/dialog';
import { MaterialBrowserComponent } from 'src/app/components/material-browser/material-browser.component';
import * as _ from 'lodash';
import { User } from 'src/app/models/user.model';
import { environment } from 'src/environments/environment';
import { StoreService } from 'src/app/services/store.service';
import { ConfirmComponent } from 'src/app/components/confirm/confirm.component';

@Component({
  selector: 'app-template',
  templateUrl: './template.component.html',
  styleUrls: ['./template.component.scss']
})
export class TemplateComponent
  extends PageCanDeactivate
  implements OnInit, OnDestroy {
  saved = true;
  id: string = ''; // template id for loading
  mode: string = 'new'; // template edit mode: 'new' | 'edit' | 'inline-edit'
  template: Template = new Template();

  materials = []; // selected materials data (object array)
  template_title = ''; // template title
  ownerId = ''; // template owner

  isLoading = false;
  isSaving = false;
  downloading = false;

  cursorStart = 0;
  cursorEnd = 0;
  focusedField = '';

  isCalendly = false;

  garbage: Garbage = new Garbage();
  user: User = new User();

  loadSubscription: Subscription;
  saveSubscription: Subscription;
  garbageSubscription: Subscription;
  profileSubscription: Subscription;
  routeSubscription: Subscription;

  videos = [];
  pdfs = [];
  images = [];

  @ViewChild('editor') htmlEditor: HtmlEditorComponent;
  @ViewChild('subjectField') subjectEl: ElementRef;
  @ViewChild('smsContentField') textAreaEl: ElementRef;

  @Input('inline') inline = false;
  @Input()
  public set initMode(val: string) {
    this.mode = val || 'new';
  }
  @Input()
  public set initId(val: string) {
    if (val) {
      this.id = val;
    }
  }
  @Input()
  public set initTemplate(val: any) {
    if (val) {
      this.template = new Template().deserialize(val);
      if (this.template.type === 'text') {
        if (this.template.video_ids && this.template.video_ids.length) {
          this.template.video_ids.forEach((video) => {
            this.template.content = this.template.content.replace(
              '{{' + video + '}}',
              environment.website + '/video?video=' + video
            );
          });
        }
        if (this.template.pdf_ids && this.template.pdf_ids.length) {
          this.template.pdf_ids.forEach((pdf) => {
            this.template.content = this.template.content.replace(
              '{{' + pdf + '}}',
              environment.website + '/pdf?pdf=' + pdf
            );
          });
        }
        if (this.template.image_ids && this.template.image_ids.length) {
          this.template.image_ids.forEach((image) => {
            this.template.content = this.template.content.replace(
              '{{' + image + '}}',
              environment.website + '/image?image=' + image
            );
          });
        }
      }
    }
  }
  @Input('wrapperClass') wrapperClass = '';
  @Output() onClosePage = new EventEmitter();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private toastr: ToastrService,
    public templatesService: TemplatesService,
    public connectService: ConnectService,
    private userService: UserService,
    public storeService: StoreService,
    private handlerService: HandlerService,
    private helperService: HelperService
  ) {
    super();

    this.templatesService.loadAll(false);

    // Load the garbage for the calendly checking
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.garbageSubscription = this.userService.garbage$.subscribe((res) => {
      this.garbage = res;
      if (this.garbage?.calendly) {
        this.isCalendly = true;
        this.connectService.loadCalendlyAll(false);
      } else {
        this.isCalendly = false;
      }
    });

    // Profile Loading Subscription
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile._id) {
          this.user = profile;
        }
      }
    );
  }

  ngOnInit(): void {
    this.routeSubscription && this.routeSubscription.unsubscribe();
    this.routeSubscription = this.route.params.subscribe((params) => {
      if (!this.inline) {
        this.id = params['id'];
        this.mode = params['mode'] || 'new';
      }
      if (this.id) {
        this.loadData(this.id);
      }
      window['confirmReload'] = true;
    });
  }

  ngOnDestroy(): void {
    window['confirmReload'] = false;
    this.routeSubscription && this.routeSubscription.unsubscribe();
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
  }

  /**
   * Change the template type
   * @param type: Change the template type
   */
  changeType(type: string): void {
    this.template.type = type;
    this.saved = false;
  }

  saveTemplate(): void {
    if (isEmptyHtml(this.template.content)) {
      return;
    }

    if (this.template.type === 'text') {
      const { videoIds, imageIds, pdfIds } = this.getMaterials();

      this.template.video_ids = [];
      this.template.pdf_ids = [];
      this.template.image_ids = [];
      let saveContent = this.template.content;
      videoIds.forEach((video) => {
        saveContent = saveContent.replace(
          environment.website + '/video?video=' + video,
          '{{' + video + '}}'
        );
        this.template.video_ids.push(video);
      });
      pdfIds.forEach((pdf) => {
        saveContent = saveContent.replace(
          environment.website + '/pdf?pdf=' + pdf,
          '{{' + pdf + '}}'
        );
        this.template.pdf_ids.push(pdf);
      });
      imageIds.forEach((image) => {
        saveContent = saveContent.replace(
          environment.website + '/image?image=' + image,
          '{{' + image + '}}'
        );
        this.template.image_ids.push(image);
      });
      this.template.content = saveContent;
    } else if (this.template.type === 'email') {
      const { videoIds, imageIds, pdfIds } = this.getMaterialsFromEmail();
      this.template.video_ids = videoIds;
      this.template.pdf_ids = pdfIds;
      this.template.image_ids = imageIds;
    }

    if (this.mode === 'inline-edit') {
      this.onClosePage.emit(this.template);
      return;
    }

    if (this.mode === 'edit') {
      this.template.title = this.template_title;
      const template = { ...this.template, _id: undefined };
      this.isSaving = true;
      this.saveSubscription && this.saveSubscription.unsubscribe();
      this.saveSubscription = this.templatesService
        .update(this.id, template)
        .subscribe(
          () => {
            if (this.inline) {
              this.onClosePage.emit(this.template);
            } else {
              this.router.navigate(['/templates-list/own']);
              this.isSaving = false;
              this.saved = true;
            }
          },
          () => {
            this.isSaving = false;
          }
        );
    } else {
      // Create
      this.route.queryParams.subscribe((params) => {
        const folderId = params['folder'];
        this.template.title = this.template_title;
        if (folderId && folderId !== 'root') {
          this.template.folder = folderId;
        }
        this.isSaving = true;
        this.saveSubscription && this.saveSubscription.unsubscribe();
        this.saveSubscription = this.templatesService
          .create(this.template)
          .subscribe(
            () => {
              if (this.inline) {
                this.onClosePage.emit(this.template);
              } else {
                this.router.navigate([
                  '/templates-list/own/' + (folderId || 'root')
                ]);
                this.isSaving = false;
                this.saved = true;
              }
            },
            () => {
              this.isSaving = false;
            }
          );
      });
    }
  }

  loadData(id: string): void {
    this.isLoading = true;
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.templatesService.read(id).subscribe(
      (res) => {
        this.isLoading = false;
        this.template.deserialize(res);
        this.ownerId = this.template.user;

        this.videos = res.video_ids;
        this.pdfs = res.pdf_ids;
        this.images = res.image_ids;
        // Correction of the some content
        const videoIds = [];
        const pdfIds = [];
        const imageIds = [];
        const materials = {};
        (res.video_ids || []).forEach((e) => {
          if (!e) {
            return;
          }
          if (e['_id']) {
            videoIds.push(e?.['_id']);
            materials[e['_id']] = e;
            materials[e['_id']]['material_type'] = 'video';
          }
        });
        (res.pdf_ids || []).forEach((e) => {
          if (!e) {
            return;
          }
          if (e['_id']) {
            pdfIds.push(e?.['_id']);
            materials[e['_id']] = e;
            materials[e['_id']]['material_type'] = 'pdf';
          }
        });
        (res.image_ids || []).forEach((e) => {
          if (!e) {
            return;
          }
          if (e['_id']) {
            imageIds.push(e?.['_id']);
            materials[e['_id']] = e;
            materials[e['_id']]['material_type'] = 'image';
          }
        });

        this.template.video_ids = videoIds;
        this.template.image_ids = imageIds;
        this.template.pdf_ids = pdfIds;

        this.template_title = this.template.title;
        if (this.template.type === 'email') {
          this.htmlEditor.setValue(this.template.content, materials);
        } else {
          if (this.template.video_ids && this.template.video_ids.length) {
            this.template.video_ids.forEach((video) => {
              this.template.content = this.template.content.replace(
                '{{' + video + '}}',
                environment.website + '/video?video=' + video
              );
            });
          }
          if (this.template.pdf_ids && this.template.pdf_ids.length) {
            this.template.pdf_ids.forEach((pdf) => {
              this.template.content = this.template.content.replace(
                '{{' + pdf + '}}',
                environment.website + '/pdf?pdf=' + pdf
              );
            });
          }
          if (this.template.image_ids && this.template.image_ids.length) {
            this.template.image_ids.forEach((image) => {
              this.template.content = this.template.content.replace(
                '{{' + image + '}}',
                environment.website + '/image?image=' + image
              );
            });
          }
        }
        if (this.mode == 'new' && !!this.id) {
          this.template_title = '';
        }
      },
      () => (this.isLoading = false)
    );
  }

  /**=======================================================
   *
   * Subject Field
   *
   ========================================================*/
  setCursorPos(field, field_name: string): void {
    this.focusedField = field_name;
    if (field.selectionStart || field.selectionStart === '0') {
      this.cursorStart = field.selectionStart;
    }
    if (field.selectionEnd || field.selectionEnd === '0') {
      this.cursorEnd = field.selectionEnd;
    }
  }

  insertSubjectValue(value: string): void {
    this.subjectEl.nativeElement.focus();
    this.subjectEl.nativeElement.setSelectionRange(
      this.cursorStart,
      this.cursorEnd
    );
    document.execCommand('insertText', false, value);
    this.cursorStart += value.length;
    this.cursorEnd = this.cursorStart;
    this.subjectEl.nativeElement.setSelectionRange(
      this.cursorStart,
      this.cursorEnd
    );
  }

  insertValue(value: string): void {
    const field = this.textAreaEl.nativeElement;
    field.focus();
    let cursorStart = this.template.content.length;
    let cursorEnd = this.template.content.length;
    if (field.selectionStart || field.selectionStart === '0') {
      cursorStart = field.selectionStart;
    }
    if (field.selectionEnd || field.selectionEnd === '0') {
      cursorEnd = field.selectionEnd;
    }
    field.setSelectionRange(cursorStart, cursorEnd);
    document.execCommand('insertText', false, value);
    cursorStart += value.length;
    cursorEnd = cursorStart;
    field.setSelectionRange(cursorStart, cursorEnd);
    this.saved = false;
  }

  insertEmailValue(value: string): void {
    this.htmlEditor.insertEmailContentValue(value);
  }

  focusEditor(): void {
    this.focusedField = 'editor';
  }

  stateChanged(): void {
    this.saved = false;
  }

  /**
   * Go Back page (or close the inline editor)
   */
  goToBack(): void {
    if (!this.inline) {
      this.handlerService.goBack('/templates-list');
    } else {
      this.onClosePage.emit();
    }
  }

  /**
   * Returns the prev page name
   * @returns: string
   */
  getPrevPage(): string {
    if (this.inline) {
      return 'to Campaign Page';
    }
    if (!this.handlerService.previousUrl) {
      return 'to Templates';
    }
    if (
      this.handlerService.previousUrl.includes('/team/') &&
      this.handlerService.previousUrl.includes('/templates')
    ) {
      return 'to Team Templates';
    }
    for (const route in ROUTE_PAGE) {
      if (this.handlerService.previousUrl === route) {
        return 'to ' + ROUTE_PAGE[route];
      }
    }
    return 'to Templates';
  }

  /**
   * Add the attachments to the template data
   * @param attachments : attachments
   */
  onAttachmentChange(attachments: any[]): void {
    this.saved = false;
    this.template.attachments = attachments;
  }

  /**
   * Open the material browser and handling close event
   * @param type: email | text
   */
  openMaterialsDlg(type: string): void {
    if (type == 'email') {
      const content = this.template.content;
      const materials = this.helperService.getMaterials(content);
      this.dialog
        .open(MaterialBrowserComponent, {
          width: '98vw',
          maxWidth: '940px',
          data: {
            hideMaterials: materials,
            title: 'Insert material',
            multiple: true,
            onlyMine: true
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res && res.materials) {
            this.saved = false;
            this.materials = _.intersectionBy(this.materials, materials, '_id');
            this.materials = [...this.materials, ...res.materials];
            this.htmlEditor.insertBeforeMaterials();
            for (let i = 0; i < res.materials.length; i++) {
              const material = res.materials[i];
              this.htmlEditor.insertMaterials(material);
            }
          }
        });
    } else {
      const { videoIds, imageIds, pdfIds } = this.getMaterials();
      const selectedMaterials = [...videoIds, ...imageIds, ...pdfIds].map(
        (e) => {
          return { _id: e };
        }
      );
      this.dialog
        .open(MaterialBrowserComponent, {
          width: '98vw',
          maxWidth: '940px',
          data: {
            title: 'Insert material',
            multiple: true,
            hideMaterials: selectedMaterials,
            onlyMine: true
          }
        })
        .afterClosed()
        .subscribe((res) => {
          this.saved = false;
          if (res && res.materials && res.materials.length) {
            res.materials.forEach((e, index) => {
              let url;
              switch (e.material_type) {
                case 'video':
                  url = `${environment.website}/video?video=${e._id}`;
                  break;
                case 'pdf':
                  url = `${environment.website}/pdf?pdf=${e._id}`;
                  break;
                case 'image':
                  url = `${environment.website}/image?image=${e._id}`;
                  break;
              }
              // first element insert
              if (
                index === 0 &&
                (!this.template.content ||
                  this.template.content.slice(-1) === '\n')
              ) {
                this.template.content = this.template.content + '\n' + url;
                return;
              }
              if (index === 0) {
                this.template.content = this.template.content + '\n\n' + url;
                return;
              }
              this.template.content = this.template.content + '\n' + url;

              if (index === res.materials.length - 1) {
                this.template.content += '\n';
              }
            });
          }
        });
    }
  }

  /**
   * Returns the material ids that is used in the text template content
   * @returns: {videoIds, pdfIds, imageIds}
   */
  getMaterials(): any {
    const videoIds = [];
    const pdfIds = [];
    const imageIds = [];

    const videoReg = new RegExp(
      environment.website + '/video[?]video=\\w+',
      'g'
    );
    const pdfReg = new RegExp(environment.website + '/pdf[?]pdf=\\w+', 'g');
    const imageReg = new RegExp(
      environment.website + '/image[?]image=\\w+',
      'g'
    );

    let matches = this.template.content.match(videoReg);
    if (matches && matches.length) {
      matches.forEach((e) => {
        const videoId = e.replace(environment.website + '/video?video=', '');
        videoIds.push(videoId);
      });
    }
    matches = this.template.content.match(pdfReg);
    if (matches && matches.length) {
      matches.forEach((e) => {
        const pdfId = e.replace(environment.website + '/pdf?pdf=', '');
        pdfIds.push(pdfId);
      });
    }
    matches = this.template.content.match(imageReg);
    if (matches && matches.length) {
      matches.forEach((e) => {
        const imageId = e.replace(environment.website + '/image?image=', '');
        imageIds.push(imageId);
      });
    }

    return {
      videoIds,
      imageIds,
      pdfIds
    };
  }

  /**
   * Returns the material ids that is used in the email template content
   * @returns: {videoIds, pdfIds, imageIds}
   */
  getMaterialsFromEmail(): any {
    if (this.htmlEditor?.emailEditor?.quillEditor?.editor?.delta?.ops) {
      const videoIds = [];
      const pdfIds = [];
      const imageIds = [];
      this.htmlEditor?.emailEditor?.quillEditor?.editor?.delta?.ops.forEach(
        (e) => {
          if (e.insert?.materialLink) {
            const material_type =
              e.insert?.materialLink?.material_type || 'video';
            switch (material_type) {
              case 'video':
                videoIds.push(e.insert?.materialLink?._id);
                break;
              case 'pdf':
                pdfIds.push(e.insert?.materialLink?._id);
                break;
              case 'image':
                imageIds.push(e.insert?.materialLink?._id);
                break;
            }
          }
        }
      );
      return {
        videoIds,
        pdfIds,
        imageIds
      };
    } else {
      return {
        videoIds: [],
        imageIds: [],
        pdfIds: []
      };
    }
  }

  /**
   * insert the calendly event link for the text template content
   * @param url: calendly event link address
   * @returns: void
   */
  selectCalendly(url: string): void {
    this.saved = false;
    this.textAreaEl.nativeElement.focus();
    const field = this.textAreaEl.nativeElement;
    if (!this.template.content.replace(/(\r\n|\n|\r|\s)/gm, '')) {
      field.select();
      document.execCommand('insertText', false, url);
      return;
    }
    if (field.selectionEnd || field.selectionEnd === 0) {
      if (this.template.content[field.selectionEnd - 1] === '\n') {
        document.execCommand('insertText', false, url);
      } else {
        document.execCommand('insertText', false, '\n' + url);
      }
    } else {
      if (this.template.content.slice(-1) === '\n') {
        document.execCommand('insertText', false, url);
      } else {
        document.execCommand('insertText', false, '\n' + url);
      }
    }
  }

  downloadTemplate(element: Template): void {
    const templates = this.templatesService.templates.getValue();
    const existing = templates.some(
      (e) => e.original_id && e.original_id == element._id
    );
    if (existing) {
      this.dialog
        .open(ConfirmComponent, {
          position: { top: '100px' },
          data: {
            title: 'Download Template',
            message: 'Are you sure to download this template again?',
            confirmLabel: 'Yes',
            cancelLabel: 'No'
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            this._downloadTemplate(element);
          }
        });
    } else {
      this._downloadTemplate(element);
    }
  }

  _downloadTemplate(element: Template): void {
    let curElement = JSON.parse(
      JSON.stringify({ ...element, original_id: element._id })
    );
    curElement = _.omit(curElement, ['_id', 'role', 'company']);
    const imageNames = _.uniqBy(this.images, 'title');
    const videoNames = _.uniqBy(this.videos, 'title');
    const pdfNames = _.uniqBy(this.pdfs, 'title');
    if (
      videoNames.length == 0 &&
      imageNames.length == 0 &&
      pdfNames.length == 0
    ) {
      this.templatesService.createTemplate(curElement).subscribe((res) => {
        if (res) {
          this.templatesService.loadOwn(true);
          if (!this.user.onboard.template_download) {
            this.user.onboard.template_download = true;
            this.userService
              .updateProfile({ onboard: this.user.onboard })
              .subscribe(() => {
                this.userService.updateProfileImpl({
                  onboard: this.user.onboard
                });
              });
          }
        }
      });
    } else {
      this.dialog
        .open(ConfirmComponent, {
          maxWidth: '400px',
          width: '96vw',
          position: { top: '100px' },
          data: {
            title: 'Download Template',
            message: 'Are you sure to download these ones?',
            videos: videoNames,
            images: imageNames,
            pdfs: pdfNames,
            confirmLabel: 'Yes',
            cancelLabel: 'No'
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            this.downloading = true;
            this.templatesService
              .createTemplate(curElement)
              .subscribe((res) => {
                if (res) {
                  this.templatesService.loadOwn(true);
                  if (!this.user.onboard.template_download) {
                    this.user.onboard.template_download = true;
                    this.userService
                      .updateProfile({ onboard: this.user.onboard })
                      .subscribe(() => {
                        this.userService.updateProfileImpl({
                          onboard: this.user.onboard
                        });
                      });
                  }
                  this.downloading = false;
                }
              });
          }
        });
    }
  }

  onClose(): void {
    if (this.inline) {
      this.onClosePage.emit();
    }
  }
}
