import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {
  loading = false;
  resetEmail = '';
  submitted = false;
  submitting = false;

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit(): void {}

  sendResetCode(): void {
    this.loading = true;
    this.submitting = true;
    this.userService
      .requestResetPassword(this.resetEmail)
      .subscribe((status) => {
        this.loading = false;
        this.submitting = false;
        if (status) {
          this.router.navigate(['/reset-password'], {
            queryParams: { email: this.resetEmail }
          });
        }
      });
  }
}
