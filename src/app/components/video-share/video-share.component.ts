import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TeamService } from 'src/app/services/team.service';
import { MaterialService } from 'src/app/services/material.service';
import { Subscription } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-video-share',
  templateUrl: './video-share.component.html',
  styleUrls: ['./video-share.component.scss']
})
export class VideoShareComponent implements OnInit {
  materials: any[] = [];
  loading = false;
  loadSubscription: Subscription;

  selectedMaterials: any[] = [];

  sharing = false;
  shareSubscription: Subscription;

  team_id = '';

  constructor(
    private dialogRef: MatDialogRef<VideoShareComponent>,
    private materialService: MaterialService,
    private teamService: TeamService,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {}

  ngOnInit(): void {
    this.team_id = this.data.team_id;
    this.loadMaterials();
  }

  loadMaterials(): void {
    this.loading = true;
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.materialService.loadVideosImpl().subscribe(
      (res) => {
        this.loading = false;
        res.forEach((e) => {
          if (e.role !== 'admin') {
            this.materials.push(e);
          }
        });
      },
      (err) => {
        this.loading = false;
      }
    );
  }

  toggleMaterial(_id): void {
    const pos = this.selectedMaterials.indexOf(_id);
    if (pos !== -1) {
      this.selectedMaterials.splice(pos, 1);
    } else {
      this.selectedMaterials.push(_id);
    }
  }

  shareMaterials(): void {
    this.sharing = true;
    this.shareSubscription && this.shareSubscription.unsubscribe();
    this.shareSubscription = this.teamService
      .shareTeamMaterials([this.team_id], this.selectedMaterials, 'video')
      .subscribe(
        (res) => {
          this.sharing = false;
          this.dialogRef.close({
            materials: res[0]
          });
        },
        (err) => {
          this.sharing = false;
        }
      );
  }
}
