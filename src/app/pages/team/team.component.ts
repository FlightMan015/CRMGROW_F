import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { Subscription } from 'rxjs';
import { Location } from '@angular/common';
import { TeamService } from 'src/app/services/team.service';
import { MatDialog } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import * as _ from 'lodash';
import { UserService } from '../../services/user.service';
import { environment } from 'src/environments/environment';
import { SelectionModel } from '@angular/cdk/collections';
import { ConfirmComponent } from '../../components/confirm/confirm.component';
import { TabItem } from '../../utils/data.types';
import { TeamEditComponent } from '../../components/team-edit/team-edit.component';
import { InviteTeamComponent } from 'src/app/components/invite-team/invite-team.component';
import { DialogSettings } from 'src/app/constants/variable.constants';
import { NotifyComponent } from '../../components/notify/notify.component';
import { TeamContactShareComponent } from '../../components/team-contact-share/team-contact-share.component';
import { TeamShareMaterialComponent } from '../team-share-material/team-share-material.component';
import { TeamShareAutomationComponent } from '../team-share-automation/team-share-automation.component';
import { TeamShareTemplateComponent } from '../team-share-template/team-share-template.component';
import { TeamShareContactComponent } from '../team-share-contact/team-share-contact.component';
import { MaterialBrowserComponent } from '../../components/material-browser/material-browser.component';
import { TemplateBrowserComponent } from '../../components/template-browser/template-browser.component';
import { AutomationBrowserComponent } from '../../components/automation-browser/automation-browser.component';
import { TeamMemberProfileComponent } from '../../components/team-member-profile/team-member-profile.component';

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss']
})
export class TeamComponent implements OnInit, OnDestroy, AfterViewInit {
  loading = false;
  loadError = false;
  team;
  teamId = '';
  userId = '';
  currentUser;
  loadSubscription: Subscription;
  updating = false;
  updateSubscription: Subscription;
  role = 'member'; // owner | editor | member
  siteUrl = environment.website;
  createubscription: Subscription;
  creating = false;
  accepting = false;
  acceptJoinRequest = false;
  declineJoinRequest = false;
  acceptUserId = '';
  declineUserId = '';
  acceptSubscription: Subscription;
  selectedVideos = new SelectionModel<any>(true, []);
  selectedPdfs = new SelectionModel<any>(true, []);
  selectedImages = new SelectionModel<any>(true, []);
  selectedMembers = new SelectionModel(true, []);
  selectedJoinRequest = new SelectionModel(true, []);
  shareUrl = 'https://www.crmgrow.com/';
  tabs: TabItem[] = [
    { icon: '', label: 'Members', id: 'members' },
    { icon: '', label: 'Materials', id: 'materials' },
    { icon: '', label: 'Contacts', id: 'contacts' },
    { icon: '', label: 'Automations', id: 'automations' },
    { icon: '', label: 'Templates', id: 'templates' }
  ];
  selectedTab: TabItem = this.tabs[0];

  myContacts = [];
  otherContacts = [];
  materials: any[] = [];
  viewers = [];
  editors = [];

  profileSubscription: Subscription;
  routeChangeSubscription: Subscription;
  isPackageAutomation = true;

