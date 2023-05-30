import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import { Location } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { EmailEditorComponent } from 'angular-email-editor';
import html2canvas from 'html2canvas';
import { ToastrService } from 'ngx-toastr';
import { ImportTemplatesComponent } from 'src/app/components/import-templates/import-templates.component';
import { UnlayerThemeId } from 'src/app/constants/variable.constants';
import { MaterialService } from 'src/app/services/material.service';
import { StoreService } from 'src/app/services/store.service';
import { ThemeService } from 'src/app/services/theme.service';
import { PageCanDeactivate } from 'src/app/variables/abstractors';
import * as _ from 'lodash';
import { BehaviorSubject } from 'rxjs';
@Component({
  selector: 'app-newsletter-editor',
  templateUrl: './newsletter-editor.component.html',
  styleUrls: ['./newsletter-editor.component.scss']
})
export class NewsletterEditorComponent
  extends PageCanDeactivate
  implements OnInit {
  saved: boolean = true;

  options = {
    projectId: UnlayerThemeId,
    templateId: undefined,
    customJS: ['https://ecsbe.crmgrow.com/customTool/crmgrow-material.js'],
    displayMode: 'web',
    tools: {
      'custom#my_tool': {
        properties: {
          materialField: {
            editor: {
              data: {
                options: []
              }
            }
          }
        }
      },
      'custom#material_area': {
        usageLimit: 1
      }
    },
    mergeTagsConfig: {
      autocompleteTriggerChar: '{'
    },
    mergeTags: {
      user_name: {
        name: 'User Name',
        value: '{user_name}'
      },
      user_email: {
        name: 'User Email',
        value: '{user_email}'
      },
      user_phone: {
        name: 'User Phone',
        value: '{user_phone}'
      },
      user_company: {
        name: 'User Company',
        value: '{user_company}'
      },
      contact_first_name: {
        name: 'Contact First Name',
        value: '{contact_first_name}'
      },
      contact_last_name: {
        name: 'Contact Last Name',
        value: '{contact_last_name}'
      },
      contact_email: {
        name: 'Contact Email',
        value: '{contact_email}'
      },
      contact_phone: {
        name: 'Contact Phone',
        value: '{contact_phone}'
      }
    }
  };
  materialLinks = [];
  materials = [];
  theme = {
    _id: '',
    thumbnail: '',
    title: '',
    subject: '',
    type: 'newsletter',
    user: '',
    role: '',
    project_id: UnlayerThemeId,
    template_id: ''
  };
  isLoading = false;
  isSaving = false;
  json_content = {};
  html_content = '';
  cursorStart = 0;
  cursorEnd = 0;
  themeId: string = '';
  @ViewChild('subjectField') subjectEl: ElementRef;
  @ViewChild('editor') emailEditor: EmailEditorComponent;

  @Input('inline') inline = false;
  @Input('hasMode') mode = 'create';
  @Input()
  public set hasId(val: string) {
    if (val) {
      this.themeId = val;
    }
  }
  @Output() onClosePage = new EventEmitter();

  loadStatus: BehaviorSubject<any> = new BehaviorSubject(null);
  loadStatus$ = this.loadStatus.asObservable();

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private themeService: ThemeService,
    private materialService: MaterialService,
    private storeService: StoreService,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef,
    private toastr: ToastrService,
    private dialog: MatDialog
  ) {
    super();
  }

  ngOnInit(): void {
    if (!this.inline) {
      this.mode = this.route.snapshot.params['mode'] || 'create';
      const id = this.route.snapshot.params['id'];

      if (id) {
        this.themeId = id;
      }
    }
    this.isLoading = true;
    if (this.themeId) {
      this.loadTheme(this.themeId);
      // Update theme
      this.loadStatus$.subscribe((res) => {
        if (res && !res['theme'] && !res['materials']) {
          this.isLoading = false;
        }
      });
    } else {
      this.loadStatus$.subscribe((res) => {
        if (res && !res['materials']) {
          this.isLoading = false;
        }
      });
    }
    this.loadMaterials();
  }

  updateLoadingStatus(dataName: string, status: boolean): void {
    const loadStatus = this.loadStatus.getValue() || {};
    loadStatus[dataName] = status;
    this.loadStatus.next(loadStatus);
  }

  loadMaterials(): void {
    this.updateLoadingStatus('materials', true);
    this.materialService.loadMaterial();
    this.storeService.materials$.subscribe((res) => {
      if (res && res.length) {
        let materials = [];
        res.forEach((e) => {
          if (e.material_type !== 'folder') {
            materials.push(e);
          }
        });
        materials = _.uniqBy(materials, '_id');
        materials.sort((a, b) => {
          const aPrior = a.priority || 10000;
          const bPrior = b.priority || 10000;
          if (aPrior < bPrior) {
            return -1;
          }
          return 0;
        });
        this.options.tools[
          'custom#my_tool'
        ].properties.materialField.editor.data.options = materials;
        this.options.tools['custom#my_tool']['data'] = materials[0];
        const materialJson = {};
        materials.forEach((e) => {
          materialJson[e._id] = e;
        });
        const command =
          'var materialJson = ' + JSON.stringify(materialJson) + ';';
        this.options.customJS.unshift(command);

        this.materials = materials;
        const videosLinks = [];
        const imagesLinks = [];
        const pdfsLinks = [];
        materials.forEach((e) => {
          if (e.material_type === 'video') {
            videosLinks.push({
              name: e.title,
              href: `{{material-object:${e._id}}}`,
              target: '_blank'
            });
          } else if (e.material_type === 'pdf') {
            pdfsLinks.push({
              name: e.title,
              href: `{{material-object:${e._id}}}`,
              target: '_blank'
            });
          } else if (e.material_type === 'image') {
            imagesLinks.push({
              name: e.title,
              href: `{{material-object:${e._id}}}`,
              target: '_blank'
            });
          }
        });
        this.materialLinks = [
          {
            name: 'crmgrow Videos',
            specialLinks: videosLinks
          },
          {
            name: 'crmgrow PDFs',
            specialLinks: pdfsLinks
          },
          {
            name: 'crmgrow Images',
            specialLinks: imagesLinks
          }
        ];
        this.options['specialLinks'] = this.materialLinks;
      }
      this.updateLoadingStatus('materials', false);
    });
  }

  loadTheme(id: string): void {
    this.updateLoadingStatus('theme', true);
    this.themeService.getTheme(id).subscribe((res) => {
      if (res['data']) {
        this.theme = res['data'];
        this.options.templateId = res['data'].template_id;
        this.json_content = res['data'].json_content;
        this.html_content = res['data'].html_content;
        if (this.mode === 'clone') {
          this.theme.title = '';
          this.theme.subject = '';
        }
        this.changeDetectorRef.detectChanges();
      }
      this.updateLoadingStatus('theme', false);
    });
  }

  loadTemplate(slug: string): void {
    this.isLoading = true;
    this.themeService.getTemplate(slug).subscribe((res) => {
      this.isLoading = false;
      if (
        res &&
        res['data'] &&
        res['data']['StockTemplate'] &&
        res['data']['StockTemplate']['StockTemplatePages'] &&
        res['data']['StockTemplate']['StockTemplatePages'][0]
      ) {
        this.json_content =
          res['data']['StockTemplate']['StockTemplatePages'][0]['design'];
        this.html_content =
          res['data']['StockTemplate']['StockTemplatePages'][0]['html'];
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  editorLoaded(event: any): void {
    console.log('this.json content', this.json_content, this.materialLinks);
    if (this.theme.role !== 'admin') {
      setTimeout(() => {
        if (this.options.templateId === undefined && this.html_content === '')
          return;

        this.emailEditor &&
          this.emailEditor.editor.loadDesign(this.json_content);
      }, 3000);
    }
  }

  saveDesign() {
    this.isSaving = true;
    this.emailEditor.editor.exportHtml(
      (async (data) => {
        this.json_content = data.design;
        const stringWidth = this.json_content['body'].values.contentWidth;
        const contentWidth = Number(
          stringWidth.substr(0, stringWidth.length - 2)
        );
        const contentHeight = (contentWidth * 24) / 16;
        this.html_content = data.html;
        const el = document.querySelector('#preview-thumbnail') as HTMLElement;
        el.style.width = String(contentWidth) + 'px';
        el.style.height = String(contentHeight) + 'px';
        el.style.overflow = 'hidden';
        el.innerHTML = this.html_content;
        const canvas = await html2canvas(el);
        const imgData = canvas.toDataURL();

        // Materials Information Collect
        let materials = this.getMaterials(this.html_content);
        materials = _.uniq(materials);
        const videos = this.materials.filter((e) => {
          return e.material_type === 'video' && materials.indexOf(e._id) !== -1;
        });
        const images = this.materials.filter((e) => {
          return e.material_type === 'image' && materials.indexOf(e._id) !== -1;
        });
        const pdfs = this.materials.filter((e) => {
          return e.material_type === 'pdf' && materials.indexOf(e._id) !== -1;
        });
        console.log('materials', materials);
        const videoIds = videos.map((e) => e._id);
        const pdfIds = pdfs.map((e) => e._id);
        const imageIds = images.map((e) => e._id);

        const themeData = {
          title: this.theme.title,
          subject: this.theme.subject,
          json_content: JSON.stringify(this.json_content),
          html_content: this.html_content,
          thumbnail: imgData,
          type: 'newsletter',
          videos: videoIds,
          pdfs: pdfIds,
          images: imageIds
        };
        if (this.mode == 'edit') {
          this.themeService
            .updateTheme(this.theme._id, themeData)
            .subscribe((res) => {
              if (res['status'] == true) {
                if (!this.inline) {
                  this.isSaving = false;
                  this.json_content = {};
                  this.html_content = '';
                } else {
                  this.onClosePage.emit({ ...themeData, _id: this.theme._id });
                }
                // this.toastr.success('Theme Saved Successfully');
              }
            });
        } else {
          this.themeService.saveTheme(themeData).subscribe((res) => {
            if (res['status'] == true) {
              this.isSaving = false;
              this.json_content = {};
              this.html_content = '';
              // this.toastr.success('Theme Saved Successfully');
              if (!this.inline) {
                if (res.data && res.data._id) {
                  this.location.replaceState(
                    '/newsletter/edit/' + res.data._id
                  );
                  this.mode = 'edit';
                  this.theme._id = res.data._id;
                } else {
                  this.location.back();
                }
              } else {
                this.onClosePage.next(res['data']);
              }
            }
          });
        }
      }).bind(this)
    );
  }

  importDialog(): void {
    this.dialog
      .open(ImportTemplatesComponent, {
        width: '98vw',
        maxWidth: '800px',
        height: 'calc(65vh + 48px)'
      })
      .afterClosed()
      .subscribe((template) => {
        if (template && template.slug) {
          this.loadTemplate(template.slug);
        }
      });
  }

  goToBack(): void {
    if (!this.inline) {
      this.location.back();
    } else {
      this.onClosePage.next();
    }
  }

  getMaterials(html: string): any {
    const dom = document.createElement('div');
    const materials = [];
    dom.innerHTML = html;
    const materialDoms = dom.querySelectorAll('.material-object');
    materialDoms.forEach((e) => {
      const materialDom = <HTMLLinkElement>e;
      let href = materialDom.getAttribute('href');
      href = href.replace('{{', '');
      href = href.replace('}}', '');
      const material = href;
      materials.push(material);
    });

    const materialLinks = document.querySelectorAll(
      'a[href*="{{material-object:"]'
    );
    materialLinks.forEach((e) => {
      const materialDom = <HTMLLinkElement>e;
      let href = materialDom.getAttribute('href');
      href = href.replace('{{material-object:', '');
      href = href.replace('}}', '');
      const material = href;
      materials.push(material);
    });
    return materials;
  }

  setCursorPos(field): void {
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
}
