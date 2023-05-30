import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from 'src/app/models/user.model';
import { UserService } from 'src/app/services/user.service';
import {
  AuthService as GoogleAuth,
  GoogleLoginProvider
} from 'angularx-social-login';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UserAgentApplication } from 'msal';
import { ContactService } from 'src/app/services/contact.service';
import { UpgradePlanErrorComponent } from '../../components/upgrade-plan-error/upgrade-plan-error.component';
import { MatDialog } from '@angular/material/dialog';
import { Cookie } from 'src/app/utils/cookie';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  user = {
    email: '',
    password: ''
  };
  submitting = false;
  returnUrl = '';
  queryParam = '';
  socialLoading = false;
  loading = false;
  loginSubscription: Subscription;

  msalConfig = {
    auth: {
      clientId: environment.ClientId.Outlook,
      redirectUri: environment.RedirectUri.Outlook
    }
  };
  msalInstance = new UserAgentApplication(this.msalConfig);

  @ViewChild('serverFrame') serverWindow: ElementRef;

  constructor(
    private userService: UserService,
    private route: ActivatedRoute,
    private googleAuth: GoogleAuth,
    private router: Router,
    private toastr: ToastrService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
    const level = this.route.snapshot.queryParams['level'];
    const affiliateSource = this.route.snapshot.queryParams['affiliate'];
    if (level || affiliateSource) {
      const exUrl = new URL('https://app.crmgrow.com');
      level && exUrl.searchParams.set('level', level);
      affiliateSource && exUrl.searchParams.set('affiliate', affiliateSource);
      this.queryParam = exUrl.search;
    }
  }

  login(): void {
    // Login
    this.submitting = true;
    this.userService.login(this.user).subscribe((res) => {
      this.submitting = false;
      if (!res) {
        return;
      }
      if (res['code']) {
        if (res['code'] == 'SOCIAL_SIGN_gmail') {
          this.signInGoogle();
        } else {
          this.signInOutlook();
        }
      } else {
        // Save the user token and profile information
        this.goHome(res['data']);
      }
    });
  }

  signInGoogle(): void {
    this.socialLoading = true;
    this.googleAuth
      .signIn(GoogleLoginProvider.PROVIDER_ID)
      .then((userData) => {
        const user = {
          social_id: userData.id
        };
        this.signWithSocial(user);
      })
      .catch((err) => {
        this.socialLoading = false;
        this.toastr.error(
          `Google authentication is failed with error (${
            err.message || err.error || err || ''
          })`,
          'Google SignIn',
          {
            timeOut: 3000
          }
        );
      });
  }

  signInOutlook(): void {
    const loginRequest = {
      scopes: ['user.read'],
      prompt: 'select_account'
    };

    this.socialLoading = true;
    this.msalInstance
      .loginPopup(loginRequest)
      .then((userData) => {
        const user = {
          social_id: userData.account.accountIdentifier
        };
        this.signWithSocial(user);
      })
      .catch((err) => {
        this.socialLoading = false;
        this.toastr.error(
          `Outlook authentication is failed with error (${
            err.message || err.error || ''
          })`,
          'Outlook Signin',
          {
            timeOut: 3000
          }
        );
      });
  }

  signWithSocial(user): void {
    this.loading = true;
    this.loginSubscription = this.userService.socialSignIn(user).subscribe(
      (res) => {
        this.socialLoading = false;
        this.goHome(res['data']);
      },
      (err) => {
        this.socialLoading = false;
        this.loading = false;
      }
    );
  }

  goHome(data: any): void {
    Cookie.setLogin(data.user._id);
    console.log('*******',data.user._id);
    if (
      data.user &&
      data.user.subscription &&
      data.user.subscription.is_failed
    ) {
      this.returnUrl = '/profile/billing';
      this.router.navigate([this.returnUrl]);
      this.dialog.open(UpgradePlanErrorComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '450px',
        disableClose: true
      });
    }
    if (data?.guest_loggin) {
      localStorage.setItem('guest_loggin', data.guest_loggin);
    }
    localStorage.setItem('primary_loggin', data.user.is_primary);
    this.userService.setToken(data['token']);
    this.userService.setProfile(data['user']);
    this.router.navigate([this.returnUrl]);
  }
}
