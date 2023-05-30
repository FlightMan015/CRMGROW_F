import { Component, OnInit, Inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { TeamService } from 'src/app/services/team.service';
import { ToastrService } from 'ngx-toastr';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog
} from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-team-delete',
  templateUrl: './team-delete.component.html',
  styleUrls: ['./team-delete.component.scss']
})
export class TeamDeleteComponent implements OnInit {
  updating = false;
  team;
  submitted = false;
  constructor(
    private teamService: TeamService,
    private toast: ToastrService,
    private dialogRef: MatDialogRef<TeamDeleteComponent>,
    private dialog: MatDialog,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data && this.data.team) {
      this.team = { ...this.data.team };
    }
  }

  ngOnInit(): void {}
  deleteTeam(): void {
    this.updating = true;
    this.teamService.delete(this.team._id).subscribe(
      (res) => {
        this.updating = false;
        this.router.navigate(['/teams']);
        this.dialogRef.close(res);
      },
      (err) => {
        this.updating = false;
        this.dialogRef.close();
      }
    );
  }
}
