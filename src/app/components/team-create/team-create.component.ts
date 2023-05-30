import { Component, OnInit } from '@angular/core';
import { AvatarEditorComponent } from '../avatar-editor/avatar-editor.component';
import { UserService } from '../../services/user.service';
import { HelperService } from '../../services/helper.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { TeamService } from '../../services/team.service';

@Component({
  selector: 'app-team-create',
  templateUrl: './team-create.component.html',
  styleUrls: ['./team-create.component.scss']
})
export class TeamCreateComponent implements OnInit {
  submitted = false;
  team: any = {
    name: '',
    email: '',
    cell_phone: '',
    description: '',
    picture: '',
    is_public: true
  };
  createSubscription: Subscription;
  creating = false;
  isPublic = true;

  constructor(
    private userService: UserService,
    private helperService: HelperService,
    private teamService: TeamService,
    private dialog: MatDialog,
    private toast: ToastrService,
    private dialogRef: MatDialogRef<TeamCreateComponent>
  ) {}

  ngOnInit(): void {}

  setPrivate(): void {
    this.isPublic = this.isPublic ? false : true;
    this.team.is_public = this.isPublic;
  }

  openAvatar(): void {
    this.helperService
      .promptForFiles('image/jpg, image/png, image/jpeg, image/webp, image/bmp')
      .then((files) => {
        const file: File = files[0];
        const type = file.type;
        const validTypes = [
          'image/jpg',
          'image/png',
          'image/jpeg',
          'image/webp',
          'image/bmp'
        ];
        if (validTypes.indexOf(type) === -1) {
          this.toast.warning('Unsupported File Selected.');
          return;
        }
        this.helperService
          .loadBase64(file)
          .then((thumbnail) => {
            this.team.picture = thumbnail;
          })
          .catch(() => {
            this.toast.warning('Cannot load the image file.');
          });
      })
      .catch((err) => {
        this.toast.error('File Select', err);
      });
  }

  closeAvatar(): void {
    this.team.picture = '';
  }

  create(): void {
    this.creating = true;
    console.log('new team info --- ', this.team);
    this.createSubscription = this.teamService.create(this.team).subscribe(
      (res) => {
        this.creating = false;
        this.dialogRef.close(res);
      },
      (err) => {
        this.creating = false;
      }
    );
  }
}
