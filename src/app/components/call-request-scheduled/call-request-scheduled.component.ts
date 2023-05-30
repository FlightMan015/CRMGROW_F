import {
  Component,
  OnInit,
  Inject,
  ViewChild,
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TeamService } from '../../services/team.service';
import { UserService } from '../../services/user.service';
import { Location } from '@angular/common';
import * as moment from 'moment';
import { HtmlEditorComponent } from 'src/app/components/html-editor/html-editor.component';

@Component({
  selector: 'app-call-request-scheduled',
  templateUrl: './call-request-scheduled.component.html',
  styleUrls: ['./call-request-scheduled.component.scss']
})
export class CallRequestScheduledComponent implements OnInit {
  formData: any;
  isOrganizer = false;
  isLeader = false;
  isLoading = false;
  isCancelLoading = false;
  duration = '';
  isAddNoteLoading = false;
  selectedDate;
  submitted = false;
  isEditable = true;

  @ViewChild('editor') htmlEditor: HtmlEditorComponent;

  constructor(
    private dialogRef: MatDialogRef<CallRequestScheduledComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private teamService: TeamService,
    private userService: UserService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.formData = this.data.plan;
    this.selectedDate = this.formData.confirmed_at;
    this.userService.profile$.subscribe((res) => {
      if (this.formData) {
        if (this.formData.leader) {
          this.isLeader = this.formData.leader._id === res._id;
        }
        this.isOrganizer = this.formData.user._id === res._id;

        if (this.formData.status !== 'planned') {
          this.isEditable = false;
        }
      }
      this.duration =
        this.formData.duration === 60
          ? '1 hour'
          : this.formData.duration + ' mins';
    });
    const _SELF = this;
    setTimeout(() => {
      if (_SELF.htmlEditor && _SELF.formData.note) {
        _SELF.htmlEditor.setValue(_SELF.formData.note);
      }
    }, 500);
  }

  backCall(): void {
    if (this.isEditable) {
      this.isAddNoteLoading = true;
      const data = {
        ...this.formData
      };
      this.teamService.updateCall(this.formData._id, data).subscribe(
        (res) => {
          this.isAddNoteLoading = false;
          this.location.replaceState('/teams');
          this.closeDialog();
        },
        (error) => {
          this.isAddNoteLoading = false;
          this.location.replaceState('/teams');
          this.closeDialog();
        }
      );
    } else {
      this.closeDialog();
    }
  }
  cancelCall(): void {
    this.isCancelLoading = true;
    const data = {
      call_id: this.formData._id
    };
    this.teamService.rejectCall(data).subscribe(
      (res) => {
        this.isCancelLoading = false;
        const result = {
          planed_id: this.formData._id,
          status: 'canceled'
        };
        this.location.replaceState('/teams');
        this.dialogRef.close({ data: result });
      },
      (error) => {
        this.isCancelLoading = false;
        this.location.replaceState('/teams');
        this.closeDialog();
      }
    );
  }

  closeDialog(): void {
    this.isLoading = false;
    this.location.replaceState('/teams');
    this.dialogRef.close();
  }
}
