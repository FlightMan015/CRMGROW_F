import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Strings } from 'src/app/constants/strings.constant';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  newData = {
    email: '',
    code: '',
    password: ''
  };

  confirm_password = '';

  loading = false;

  submitted = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {
    this.newData.email = this.route.snapshot.queryParams['email'];
  }

  resetPassword(): void {
    this.loading = true;
    const code = this.newData.code.trim();
    this.userService
      .resetPassword({ ...this.newData, code })
      .subscribe((status) => {
        this.loading = false;
        if (status) {
          // this.toast.success('', Strings.RESET_PASSWORD_SUCCESS, {
          //   closeButton: true
          // });
          this.router.navigate(['/login']);
        }
      });
  }
}
