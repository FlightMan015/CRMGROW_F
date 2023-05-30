import { Component, OnInit } from '@angular/core';
import { TabItem } from '../../utils/data.types';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-teams',
  templateUrl: './teams.component.html',
  styleUrls: ['./teams.component.scss']
})
export class TeamsComponent implements OnInit {
  tabs: TabItem[] = [
    { icon: '', label: 'MY TEAMS', id: 'teams' },
    { icon: '', label: 'GROUP CALLS', id: 'calls' }
  ];

  selectedTab: TabItem = this.tabs[0];

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const selectedTab = this.route.snapshot.params['tab'];
    if (selectedTab === 'call') {
      this.selectedTab = this.tabs[1];
    }
  }

  changeTab(tab: TabItem): void {
    this.selectedTab = tab;
    if (this.selectedTab.id === 'teams') {
      this.router.navigate(['/teams']);
    } else {
      this.router.navigate(['/teams/call/inquiry']);
    }
  }
}
