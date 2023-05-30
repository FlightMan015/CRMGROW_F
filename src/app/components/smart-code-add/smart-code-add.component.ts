import {
  Component,
  Inject,
  OnInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { Automation } from 'src/app/models/automation.model';
import { Garbage } from 'src/app/models/garbage.model';
import { SmartCode } from 'src/app/models/smart-code.model';
import { AutomationService } from 'src/app/services/automation.service';
import { UserService } from 'src/app/services/user.service';
import { ConfirmComponent } from '../confirm/confirm.component';
import { environment } from 'src/environments/environment';
import { MaterialBrowserComponent } from '../material-browser/material-browser.component';

@Component({
  selector: 'app-smart-code-add',
  templateUrl: './smart-code-add.component.html',
  styleUrls: ['./smart-code-add.component.scss']
})
export class SmartCodeAddComponent implements OnInit {
  updateGarbageSubscription: Subscription;

  garbage: Garbage;
  originalCode = '';

  smartCode: SmartCode = new SmartCode();
  tags: string[] = [];
  creating = false;

  isNew = true;
  isValidCode = true;
  codeErrorMsg = '';
  selectedAutomation: Automation;
  automations: Automation[] = [];
  set = 'twitter';
  @ViewChild('messageText') messageText: ElementRef;

  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<SmartCodeAddComponent>,
    private userService: UserService,
    private automationService: AutomationService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.automationService.loadAll(false);
    this.automations = this.automationService.automations.getValue();
    if (this.data && this.data.garbage) {
      this.garbage = new Garbage().deserialize(this.data.garbage);
      if (!this.garbage.smart_codes) {
        this.garbage.smart_codes = {};
      }

      if (this.data.smartCode) {
        this.isNew = false;
        this.originalCode = this.data.smartCode.code;
        this.smartCode.deserialize(this.data.smartCode);
        if (this.smartCode.tag) {
          this.tags = this.smartCode.tags;
        }
        if (this.smartCode.automation) {
          const index = this.automations.findIndex(
            (e) => e._id == this.smartCode.automation
          );
          this.selectedAutomation = this.automations[index];
        }
      }
    }
    if (!this.smartCode.message) this.smartCode.message = '';
  }

  ngOnInit(): void {}

  validateCode(evt: any): void {
    if (!evt) {
      return;
    }

    const result = /\s/.test(String(evt).toLowerCase());
    if (result) {
      this.isValidCode = false;
      this.codeErrorMsg = 'Space is not allowed';
      return;
    }

    const smart_codes = this.garbage.smart_codes;
    if (evt != this.originalCode && smart_codes[evt]) {
      this.isValidCode = false;
      this.codeErrorMsg = 'Code is already exist';
      return;
    }

    this.isValidCode = true;
    this.codeErrorMsg = '';
  }

  submit(): void {
    this.creating = true;

    const smart_codes = this.garbage.smart_codes;
    if (
      this.originalCode &&
      this.originalCode.toLowerCase() != this.smartCode.code.toLowerCase()
    ) {
      // original code is chagned
      delete smart_codes[this.originalCode];
    }

    if (this.selectedAutomation?._id) {
      smart_codes[this.smartCode.code.toLowerCase()] = {
        tag: this.tags.join(','),
        message: this.smartCode.message,
        automation: this.selectedAutomation._id
      };
    } else {
      smart_codes[this.smartCode.code.toLowerCase()] = {
        tag: this.tags.join(','),
        message: this.smartCode.message
      };
    }

    this.updateGarbageSubscription &&
      this.updateGarbageSubscription.unsubscribe();
    this.updateGarbageSubscription = this.userService
      .updateGarbage({
        smart_codes
      })
      .subscribe((status) => {
        this.creating = false;
        if (status) {
          this.garbage.smart_codes = smart_codes;
          this.userService.garbage.next(this.garbage);
          this.userService.loadProfile().subscribe((res) => {
            const garbage = new Garbage().deserialize(res['garbage']);
            this.userService.setGarbage(garbage);
          });
          this.dialogRef.close({ smart_codes });
        }
      });
  }

  selectAutomation(evt: Automation): void {
    this.selectedAutomation = evt;
  }

  openMaterialsDlg(): void {
    const { videoIds, imageIds, pdfIds } = this.getMaterials();
    const selectedMaterials = [...videoIds, ...imageIds, ...pdfIds].map((e) => {
      return { _id: e };
    });
    const materialDialog = this.dialog.open(MaterialBrowserComponent, {
      width: '98vw',
      maxWidth: '940px',
      data: {
        multiple: true,
        hideMaterials: selectedMaterials
      }
    });
    materialDialog['_overlayRef']['_host'].classList.add('top-dialog');
    materialDialog.afterClosed().subscribe((res) => {
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
            (!this.smartCode.message ||
              this.smartCode.message.slice(-1) === '\n')
          ) {
            this.smartCode.message = this.smartCode.message + '\n' + url;
            return;
          }
          if (index === 0) {
            this.smartCode.message = this.smartCode.message + '\n\n' + url;
            return;
          }
          // middle element insert
          this.smartCode.message = this.smartCode.message + '\n' + url;

          if (index === res.materials.length - 1) {
            this.smartCode.message += '\n';
          }
        });
      }
    });
  }

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

    let matches = this.smartCode.message.match(videoReg);
    if (matches && matches.length) {
      matches.forEach((e) => {
        const videoId = e.replace(environment.website + '/video?video=', '');
        videoIds.push(videoId);
      });
    }
    matches = this.smartCode.message.match(pdfReg);
    if (matches && matches.length) {
      matches.forEach((e) => {
        const pdfId = e.replace(environment.website + '/pdf?pdf=', '');
        pdfIds.push(pdfId);
      });
    }
    matches = this.smartCode.message.match(imageReg);
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

  insertTextContentValue(value: string): void {
    const field = this.messageText.nativeElement;
    field.focus();
    let cursorStart = this.smartCode.message.length;
    let cursorEnd = this.smartCode.message.length;
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
  }
}
