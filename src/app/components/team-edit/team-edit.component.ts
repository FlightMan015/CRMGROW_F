import { Component, OnInit, Inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { TeamService } from 'src/app/services/team.service';
import { ToastrService } from 'ngx-toastr';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog
} from '@angular/material/dialog';
import { TeamDeleteComponent } from '../team-delete/team-delete.component';
import { HelperService } from '../../services/helper.service';

@Component({
  selector: 'app-team-edit',
  templateUrl: './team-edit.component.html',
  styleUrls: ['./team-edit.component.scss']
})
export class TeamEditComponent implements OnInit {
  submitted = false;
  updating = false;
  updateSubscription: Subscription;
  team;
  name = '';
  picture = '';
  isPublic = true;
  constructor(
    private teamService: TeamService,
    private toast: ToastrService,
    private dialogRef: MatDialogRef<TeamEditComponent>,
    private dialog: MatDialog,
    private helperService: HelperService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data && this.data.team) {
      this.team = { ...this.data.team };
    }
  }

  ngOnInit(): void {
    this.name = this.team.name;
    this.picture = this.team.picture;
    this.isPublic = this.team.is_public;
  }

  setPrivate(): void {
    this.isPublic = this.isPublic ? false : true;
  }

  update(): void {
    let data;
    if (this.picture && this.picture.includes('https')) {
      data = {
        name: this.name,
        is_public: this.isPublic
      };
    } else {
      data = {
        name: this.name,
        is_public: this.isPublic,
        picture: this.picture
      };
    }

    this.updating = true;
    this.updateSubscription = this.teamService
      .update(this.team._id, data)
      .subscribe(
        (res) => {
          this.updating = false;
          this.dialogRef.close(res);
        },
        (err) => {
          this.updating = false;
        }
      );
  }
  deleteTeam(): void {
    const team = this.team;
    this.dialog
      .open(TeamDeleteComponent, {
        data: {
          team
        }
      })
      .afterClosed()
      .subscribe((res) => {});
  }

  closeAvatar(): void {
    this.picture = '';
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
            this.picture = thumbnail;
          })
          .catch(() => {
            this.toast.warning('Cannot load the image file.');
          });
      })
      .catch((err) => {
        this.toast.error('File Select', err);
      });
  }
}
