import { DOCUMENT } from '@angular/common';
import {
  Component,
  Inject,
  Input,
  OnInit,
  Output,
  ViewChild,
  EventEmitter,
  ChangeDetectorRef,
  ElementRef
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { QuillEditorComponent } from 'ngx-quill';
import { Subscription } from 'rxjs';
import { Template } from 'src/app/models/template.model';
import { FileService } from 'src/app/services/file.service';
import { TemplatesService } from 'src/app/services/templates.service';
import * as QuillNamespace from 'quill';
import { UserService } from '../../services/user.service';
const Quill: any = QuillNamespace;
const Delta = Quill.import('delta');
const Parchment = Quill.import('parchment');
const ImageBlot = Quill.import('formats/image');
@Component({
  selector: 'app-template-create',
  templateUrl: './template-create.component.html',
  styleUrls: ['./template-create.component.scss']
})
export class TemplateCreateComponent implements OnInit {
  template: Template = new Template();
  isSaving: boolean = false;
  saveSubscription: Subscription;

  placeholder: string = '';
  style: any = { height: '200px' };
  class = '';
  hasToken: boolean = false;
  required: boolean = false;

  cursor: number = 0;
  submitted = false;

  @Input() value: string = '';
  @Input() type: string = 'email';
  @Output() valueChange: EventEmitter<string> = new EventEmitter();
  @Output() onClose: EventEmitter<boolean> = new EventEmitter();
  @ViewChild('messageText') textAreaEl: ElementRef;
  cursorStart = 0;
  cursorEnd = 0;

  editorForm: FormControl = new FormControl();
  @ViewChild('emailEditor') emailEditor: QuillEditorComponent;
  quillEditorRef;
  config = {
    toolbar: {
      container: [
        ['bold', 'italic', 'underline'],
        [{ list: 'bullet' }],
        ['link', 'image']
      ]
    },
    blotFormatter: {}
  };

  isShowTokens = false;

  constructor(
    private fileService: FileService,
    public templateService: TemplatesService,
    private userService: UserService,
    @Inject(DOCUMENT) private document: Document,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  setValue(value: string): void {
    if (value && this.quillEditorRef && this.quillEditorRef.clipboard) {
      const delta = this.quillEditorRef.clipboard.convert({ html: value });
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
  }

  initImageHandler = (): void => {
    const imageInput: HTMLInputElement = this.document.createElement('input');
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

  close(): void {
    this.onClose.emit(false);
  }

  onChangeValue(value: string): void {
    this.value = value.toString();
  }

  saveTemplate(): void {
    this.template.content = this.value;
    this.template.type = this.type;
    this.isSaving = true;
    this.cdr.detectChanges();
    this.saveSubscription && this.saveSubscription.unsubscribe();
    this.saveSubscription = this.templateService
      .create(this.template)
      .subscribe((template) => {
        this.isSaving = false;
        this.cdr.detectChanges();
        if (template) {
          this.templateService.create$(template);
          this.onClose.emit(true);
        }
      });
  }

  insertEmailContentValue(value: string): void {
    if (this.type === 'email') {
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
    } else {
      this.textAreaEl.nativeElement.focus();
      this.textAreaEl.nativeElement.setSelectionRange(
        this.cursorStart,
        this.cursorEnd
      );
      document.execCommand('insertText', false, value);
      this.cursorStart += value.length;
      this.cursorEnd = this.cursorStart;
      this.textAreaEl.nativeElement.setSelectionRange(
        this.cursorStart,
        this.cursorEnd
      );
    }
  }

  keepCursor(field): void {
    if (field.selectionStart || field.selectionStart === '0') {
      this.cursor = field.selectionStart;
    }
  }

  insertEmailSubjectValue(value: string): void {
    let text = this.template.subject;
    text =
      text.substr(0, this.cursor) +
      value +
      text.substr(this.cursor, text.length - this.cursor);
    this.template.subject = text;
  }

  setCursorPos(field): void {
    if (field.selectionStart || field.selectionStart === '0') {
      this.cursorStart = field.selectionStart;
    }
    if (field.selectionEnd || field.selectionEnd === '0') {
      this.cursorEnd = field.selectionEnd;
    }
  }
}
