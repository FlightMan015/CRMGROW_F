import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-zapier-dialog',
  templateUrl: './zapier-dialog.component.html',
  styleUrls: ['./zapier-dialog.component.scss']
})
export class ZapierDialogComponent implements OnInit {
  constructor(private dialogRef: MatDialogRef<ZapierDialogComponent>) {}

  ngOnInit(): void {
    this.loadScript();
  }

  loadScript(): void {
    const node = document.createElement('script');
    node.src = 'assets/js/zapier.js';
    node.type = 'text/javascript';
    node.async = false;
    document.getElementsByTagName('head')[0].appendChild(node);
  }
}