  @ViewChild(TeamShareMaterialComponent)
  shareMaterialComponent: TeamShareMaterialComponent;
  @ViewChild(TeamShareContactComponent)
  shareContactComponent: TeamShareContactComponent;
  @ViewChild(TeamShareAutomationComponent)
  shareAutomationComponent: TeamShareAutomationComponent;
  @ViewChild(TeamShareTemplateComponent)
  shareTemplateComponent: TeamShareTemplateComponent;
  constructor(
    private teamService: TeamService,
    private userService: UserService,
    private dialog: MatDialog,
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    private toast: ToastrService,
    private router: Router,
    private location: Location
  ) {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      this.currentUser = res;
      this.userId = res._id;
      this.isPackageAutomation = res.automation_info?.is_enabled;
      this.tabs = [
        { icon: '', label: 'Members', id: 'members' },
        { icon: '', label: 'Materials', id: 'materials' },
        { icon: '', label: 'Contacts', id: 'contacts' },
        { icon: '', label: 'Automations', id: 'automations' },
        { icon: '', label: 'Templates', id: 'templates' }
      ];
      if (!this.isPackageAutomation) {
        const index = this.tabs.findIndex((item) => item.id === 'automations');
        if (index >= 0) {
          this.tabs.splice(index, 1);
        }
      }
      this.arrangeTeamData();
    });

    this.routeChangeSubscription && this.routeChangeSubscription.unsubscribe();
    this.routeChangeSubscription = this.route.params.subscribe((params) => {
      const selectedTab = params['tab'] || 'members';
      const index = this.tabs.findIndex((item) => item.id === selectedTab);
      if (index >= 0) {
        this.selectedTab = this.tabs[index];
      }
      console.log('this.selectedTab', params['tab'], index, this.selectedTab);
    });
  }

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.routeChangeSubscription && this.routeChangeSubscription.unsubscribe();
  }

  ngAfterViewInit(): void {}

  load(): void {
    this.teamId = this.route.snapshot.params['id'];
    if (this.teamId) {
      this.loadTeam();
    } else {
      this.teamId = this.route.snapshot.params['team'];
      if (this.teamId) {
        this.acceptInvitation();
      } else {
        const teamId = this.route.snapshot.queryParams['team'];
        const userId = this.route.snapshot.queryParams['user'];
        if (teamId && userId) {
          this.teamId = teamId;
          this.acceptOutRequest(teamId, userId);
        } else {
          this.router.navigate(['/teams']);
        }
      }
    }
  }

  goToBack(): void {
    this.router.navigate(['/teams']);
  }

  acceptInvitation(): void {
    this.accepting = true;
    this.acceptSubscription && this.acceptSubscription.unsubscribe();
    this.acceptSubscription = this.teamService
      .acceptInvitation(this.teamId)
      .subscribe(
        () => {
          this.accepting = false;
          this.location.replaceState('/team/' + this.teamId + '/members/root');
          this.loadTeam();
        },
        (err) => {
          this.accepting = false;
          if (err.status === 400) {
            // TODO: Invalid Permission Dialog Display
          } else {
            this.router.navigate(['/teams']);
          }
        }
      );
  }
  loadTeam(): void {
    this.loading = true;
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.teamService.read(this.teamId).subscribe(
      (res) => {
        this.loading = false;
        this.team = {
          ...res,
          owner: res['owner'],
          highlights: res['highlights'] || [],
          brands: res['brands'] || []
        };

        for (const member of this.team.members) {
          if (this.team.editors.indexOf(member._id) >= 0) {
            this.editors.push(member);
          } else {
            this.viewers.push(member);
          }
        }

        this.arrangeTeamData();
      },
      () => {
        this.loading = false;
      }
    );
  }

  arrangeTeamData(): void {
    if (this.team && this.team.owner) {
      const ownerIndex = _.findIndex(this.team.owner, { _id: this.userId });
      if (ownerIndex !== -1) {
        this.role = 'owner';
      } else if (
        this.team.editors &&
        this.team.editors.indexOf(this.userId) !== -1
      ) {
        this.role = 'editor';
      } else {
        this.role = 'viewer';
      }
    } else {
      if (
        this.team &&
        this.team.editors &&
        this.team.editors.indexOf(this.userId) !== -1
      ) {
        this.role = 'editor';
      } else {
        this.role = 'viewer';
      }
    }
  }

  shareMaterial(): void {
    if (this.selectedTab.id === 'materials' && this.shareMaterialComponent) {
      this.shareMaterialComponent.shareMaterial();
    } else {
      const hideMaterials = [];
      for (const material of this.team.videos) {
        hideMaterials.push({ _id: material });
      }
      for (const material of this.team.images) {
        hideMaterials.push({ _id: material });
      }
      for (const material of this.team.pdfs) {
        hideMaterials.push({ _id: material });
      }
      this.dialog
        .open(MaterialBrowserComponent, {
          width: '96vw',
          maxWidth: '940px',
          disableClose: true,
          data: {
            title: 'Share Material',
            buttonLabel: 'Share',
            multiple: true,
            onlyMine: true,
            hideMaterials,
            resultMatType: 'with-folder'
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res && res.materials && res.materials.length) {
            const videoIds = [];
            const pdfIds = [];
            const imageIds = [];
            const folderIds = [];
            for (const material of res.materials) {
              if (material.material_type === 'video') {
                videoIds.push(material._id);
              } else if (material.material_type === 'pdf') {
                pdfIds.push(material._id);
              } else if (material.material_type === 'image') {
                imageIds.push(material._id);
              } else {
                folderIds.push(material._id);
              }
            }

            if (videoIds.length > 0) {
              this.teamService
                .shareTeamMaterials([this.team._id], videoIds, 'video')
                .subscribe((materials) => {
                  if (materials && materials.length > 0) {
                    this.team.videos = [...this.team.videos, ...videoIds];
                  }
                });
              // this.teamService
              //   .shareVideos([this.team._id], videoIds)
              //   .subscribe((materials) => {
              //     if (materials && materials.length > 0) {
              //       this.team.videos = [...this.team.videos, ...videoIds];
              //     }
              //   });
            }

            if (pdfIds.length > 0) {
              this.teamService
                .shareTeamMaterials([this.team._id], videoIds, 'pdf')
                .subscribe((materials) => {
                  if (materials && materials.length > 0) {
                    this.team.videos = [...this.team.videos, ...videoIds];
                  }
                });
              // this.teamService
              //   .sharePdfs([this.team._id], pdfIds)
              //   .subscribe((materials) => {
              //     if (materials && materials.length > 0) {
              //       this.team.pdfs = [...this.team.pdfs, ...pdfIds];
              //     }
              //   });
            }

            if (imageIds.length > 0) {
              this.teamService
                .shareTeamMaterials([this.team._id], videoIds, 'image')
                .subscribe((materials) => {
                  if (materials && materials.length > 0) {
                    this.team.videos = [...this.team.videos, ...videoIds];
                  }
                });
              // this.teamService
              //   .shareImages([this.team._id], imageIds)
              //   .subscribe((material) => {
              //     if (material && material.length > 0) {
              //       this.team.images = [...this.team.images, ...imageIds];
              //     }
              //   });
            }
            // this.toast.success(
            //   'Selected materials has been shared successfully'
            // );
          }
        });
    }
  }

  shareAutomation(): void {
    if (
      this.selectedTab.id === 'automations' &&
      this.shareAutomationComponent
    ) {
      this.shareAutomationComponent.shareAutomation();
    } else {
      this.dialog
        .open(AutomationBrowserComponent, {
          width: '96vw',
          maxWidth: '940px',
          disableClose: true,
          data: {
            team_id: this.team._id,
            hideAutomations: this.team.automations
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            if (res.automations) {
              const sharedAutomations = [];
              for (const automation of res.automations) {
                sharedAutomations.push(automation._id);
              }
              this.team.automations = [
                ...this.team.automations,
                ...sharedAutomations
              ];
            }
          }
        });
    }
  }

  shareContact(): void {
    this.dialog
      .open(TeamContactShareComponent, {
        width: '500px',
        maxWidth: '90vw',
        data: {
          team: this.team
        }
      })
      .afterClosed()
      .subscribe((res) => {});
  }

  shareEmailTemplate(): void {
    if (this.selectedTab.id === 'templates' && this.shareTemplateComponent) {
      this.shareTemplateComponent.shareEmailTemplate();
    } else {
      this.dialog
        .open(TemplateBrowserComponent, {
          width: '96vw',
          maxWidth: '940px',
          disableClose: true,
          data: {
            team_id: this.team._id,
            hideTemplates: this.team.email_templates
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            if (res.templates) {
              const sharedTemplates = [];
              for (const template of res.templates) {
                sharedTemplates.push(template._id);
              }
              this.team.email_templates = [
                ...this.team.email_templates,
                ...sharedTemplates
              ];
            }
          }
        });
    }
  }

  cancelInvite(member): void {
    this.dialog
      .open(ConfirmComponent, {
        maxWidth: '360px',
        width: '96vw',
        data: {
          title: 'Cancel Invitation',
          message: 'Are you sure to cancel this invitation?',
          cancelLabel: 'No',
          confirmLabel: 'Ok'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.updating = true;
          let emails;
          if (member._id) {
            emails = [member.email];
          } else {
            emails = [member];
          }
          this.teamService.cancelInvite(this.teamId, emails).subscribe(
            (response) => {
              this.updating = false;
              if (member._id) {
                this.team.invites.some((e, index) => {
                  if (e.email === member.email) {
                    this.team.invites.splice(index, 1);
                    return true;
                  }
                });
              } else {
                this.team.referrals.some((e, index) => {
                  if (e === member) {
                    this.team.referrals.splice(index, 1);
                    return true;
                  }
                });
              }
              // this.toast.success('You cancelled the invitation successfully.');
            },
            (err) => {
              this.updating = false;
            }
          );
        }
      });
  }

  toggleMember(member): void {
    const editors = [...this.team.editors];
    const pos = editors.indexOf(member._id);
    if (pos !== -1) {
      editors.splice(pos, 1);
    } else {
      editors.push(member._id);
    }
    this.updating = true;
    this.updateSubscription && this.updateSubscription.unsubscribe();
    this.updateSubscription = this.teamService
      .update(this.teamId, { editors })
      .subscribe(
        (res) => {
          this.updating = false;
          this.team.editors = editors;
        },
        (err) => {
          this.updating = false;
          this.team.editors = editors;
        }
      );
  }
  removeMember(member): void {
    this.dialog
      .open(ConfirmComponent, {
        data: {
          title: 'Remove Member',
          message: 'Are you sure you want to remove this member?',
          cancelLabel: 'No',
          confirmLabel: 'Remove'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const editors = [...this.team.editors];
          const pos = editors.indexOf(member._id);
          if (pos !== -1) {
            editors.splice(pos, 1);
            this.team.editors.splice(pos, 1);
          }
          const newMembers = [];
          this.team.members.forEach((e) => {
            if (e._id !== member._id) {
              newMembers.push(e._id);
            }
          });
          const editorIndex = this.editors.findIndex(
            (item) => item._id === member._id
          );
          if (editorIndex >= 0) {
            this.editors.splice(editorIndex, 1);
          }
          const viewerIndex = this.viewers.findIndex(
            (item) => item._id === member._id
          );
          if (viewerIndex >= 0) {
            this.viewers.splice(viewerIndex, 1);
          }
          this.teamService
            .updateTeam(this.teamId, { members: newMembers, editors })
            .subscribe(
              (response) => {
                this.team.members.some((e, index) => {
                  if (e._id === member._id) {
                    this.team.members.splice(index, 1);
                  }
                });
                // this.toast.success('You removed member successfully.');
              },
              (err) => {}
            );
        }
      });
  }

  leaveTeam(member): void {
    this.dialog
      .open(ConfirmComponent, {
        maxWidth: '360px',
        width: '96vw',
        data: {
          title: 'Leave Team',
          message: 'Are you sure you want to leave this team?',
          cancelLabel: 'No',
          confirmLabel: 'Leave'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const editors = [...this.team.editors];
          const pos = editors.indexOf(member._id);
          if (pos !== -1) {
            editors.splice(pos, 1);
            this.team.editors.splice(pos, 1);
          }
          const newMembers = [];
          this.team.members.forEach((e) => {
            if (e._id !== member._id) {
              newMembers.push(e._id);
            }
          });
          const editorIndex = this.editors.findIndex(
            (item) => item._id === member._id
          );
          if (editorIndex >= 0) {
            this.editors.splice(editorIndex, 1);
          }
          const viewerIndex = this.viewers.findIndex(
            (item) => item._id === member._id
          );
          if (viewerIndex >= 0) {
            this.viewers.splice(viewerIndex, 1);
          }
          this.teamService
            .updateTeam(this.teamId, { members: newMembers, editors })
            .subscribe(
              (response) => {
                this.team.members.some((e, index) => {
                  if (e._id === member._id) {
                    this.team.members.splice(index, 1);
                  }
                });
                this.goToBack();
                // this.toast.success('You leaved this team successfully.');
              },
              (err) => {}
            );
        }
      });
  }

  acceptRequest(user): void {
    this.acceptJoinRequest = true;
    this.acceptUserId = user._id;
    this.teamService.acceptRequest(this.teamId, user._id).subscribe(
      (res) => {
        this.acceptJoinRequest = false;
        this.acceptUserId = '';
        this.team.members.push(user);
        this.viewers.push(user);
        this.team.requests.some((e, index) => {
          if (e._id === user._id) {
            this.team.requests.splice(index, 1);
            return true;
          }
        });
      },
      (err) => {
        this.acceptJoinRequest = false;
      }
    );
  }

  declineRequest(user): void {
    this.declineJoinRequest = true;
    this.declineUserId = user._id;
    this.teamService.declineRequest(this.teamId, user._id).subscribe(
      (res) => {
        this.declineJoinRequest = false;
        this.declineUserId = '';
        this.team.requests.some((e, index) => {
          if (e._id === user._id) {
            this.team.requests.splice(index, 1);
            return true;
          }
        });
      },
      (err) => {
        this.declineJoinRequest = false;
      }
    );
  }

  acceptOutRequest(teamId, memberId): void {
    this.accepting = true;
    this.teamService.acceptRequest(teamId, memberId).subscribe(
      (res) => {
        this.accepting = false;
        this.router.navigate(['/team/' + this.teamId + '/members/root']);
        this.loadTeam();
      },
      (err) => {
        this.accepting = false;
        if (err.status === 400) {
          this.dialog
            .open(NotifyComponent, {
              width: '96vw',
              maxWidth: '400px',
              data: {
                message: 'Invalid permission for this team.'
              },
              disableClose: true
            })
            .afterClosed()
            .subscribe((res) => {
              this.router.navigate(['/teams']);
            });
        } else {
          this.router.navigate(['/teams']);
        }
      }
    );
  }

  status(): any {
    if (this.role) {
      return this.role[0].toUpperCase() + this.role.slice(1);
    }
    return this.role;
  }

  changeTab(tab: TabItem): void {
    this.selectedTab = tab;
    this.router.navigate([
      `/team/${this.team._id}/${this.selectedTab.id}/root`
    ]);
  }

  isSelectedPage(): any {
    let selectedMember = false;
    let selectedOwner = false;
    let selectedInvite = false;
    if (this.team.members.length) {
      for (let i = 0; i < this.team.members.length; i++) {
        const e = this.team.members[i];
        if (!this.selectedMembers.isSelected(e._id)) {
          return false;
        }
      }
      selectedMember = true;
    }
    if (this.team.owner.length) {
      for (let i = 0; i < this.team.owner.length; i++) {
        const e = this.team.owner[i];
        if (!this.selectedMembers.isSelected(e._id)) {
          return false;
        }
      }
      selectedOwner = true;
    }
    if (this.team.invites.length) {
      for (let i = 0; i < this.team.invites.length; i++) {
        const e = this.team.invites[i];
        if (!this.selectedMembers.isSelected(e._id)) {
          return false;
        }
      }
      selectedInvite = true;
    }

    if (selectedMember || selectedOwner || selectedInvite) {
      return true;
    }

    return false;
  }
  selectAllJoinRequestPage(): void {
    if (this.isSelectedJoinRequestPage()) {
      this.team.requests.forEach((e) => {
        if (this.selectedJoinRequest.isSelected(e._id)) {
          this.selectedJoinRequest.deselect(e._id);
        }
      });
    } else {
      this.team.requests.forEach((e) => {
        if (!this.selectedJoinRequest.isSelected(e._id)) {
          this.selectedJoinRequest.select(e._id);
        }
      });
    }
  }
  isSelectedJoinRequestPage(): any {
    if (this.team.requests.length) {
      for (let i = 0; i < this.team.requests.length; i++) {
        const e = this.team.requests[i];
        if (!this.selectedJoinRequest.isSelected(e._id)) {
          return false;
        }
      }
      return true;
    }
    return false;
  }
  avatarName(user_name): string {
    if (user_name) {
      const names = user_name.split(' ');
      if (names.length > 1) {
        return names[0][0] + names[1][0];
      } else {
        return names[0][0];
      }
    }
    return 'UN';
  }
  memberStatus(member): any {
    if (this.team.editors.indexOf(member._id) === -1) {
      return 'Viewer';
    } else {
      return 'Editor';
    }
  }

  isSelectedVideos(): any {
    if (this.team.videos.length) {
      for (let i = 0; i < this.team.videos.length; i++) {
        const e = this.team.videos[i];
        if (!this.selectedVideos.isSelected(e._id)) {
          return false;
        }
      }
    }
    return true;
  }

  isSelectedPdfs(): any {
    if (this.team.pdfs.length) {
      for (let i = 0; i < this.team.pdfs.length; i++) {
        const e = this.team.pdfs[i];
        if (!this.selectedPdfs.isSelected(e._id)) {
          return false;
        }
      }
    }
    return true;
  }

  isSelectedImages(): any {
    if (this.team.images.length) {
      for (let i = 0; i < this.team.images.length; i++) {
        const e = this.team.images[i];
        if (!this.selectedImages.isSelected(e._id)) {
          return false;
        }
      }
    }
    return true;
  }
  editTeam(): void {
    this.dialog
      .open(TeamEditComponent, {
        width: '96vw',
        maxWidth: '600px',
        disableClose: true,
        data: {
          team: this.team
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.team = {
            ...this.team,
            name: res.name,
            picture: res.picture
          };
        }
      });
  }

  /**
   * Open Invite member modal and do action
   */
  inviteMember(): void {
    this.dialog
      .open(InviteTeamComponent, {
        ...DialogSettings.INVITE_TEAM,
        data: { ...this.team }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          if (res.invitations) {
            for (const invitation of res.invitations) {
              this.team.invites.push(invitation);
            }
          }
          if (res.referrals) {
            for (const referral of res.referrals) {
              this.team.referrals.push(referral);
            }
          }
        }
      });
  }

  showProfile(member): void {
    this.dialog.open(TeamMemberProfileComponent, {
      data: {
        title: 'Team member',
        member
      }
    });
  }

  getAvatarName(contact): any {
    if (contact.user_name) {
      const names = contact.user_name.split(' ');
      if (names.length > 1) {
        return names[0][0] + names[1][0];
      } else {
        return names[0][0];
      }
    } else if (contact.first_name && contact.last_name) {
      return contact.first_name[0] + contact.last_name[0];
    } else if (contact.first_name && !contact.last_name) {
      return contact.first_name[0];
    } else if (!contact.first_name && contact.last_name) {
      return contact.last_name[0];
    }
    return 'UC';
  }

  getMemberCount(): any {
    let count = 0;
    if (this.team.owner && this.team.owner.length > 0) {
      count += this.team.owner.length;
    }
    if (this.team.members && this.team.members.length > 0) {
      count += this.team.members.length;
    }
    return count;
  }

  getMaterialType(material: any): string {
    if (material.type) {
      if (material.type === 'application/pdf') {
        return 'pdf';
      } else if (material.type.includes('image')) {
        return 'image';
      }
    }
    return 'video';
  }
}
