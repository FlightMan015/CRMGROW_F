import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-buy-account',
  templateUrl: './buy-account.component.html',
  styleUrls: ['./buy-account.component.scss']
})
export class BuyAccountComponent implements OnInit {
  buying = false;

  constructor(
    private userService: UserService,
    private dialogRef: MatDialogRef<BuyAccountComponent>
  ) {}

  ngOnInit(): void {}

  buyAccount(): void {
    this.buying = true;
    this.userService.buySubAccount({}).subscribe((res) => {
      this.buying = false;
      if (res && res['status']) {
        this.dialogRef.close(true);
      }
    });
  }
}
