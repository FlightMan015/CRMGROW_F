import { Component, Inject, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Team } from 'src/app/models/team.model';
import { User } from 'src/app/models/user.model';
import { UserService } from 'src/app/services/user.service';
import { MaterialService } from 'src/app/services/material.service';
import { AutomationService } from '../../services/automation.service';
import { TemplatesService } from '../../services/templates.service';
import { TeamService } from '../../services/team.service';
import { ConfirmComponent } from 'src/app/components/confirm/confirm.component';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog
} from '@angular/material/dialog';
import * as _ from 'lodash';
import { Material } from 'src/app/models/material.model';
import { ToastrService } from 'ngx-toastr';
import { Template } from 'src/app/models/template.model';
import { Automation } from 'src/app/models/automation.model';
@Component({
  selector: 'app-team-material-share',
  templateUrl: './team-material-share.component.html',
  styleUrls: ['./team-material-share.component.scss']
})
export class TeamMaterialShareComponent implements OnInit {
  sharing = false;
  shareType = '';
  selectedTeam: Team = null;
  userId = '';
  currentUser: User;
  teams = [];
  material: Material = new Material();
  template: Template = new Template();
  automation: Automation;
  folder: any = null;
  isFolder: boolean = false;
  isUnshare: boolean = false;
  selectedTeams: Team[] = [];
  error: boolean = false;

