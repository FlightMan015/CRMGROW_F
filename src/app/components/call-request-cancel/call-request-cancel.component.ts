import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HtmlEditorComponent } from 'src/app/components/html-editor/html-editor.component';
import { EmailService } from '../../services/email.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-call-request-cancel',
  templateUrl: './call-request-cancel.component.html',
  styleUrls: ['./call-request-cancel.component.scss']
})
export class CallRequestCancelComponent implements OnInit {
  submitted = false;
  title = '';
  message = '';
  call;
  type = 'organizer';
  isSending = false;

  constructor(
    private dialogRef: MatDialogRef<CallRequestCancelComponent>,
    private emailService: EmailService,
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    if (this.data) {
      this.call = this.data.call;
      this.type = this.data.type;
    }
  }

  sendMessage(): void {
    if (!this.title || !this.message) {
      return;
    }
    const emails = [];
    this.isSending = true;
    if (this.type === 'organizer') {
      emails.push(this.call.user.email);
    } else {
      emails.push(this.call.leader.email);
    }

    const data = {
      emails,
      email_subject: this.title,
      email_content: this.message
    };

    this.emailService.sendEmail(data).subscribe((res) => {
      this.isSending = false;
      if (res) {
        if (res.status) {
          // this.toastr.success('Email has been successfully sent.');
        } else {
          this.toastr.error(res.error);
        }
        this.dialogRef.close();
      }
    });
  }
}
