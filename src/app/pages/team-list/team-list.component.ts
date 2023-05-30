import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { TeamService } from '../../services/team.service';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '../../services/user.service';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { TeamEditComponent } from '../../components/team-edit/team-edit.component';
import { TeamDeleteComponent } from '../../components/team-delete/team-delete.component';
import { TeamCreateComponent } from '../../components/team-create/team-create.component';
import { JoinTeamComponent } from '../../components/join-team/join-team.component';
import { DialogSettings, STATUS } from '../../constants/variable.constants';
import * as _ from 'lodash';
import { Team } from 'src/app/models/team.model';
import { User } from 'src/app/models/user.model';
import { ConfirmComponent } from '../../components/confirm/confirm.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-team-list',
  templateUrl: './team-list.component.html',
  styleUrls: ['./team-list.component.scss']
})
export class TeamListComponent implements OnInit, OnDestroy {
  STATUS = STATUS;

  userId = '';
  currentUser: User;
  hasOwnTeam = false;
  allowCreateTeam = false;
  role = '';

  isAcceptInviting = false;
  isDeclineInviting = false;
  acceptTeamId = '';
  declineTeamId = '';

  teams = [];
  isPackageTeam = true;

  profileSubscription: Subscription;
  constructor(
    public teamService: TeamService,
    private dialog: MatDialog,
    private userService: UserService,
    private toastr: ToastrService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      const profile = this.userService.profile.getValue();
      this.userId = profile._id;
      this.isPackageTeam = profile.team_info?.owner_enabled;
      this.currentUser = res;
      if (this.currentUser.team_info) {
        this.load();
      }
    });
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
  }

  load(): void {
    this.teamService.loadAll(true);
    this.teamService.loadInvites(true);
    this.teamService.loadRequests(true);
    this.teamService.teams$.subscribe((res) => {
      const teams = this.teamService.teams.getValue();
      let numberOfTeam = 0;
      for (const team of teams) {
        if (team.owner && team.owner.length > 0) {
          const index = team.owner.findIndex(
            (item) => item._id === this.userId
          );
          if (index >= 0) {
            this.hasOwnTeam = true;
            numberOfTeam += 1;
          }
        }
      }
      if (!this.currentUser.team_info['is_limit']) {
        this.allowCreateTeam = true;
      } else {
        if (numberOfTeam < this.currentUser.team_info['max_count']) {
          this.allowCreateTeam = true;
        } else {
          this.allowCreateTeam = false;
        }
      }
      const ownerTeams = [];
      const editorTeams = [];
      const viewerTeams = [];

      for (const team of teams) {
        if (team.owner && team.owner.length > 0) {
          const index = team.owner.findIndex(
            (item) => item._id === this.userId
          );
          if (index >= 0) {
            ownerTeams.push(team);
            continue;
          }
        }
        if (team.editors && team.editors.length > 0) {
          const index = team.editors.findIndex(
            (item) => item._id === this.userId
          );
          if (index >= 0) {
            editorTeams.push(team);
            continue;
          }
        }
        if (team.members && team.members.length > 0) {
          const index = team.members.findIndex(
            (item) => item._id === this.userId
          );
          if (index >= 0) {
            viewerTeams.push(team);
          }
        }
      }

      this.teams = [...ownerTeams, ...editorTeams, ...viewerTeams];
    });
  }

  status(team: Team): any {
    let index;
    if (team.owner.length) {
      index = team.owner.filter((item) => item._id === this.userId).length;
      if (index > 0) {
        return 'Owner';
      }
    }
    if (team.editors.length) {
      index = team.editors.filter((item) => item._id === this.userId).length;
      if (index > 0) {
        return 'Editor';
      }
    }
    if (team.members.length) {
      index = team.members.filter((item) => item._id === this.userId).length;
      if (index > 0) {
        return 'Viewer';
      }
    }
  }

  editTeam(team: Team): void {
    this.dialog
      .open(TeamEditComponent, {
        width: '96vw',
        maxWidth: '600px',
        disableClose: true,
        data: {
          team
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.teamService.updateTeam$(
            team._id,
            new Team().deserialize({ name: res.name, is_public: res.is_public })
          );
          const index = this.teams.findIndex((item) => item._id === team._id);
          if (index >= 0) {
            this.teams[index].name = res.name;
            this.teams[index].picture = res.picture;
            this.teams[index].is_public = res.is_public;
          }
        }
      });
  }

  deleteTeam(team: Team): void {
    this.dialog
      .open(TeamDeleteComponent, {
        data: {
          team
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.teamService.deleteTeam$(team._id);
          const teams = this.teamService.teams.getValue();
          for (const teamItem of teams) {
            if (teamItem.owner && teamItem.owner.length > 0) {
              const index = teamItem.owner.findIndex(
                (item) => item._id === this.userId
              );
              if (index >= 0) {
                this.hasOwnTeam = true;
                return;
              }
            }
          }
          this.hasOwnTeam = false;
        }
      });
  }

  leaveTeam(team): void {
    this.dialog
      .open(ConfirmComponent, {
        maxWidth: '360px',
        width: '96vw',
        data: {
          title: 'Leave Team',
          message: 'Are you sure to leave this team?',
          cancelLabel: 'No',
          confirmLabel: 'Leave'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const newMembers = [];
          const newEditors = [];
          team.members.forEach((e) => {
            if (e._id !== this.userId) {
              newMembers.push(e._id);
            }
          });
          if (team.editors && team.editors.length) {
            team.editors.forEach((e) => {
              if (e !== this.userId) {
                newEditors.push(e._id);
              }
            });
          }
          this.teamService
            .updateTeam(team._id, { members: newMembers, editors: newEditors })
            .subscribe(
              (response) => {
                this.teamService.loadAll(true);
                // this.toastr.success('You left the team successfully.');
              },
              (err) => {}
            );
        }
      });
  }

  openForm(): void {
    this.dialog
      .open(TeamCreateComponent, {
        width: '96vw',
        maxWidth: '600px',
        disableClose: true
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const userId = this.userId;
          const user_name = this.currentUser.user_name;
          const picture_profile = this.currentUser.picture_profile;
          const team = {
            ...res,
            owner: [{ _id: userId, user_name, picture_profile }],
            own: true
          };
          this.teamService.createTeam$(new Team().deserialize(team));
        }
      });
  }

  joinForm(): void {
    this.dialog.open(JoinTeamComponent, DialogSettings.JOIN_TEAM);
  }

  acceptInvitation(team: Team): void {
    this.isAcceptInviting = true;
    this.acceptTeamId = team._id;
    this.teamService.acceptInvitation(team._id).subscribe((res) => {
      this.isAcceptInviting = false;
      this.acceptTeamId = '';
      team.invites.some((e, index) => {
        if (e._id === this.userId) {
          team.invites.splice(index, 1);
          return true;
        }
      });
      team.members.push(team);
      this.teamService.updateTeam$(team._id, team);
      this.teamService.loadInvites(true);
      this.teamService.loadAll(true);
    });
  }

  declineInvitation(team): void {
    this.isDeclineInviting = true;
    this.declineTeamId = team._id;
    this.teamService.declineInvitation(team._id).subscribe((res) => {
      this.isDeclineInviting = false;
      this.declineTeamId = '';
      team.invites.some((e, index) => {
        if (e === this.userId) {
          team.invites.splice(index, 1);
          return true;
        }
      });
      this.teamService.updateTeam$(team._id, team);
      this.teamService.loadInvites(true);
      this.teamService.loadAll(true);
    });
  }

  isEditableUser(team): boolean {
    if (team.owner && team.owner.length > 0) {
      const index = team.owner.findIndex((item) => item._id === this.userId);
      if (index >= 0) {
        return true;
      }
    }
    if (team.editors && team.editors.length > 0) {
      const index = team.editors.findIndex((item) => item._id === this.userId);
      if (index >= 0) {
        return true;
      }
    }
    return false;
  }
}