  profileSubscription: Subscription;
  constructor(
    private dialog: MatDialog,
    public teamService: TeamService,
    private userService: UserService,
    public automationService: AutomationService,
    public templateService: TemplatesService,
    private toast: ToastrService,
    public materialService: MaterialService,
    private dialogRef: MatDialogRef<TeamMaterialShareComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      const profile = this.userService.profile.getValue();
      this.userId = profile._id;
      this.currentUser = res;
    });

    if (this.data) {
      if (this.data.material) {
        this.material = this.data.material;
      }
      if (this.data.type) {
        this.shareType = this.data.type;
      }
      if (this.data.template) {
        this.template = this.data.template;
      }
      if (this.data.automation) {
        this.automation = this.data.automation;
      }
      if (this.data.folder) {
        this.folder = this.data.folder;
      }
      this.isFolder = this.data.isFolder;

      this.isUnshare = this.data.unshare;
    }

    this.load();
  }

  load(): void {
    // this.teamService.loadAll(true);
    this.teamService.teams$.subscribe((res) => {
      const teams = this.teamService.teams.getValue();
      const ownerTeams = [];
      const editorTeams = [];

      if (this.shareType == 'material') {
        for (const team of teams) {
          const video = team.videos.findIndex(
            (item) => item == this.material?._id
          );
          const pdf = team.pdfs.findIndex((item) => item == this.material?._id);
          const image = team.images.findIndex(
            (item) => item == this.material?._id
          );
          let folder = team.folders.findIndex(
            (item) => item == this.material?._id
          );
          if (this.isFolder) {
            folder = team.folders.findIndex((item) => item == this.folder._id);
          }

          if (team.owner && team.owner.length > 0) {
            const index = team.owner.findIndex(
              (item) => item._id === this.userId
            );
            if (this.isUnshare) {
              if (
                index >= 0 &&
                (video > 0 || pdf > 0 || image > 0 || folder > 0)
              ) {
                ownerTeams.push(team);
                continue;
              }
            } else {
              if (
                index >= 0 &&
                video < 0 &&
                pdf < 0 &&
                image < 0 &&
                folder < 0
              ) {
                ownerTeams.push(team);
                continue;
              }
            }
          }
          if (team.editors && team.editors.length > 0) {
            const index = team.editors.findIndex(
              (item) => item._id === this.userId
            );
            if (this.isUnshare) {
              if (
                index >= 0 &&
                (video > 0 || pdf > 0 || image > 0 || folder > 0)
              ) {
                editorTeams.push(team);
                continue;
              }
            } else {
              if (
                index >= 0 &&
                video < 0 &&
                pdf < 0 &&
                image < 0 &&
                folder < 0
              ) {
                editorTeams.push(team);
                continue;
              }
            }
          }
        }
      } else if (this.shareType == 'template') {
        for (const team of teams) {
          const shared = team.email_templates.findIndex(
            (item) => item == this.template?._id
          );

          let folder = team.folders.findIndex(
            (item) => item == this.template?._id
          );
          if (this.isFolder) {
            folder = team.folders.findIndex((item) => item == this.folder._id);
          }

          if (team.owner && team.owner.length > 0) {
            const index = team.owner.findIndex(
              (item) => item._id === this.userId
            );
            if (this.isUnshare) {
              if (index >= 0 && (shared > 0 || folder > 0)) {
                ownerTeams.push(team);
                continue;
              }
            } else {
              if (index >= 0 && shared < 0 && folder < 0) {
                ownerTeams.push(team);
                continue;
              }
            }
          }
          if (team.editors && team.editors.length > 0) {
            const index = team.editors.findIndex(
              (item) => item._id === this.userId
            );
            if (this.isUnshare) {
              if (index >= 0 && (shared > 0 || folder > 0)) {
                editorTeams.push(team);
                continue;
              }
            } else {
              if (index >= 0 && shared < 0 && folder < 0) {
                editorTeams.push(team);
                continue;
              }
            }
          }
        }
      } else if (this.shareType === 'automation') {
        for (const team of teams) {
          const shared = team.automations.findIndex(
            (item) => item == this.automation?._id
          );
          let folder = team.folders.findIndex(
            (item) => item == this.automation?._id
          );
          if (this.isFolder) {
            folder = team.folders.findIndex((item) => item == this.folder._id);
          }

          if (team.owner && team.owner.length > 0) {
            const index = team.owner.findIndex(
              (item) => item._id === this.userId
            );
            if (this.isUnshare) {
              if (index >= 0 && (shared > 0 || folder > 0)) {
                ownerTeams.push(team);
                continue;
              }
            } else {
              if (index >= 0 && shared < 0 && folder < 0) {
                ownerTeams.push(team);
                continue;
              }
            }
          }
          if (team.editors && team.editors.length > 0) {
            const index = team.editors.findIndex(
              (item) => item._id === this.userId
            );
            if (this.isUnshare) {
              if (index >= 0 && (shared > 0 || folder > 0)) {
                editorTeams.push(team);
                continue;
              }
            } else {
              if (index >= 0 && shared < 0 && folder < 0) {
                editorTeams.push(team);
                continue;
              }
            }
          }
        }
      }
      this.teams = [...ownerTeams, ...editorTeams];
    });
  }

  share(): void {
    this.sharing = true;
    if (this.selectedTeams.length == 0) {
      this.sharing = false;
      this.error = true;
      return;
    }
    const selectedTeamIds = this.selectedTeams.map((team) => {
      return team._id;
    });
    if (this.isFolder) {
      this.teamService
        .shareFolder(selectedTeamIds, [this.folder._id])
        .subscribe((res) => {
          if (res) {
            if (this.shareType == 'material') {
              this.teamService.loadAll(true);
              this.materialService.loadOwn(true);
              this.materialService.loadLibrary(true);
            } else if (this.shareType == 'automation') {
              this.teamService.loadAll(true);
              this.automationService.loadOwn(true);
              this.automationService.loadLibrary(true);
            } else if (this.shareType == 'template') {
              this.teamService.loadAll(true);
              this.templateService.loadOwn(true);
              this.templateService.loadLibrary(true);
            }
            this.sharing = false;
            this.dialogRef.close();
          }
        });
    } else {
      if (this.shareType == 'material') {
        this.teamService
          .shareTeamMaterials(
            selectedTeamIds,
            [this.material._id],
            this.material.material_type
          )
          .subscribe((res) => {
            if (res && res.length > 0) {
              this.teamService.loadAll(true);
              this.materialService.loadOwn(true);
              this.materialService.loadLibrary(true);
              this.sharing = false;
              // this.toast.success('Video has been shared successfully.');
              this.dialogRef.close();
            }
          });
      } else if (this.shareType == 'template') {
        this.templateService.read(this.template._id).subscribe((res) => {
          const imageNames = _.uniqBy(res['image_ids'], 'title');
          const videoNames = _.uniqBy(res['video_ids'], 'title');
          const pdfNames = _.uniqBy(res['pdf_ids'], 'title');

          if (
            videoNames.length == 0 &&
            imageNames.length == 0 &&
            pdfNames.length == 0
          ) {
            this.teamService
              .shareTemplates(selectedTeamIds, [this.template._id])
              .subscribe((res) => {
                if (res && res.length > 0) {
                  this.teamService.loadAll(true);
                  this.templateService.loadOwn(true);
                  this.templateService.loadLibrary(true);
                  this.sharing = false;
                  // this.toast.success('Template has been shared successfully.');
                  this.dialogRef.close();
                }
              });
          } else {
            this.dialogRef.close();
            const dialog = this.dialog.open(ConfirmComponent, {
              maxWidth: '400px',
              width: '96vw',
              position: { top: '100px' },
              data: {
                title: 'Share Templates',
                message: 'Are you sure to share these ones?',
                videos: videoNames,
                images: imageNames,
                pdfs: pdfNames,
                confirmLabel: 'Yes',
                cancelLabel: 'No'
              }
            });
            dialog.afterClosed().subscribe((res) => {
              if (res) {
                this.teamService
                  .shareTemplates(selectedTeamIds, [this.template._id])
                  .subscribe((res) => {
                    if (res && res.length > 0) {
                      this.teamService.loadAll(true);
                      this.templateService.loadOwn(true);
                      this.templateService.loadLibrary(true);
                      this.sharing = false;
                      // this.toast.success('Template has been shared successfully.');
                      this.dialogRef.close();
                    }
                  });
              }
            });
          }
        });
      } else if (this.shareType === 'automation') {
        const curElement = JSON.parse(JSON.stringify(this.automation));
        const childAutomationIds = [];
        const childAutomationNames = [];
        const videoNames = [];
        const imageNames = [];
        const pdfNames = [];
        let check_status = false;
        for (let i = 0; i < curElement.automations.length; i++) {
          const tempItem = curElement.automations[i];
          if (tempItem.action.type === 'automation') {
            childAutomationIds.push(tempItem.action.automation_id);
          }
          if (tempItem.action.videos && tempItem.action.videos.length > 0) {
            check_status = true;
          }
          if (tempItem.action.pdfs && tempItem.action.pdfs.length > 0) {
            check_status = true;
          }
          if (tempItem.action.images && tempItem.action.images.length > 0) {
            check_status = true;
          }
        }
        let dialog;
        if (childAutomationIds.length > 0 || check_status) {
          this.automationService
            .getChildAutomationNames(this.automation._id)
            .subscribe((res) => {
              if (res['titles'].length > 0) {
                for (let i = 0; i < res['titles'].length; i++) {
                  childAutomationNames.push(res['titles'][i]);
                }
              }

              if (res['videos'].length > 0) {
                for (let i = 0; i < res['videos'].length; i++) {
                  videoNames.push(res['videos'][i]);
                }
              }
              if (res['images'].length > 0) {
                for (let i = 0; i < res['images'].length; i++) {
                  imageNames.push(res['images'][i]);
                }
              }
              if (res['pdfs'].length > 0) {
                for (let i = 0; i < res['pdfs'].length; i++) {
                  pdfNames.push(res['pdfs'][i]);
                }
              }
              const tempAutomationNames = childAutomationNames.filter(
                (c, index) => {
                  return childAutomationNames.indexOf(c)! == index;
                }
              );
              const tempImageNames = _.uniqBy(imageNames, 'title');
              const tempVideoNames = _.uniqBy(videoNames, 'title');
              const tempPdfNames = _.uniqBy(pdfNames, 'title');
              this.sharing = false;
              this.dialogRef.close();
              dialog = this.dialog.open(ConfirmComponent, {
                maxWidth: '400px',
                width: '96vw',
                position: { top: '100px' },
                data: {
                  title: 'Share Automations',
                  message: 'Are you sure to share these ones?',
                  titles: tempAutomationNames,
                  videos: tempVideoNames,
                  images: tempImageNames,
                  pdfs: tempPdfNames,
                  confirmLabel: 'Yes',
                  cancelLabel: 'No'
                }
              });
              dialog.afterClosed().subscribe((res) => {
                if (res) {
                  this.teamService
                    .shareAutomations(selectedTeamIds, [this.automation._id])
                    .subscribe((res) => {
                      if (res && res.length > 0) {
                        this.teamService.loadAll(true);
                        this.automationService.loadOwn(true);
                        this.automationService.loadLibrary(true);
                        this.sharing = false;
                        // this.toast.success('Automation has been shared successfully.');
                        this.dialogRef.close();
                      }
                    });
                }
              });
            });
        } else {
          this.teamService
            .shareAutomations(selectedTeamIds, [this.automation._id])
            .subscribe((res) => {
              if (res && res.length > 0) {
                this.teamService.loadAll(true);
                this.automationService.loadOwn(true);
                this.automationService.loadLibrary(true);
                this.sharing = false;
                // this.toast.success('Automation has been shared successfully.');
                this.dialogRef.close();
              }
            });
        }
      }
    }
  }

  unshare(): void {
    this.sharing = true;
    if (this.selectedTeams.length == 0) {
      this.sharing = false;
      this.error = true;
      return;
    }
    const selectedTeamIds = this.selectedTeams.map((e) => {
      return e._id;
    });
    if (this.shareType === 'material') {
      let type;
      let id;
      if (this.isFolder) {
        type = 'folders';
        id = this.folder._id;
      } else if (this.material) {
        id = this.material._id;
      }
      switch (this.material.material_type) {
        case 'image':
          type = 'images';
          break;
        case 'pdf':
          type = 'pdfs';
          break;
        case 'video':
          type = 'videos';
          break;
        default:
          break;
      }
      const data = {
        teams: selectedTeamIds,
        id,
        type
      };
      this.teamService.stopShare(data).subscribe((res) => {
        if (res) {
          this.teamService.loadAll(true);
          this.materialService.loadOwn(true);
          this.materialService.loadLibrary(true);
          this.sharing = false;
          this.dialogRef.close();
        }
      });
    } else if (this.shareType === 'template') {
      let type;
      let id;
      if (this.isFolder) {
        type = 'folders';
        id = this.folder._id;
      } else if (this.template) {
        type = 'email_templates';
        id = this.template._id;
      }
      const data = {
        teams: selectedTeamIds,
        id,
        type
      };
      this.teamService.stopShare(data).subscribe((res) => {
        if (res) {
          this.teamService.loadAll(true);
          this.templateService.loadOwn(true);
          this.templateService.loadLibrary(true);
          this.sharing = false;
          this.dialogRef.close();
        }
      });
    } else if (this.shareType === 'automation') {
      let type;
      let id;
      if (this.isFolder) {
        type = 'folders';
        id = this.folder._id;
      } else if (this.automation) {
        type = 'automations';
        id = this.automation._id;
      }
      const data = {
        teams: selectedTeamIds,
        id,
        type
      };
      this.teamService.stopShare(data).subscribe((res) => {
        if (res) {
          this.teamService.loadAll(true);
          this.automationService.loadOwn(true);
          this.automationService.loadLibrary(true);
          this.sharing = false;
          this.dialogRef.close();
        }
      });
    }
  }

  select() {
    if (
      this.selectedTeam &&
      this.selectedTeams.indexOf(this.selectedTeam) == -1
    ) {
      this.selectedTeams.push(this.selectedTeam);
      this.error = false;
      const listIndex = this.teams.indexOf(this.selectedTeam);
      this.teams.splice(listIndex, 1);
    }
    this.selectedTeam = null;
  }

  cancelTeam(team: Team) {
    this.selectedTeam = null;
    const index = this.selectedTeams.indexOf(team);
    this.selectedTeams.splice(index, 1);
    this.teams.push(team);
  }
}
