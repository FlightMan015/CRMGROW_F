import {
  Component,
  OnInit,
  NgZone,
  ViewChild,
  ElementRef
} from '@angular/core';
import {
  PACKAGE_LEVEL,
  PHONE_COUNTRIES,
  STRIPE_KEY,
  WIN_TIMEZONE
} from 'src/app/constants/variable.constants';
import { CountryISO } from 'ngx-intl-tel-input';
import { MatDialog } from '@angular/material/dialog';
import { HelperService } from '../../services/helper.service';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { AvatarEditorComponent } from '../../components/avatar-editor/avatar-editor.component';
import { UserService } from '../../services/user.service';
import { validateEmail } from 'src/app/utils/functions';
import { Strings } from '../../constants/strings.constant';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { PhoneInputComponent } from 'src/app/components/phone-input/phone-input.component';
import { StripeScriptTag, StripeCard } from 'stripe-angular';
import { Cookie } from 'src/app/utils/cookie';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  // Constant Variables
  defaultTimeZone = true;
  timezones = WIN_TIMEZONE;
  countries: CountryISO[] = PHONE_COUNTRIES;
  CountryISO = CountryISO;

  step = 1;

  package_level = PACKAGE_LEVEL.PRO.package;
  affiliate_source = '';
  queryParam = '';
  is_trial = true;

  user = {
    user_name: '',
    email: '',
    password: '',
    cell_phone: '',
    phone: {},
    time_zone_info: '',
    level: '',
    is_trial: true,
    promo: ''
  };

  password_type = false;
  termsChecked = false;

  submitted = false;
  saving = false;
  existing = false;
  checkingUser = false;
  checkUserSubscription: Subscription;

  checkingPhone = false;
  phoneExisting = false;
  checkPhoneSubscription: Subscription;

  socialLoading = '';
  isSocialUser = false;
  fullNameRequire = false;

  token = '';
  currentUser = null;

  stripeOptions = {
    classes: {
      base: 'stripe-card form-control',
      complete: '',
      empty: '',
      focus: '',
      invalid: '',
      webkitAutofill: ''
    },
    hidePostalCode: true,
    hideIcon: false,
    iconStyle: 'solid',
    style: {},
    value: {
      postalCode: ''
    },
    disabled: false
  };
  invalidError = 'require';

  promo = '';

  @ViewChild('phoneControl') phoneControl: PhoneInputComponent;
  @ViewChild('stripeCard') card: StripeCard;

  constructor(
    private dialog: MatDialog,
    private helperService: HelperService,
    private toast: ToastrService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private userService: UserService,
    private stripeScriptTag: StripeScriptTag,
    private ngZone: NgZone
  ) {
    if (!this.stripeScriptTag.StripeInstance) {
      this.stripeScriptTag.setPublishableKey(STRIPE_KEY);
    }
  }

  ngOnInit(): void {
    this.socialHandle();
    this.route.queryParams.subscribe((params) => {
      if (params) {
        if (params.email) {
          this.user.email = params.email;
          this.step = 2;
        }
        if (params.is_trial === 'false') {
          this.is_trial = false;
        }
        if (params.level) {
          this.package_level = params.level;
        }
        if (params.affiliate) {
          this.affiliate_source = params.affiliate;
        }
        if (this.affiliate_source || this.package_level) {
          const exUrl = new URL('https://app.crmgrow.com');
          this.package_level &&
            exUrl.searchParams.set('level', this.package_level);
          this.affiliate_source &&
            exUrl.searchParams.set('affiliate', this.affiliate_source);
          this.queryParam = exUrl.search;
        }
      }
    });
  }

  socialHandle(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['code']) {
        const socialType = this.route.snapshot.params['social'];
        switch (socialType) {
          case 'outlook':
            this.socialLoading = socialType;
            this.userService.requestOutlookProfile(params['code']).subscribe(
              (res) => {
                this.socialLoading = '';
                this.location.replaceState('/signup');
                this.user = {
                  ...this.user,
                  ...res['data']
                };
                this.isSocialUser = true;
                if (!this.user.user_name) {
                  this.fullNameRequire = true;
                }
                const { level, affiliate } = this.loadQueryUrl();
                this.package_level = level;
                this.affiliate_source = affiliate;
                this.clearQueryUrl();
                this.step = 2;
              },
              (err) => {
                this.socialLoading = '';
                this.location.replaceState('/signup');
                this.toast.error(
                  `Error: ${
                    err.message || err.error || err.code || err || 'Unknown'
                  }`,
                  Strings.SOCIAL_SIGNUP_ERROR,
                  { timeOut: 3000 }
                );
              }
            );
            break;
          case 'gmail':
            this.socialLoading = socialType;
            this.userService.requestGoogleProfile(params['code']).subscribe(
              (res) => {
                this.socialLoading = '';
                this.location.replaceState('/signup');
                this.user = {
                  ...this.user,
                  ...res['data']
                };
                console.log(
                  'gmail auth ==========>',
                  this.isSocialUser,
                  this.user
                );
                this.isSocialUser = true;
                if (!this.user.user_name) {
                  this.fullNameRequire = true;
                }
                const { level, affiliate } = this.loadQueryUrl();
                this.package_level = level;
                this.affiliate_source = affiliate;
                this.clearQueryUrl();
                this.step = 2;
              },
              (err) => {
                this.socialLoading = '';
                this.location.replaceState('/signup');
                this.toast.error(
                  `Error: ${
                    err.message || err.error || err.code || err || 'Unknown'
                  }`,
                  Strings.SOCIAL_SIGNUP_ERROR,
                  { timeOut: 3000 }
                );
              }
            );
            break;
          default:
            this.step = 1;
        }
      } else {
        // Clear Package Level
        this.clearQueryUrl();
      }
    });
  }

  saveQueryUrl(): void {
    localStorage.setItem('reg_query', this.queryParam);
  }

  clearQueryUrl(): void {
    localStorage.removeItem('reg_query');
  }

  loadQueryUrl(): any {
    const query = localStorage.getItem('reg_query');
    if (query) {
      const exUrl = new URL('https://app.crmgrow.com' + query);
      const level =
        exUrl.searchParams.get('level') || PACKAGE_LEVEL.PRO.package;
      const affiliate = exUrl.searchParams.get('affiliate');
      return {
        level,
        affiliate
      };
    } else {
      return {
        level: PACKAGE_LEVEL.PRO.package,
        affiliate: ''
      };
    }
  }

  gotoBasic(): void {
    this.step = 2;
  }

  fillBasic(): any {
    if (!this.checkingUser && this.existing) {
      return;
    }

    this.step = 3;
  }

  fillProfile(): void {
    if (this.user.phone == '' || this.user.time_zone_info == '') {
      return;
    }
    if (!this.checkingPhone && this.phoneExisting) {
      return;
    }
    if (this.checkPhoneRequired() || !this.checkPhoneValid()) {
      return;
    }
    if (this.invalidError != '') {
      return;
    } else {
      this.saving = true;
      this.card
        .createToken({})
        .then((res) => {
          if (res) {
            this.ngZone.run(() => {
              this.user['token'] = {
                ...res,
                card_name: res.card.brand
              };
              this.signUp();
            });
          } else {
            this.saving = false;
            this.toast.error(res['error']);
            this.invalidError = 'require';
            return;
          }
        })
        .catch((err) => {
          if (err) {
            this.saving = false;
            this.toast.error(err.message);
          }
        });
    }
  }

  cardInvalid(evt: any): void {
    if (evt && evt?.type === 'validation_error') {
      this.invalidError = 'invalid';
    } else {
      this.invalidError = '';
    }
  }

  cardComplete(evt: any): void {
    if (evt) {
      this.invalidError = '';
    } else {
      this.invalidError = 'invalid';
    }
  }

  async signUp() {
    this.user = {
      ...this.user,
      level: this.package_level.toUpperCase(),
      is_trial: this.is_trial,
      promo: this.promo
    };
    if (this.user['picture_profile']) {
      this.user['email_signature'] =
        '<div>' +
        this.user.user_name +
        '<br></div><div>' +
        'eXp Realty, LLC' +
        '<br></div><div>' +
        this.user.email +
        '<br></div><div>' +
        this.user.cell_phone +
        '<br></div>' +
        "<div><img src='" +
        this.user['picture_profile'] +
        '-resize' +
        "' alt='' " +
        "style='width: 100px; height: 100px; border-radius: 50%; object-fit: cover;' /></div>";
    } else {
      this.user['email_signature'] =
        '<div>' +
        this.user.user_name +
        '<br></div><div>' +
        'eXp Realty, LLC' +
        '<br></div><div>' +
        this.user.email +
        '<br></div><div>' +
        this.user.cell_phone +
        '<br></div>' +
        '<div></div>';
    }
    // if (window['Rewardful'] && window['Rewardful'].affiliate) {
    //   this.user['parent_affiliate'] = window['Rewardful'].affiliate;
    // }
    // if (window['Rewardful'] && window['Rewardful'].referral) {
    //   this.user['referral'] = window['Rewardful'].referral;
    // }
    if (
      window['FPROM'] &&
      window['FPROM']['data'] &&
      window['FPROM']['data']['ref_id']
    ) {
      this.user['referred_firstpromoter'] = true;
      const promoter = await this.getPromoterDetail().catch((err) => {
        console.log('promotion info failed', err);
      });
      if (promoter?.offer) {
        this.user['offer'] = promoter?.offer;
      }
    }
    if (this.affiliate_source === 'rewardful') {
      delete this.user['referred_firstpromoter'];
    } else if (this.affiliate_source === 'fpr') {
      delete this.user['parent_affiliate'];
      delete this.user['referral'];
    }
    if (this.package_level.includes('EVO')) {
      this.user['referred_firstpromoter'] = true;
      const promoter = await this.getPromoterDetail('bruce-hill').catch(
        (err) => {
          console.log('promotion info failed', err);
        }
      );
      if (promoter?.offer) {
        this.user['offer'] = promoter?.offer;
      }
    }

    if (this.isSocialUser) {
      this.userService.socialSignUp(this.user).subscribe((res) => {
        if (res && res.status) {
          this.token = res['data']['token'];
          this.currentUser = res['data']['user'];
          if (this.token) {
            this.saving = false;
            Cookie.setLogin(this.currentUser._id);
            this.userService.setToken(this.token);
            this.userService.setUser(this.currentUser);
            // referral register
            if (this.affiliate_source !== 'rewardful') {
              if (
                window['fpr'] &&
                window['FPROM'] &&
                window['FPROM']['data'] &&
                window['FPROM']['data']['ref_id']
              ) {
                window['fpr']('referral', {
                  _id: this.currentUser._id,
                  email: this.user.email,
                  user_name: this.user.user_name
                });
              } else if (this.package_level.includes('EVO')) {
                window['fpr']('referral', {
                  _id: this.currentUser._id,
                  email: this.user.email,
                  user_name: this.user.user_name
                });
              }
            }
            if (this.package_level.indexOf('EVO') === -1) {
              this.router.navigate(['/home'], {
                queryParams: { prev: 'signup' }
              });
            } else {
              this.router.navigate(['/home']);
            }
            // window.location.reload();
          } else {
            this.saving = false;
          }
        } else {
          this.toast.error(res.error);
          this.saving = false;
        }
      });
    } else {
      this.userService.signup(this.user).subscribe((res) => {
        if (res) {
          this.token = res['data']['token'];
          this.currentUser = res['data']['user'];
          if (this.token) {
            this.saving = false;
            Cookie.setLogin(this.currentUser._id);
            this.userService.setToken(this.token);
            this.userService.setUser(this.currentUser);
            // referral register
            if (this.affiliate_source !== 'rewardful') {
              if (
                window['fpr'] &&
                window['FPROM'] &&
                window['FPROM']['data'] &&
                window['FPROM']['data']['ref_id']
              ) {
                window['fpr']('referral', {
                  _id: this.currentUser._id,
                  email: this.user.email,
                  user_name: this.user.user_name
                });
              } else if (this.package_level.includes('EVO')) {
                window['fpr']('referral', {
                  _id: this.currentUser._id,
                  email: this.user.email,
                  user_name: this.user.user_name
                });
              }
            }
            if (this.package_level.indexOf('EVO') === -1) {
              this.router.navigate(['/home'], {
                queryParams: { prev: 'signup' }
              });
            } else {
              this.router.navigate(['/home']);
            }
            // window.location.reload();
          } else {
            this.saving = false;
          }
        } else {
          this.saving = false;
        }
      });
    }
  }

  confirmEmail(): void {
    this.existing = false;
    if (this.user.email && validateEmail(this.user.email)) {
      this.checkingUser = true;
      this.checkUserSubscription && this.checkUserSubscription.unsubscribe();
      this.checkUserSubscription = this.userService
        .checkEmail(this.user.email)
        .subscribe(
          (res) => {
            this.checkingUser = false;
            if (res['status']) {
              this.existing = false;
            } else {
              this.existing = true;
            }
          },
          (err) => {
            this.checkingUser = false;
          }
        );
    }
  }

  confirmPhone(event): void {
    this.phoneExisting = false;
    let cell_phone = '';
    if (event) {
      if (event['e164Number']) {
        cell_phone = event['e164Number'];
      } else {
        const number = event.number.replaceAll('-', '');
        cell_phone = event.dialCode + number;
      }
    }
    if (cell_phone) {
      this.checkingPhone = true;
      this.checkPhoneSubscription && this.checkPhoneSubscription.unsubscribe();
      this.checkPhoneSubscription = this.userService
        .checkPhone(cell_phone)
        .subscribe(
          (res) => {
            this.checkingPhone = false;
            if (res['status']) {
              this.phoneExisting = false;
              this.user.cell_phone = cell_phone;
            } else {
              this.phoneExisting = true;
            }
          },
          (err) => {
            this.checkingPhone = false;
          }
        );
    }
  }

  connectService(type): void {
    this.socialLoading = type;
    this.userService.requestOAuthUrl(type).subscribe(
      (res) => {
        this.socialLoading = '';
        this.saveQueryUrl();
        location.href = res['data'];
      },
      (err) => {
        this.socialLoading = '';
        this.toast.error(
          `Error: ${err.message || err.error || err.code || err || 'Unknown'}`,
          Strings.REQUEST_OAUTH_URL,
          { timeOut: 3000 }
        );
      }
    );
  }

  checkPhoneRequired(): boolean {
    if (!this.user.phone || !this.phoneControl) {
      return true;
    }
    if (!Object.keys(this.user.phone)) {
      return true;
    }
    return false;
  }
  checkPhoneValid(): boolean {
    if (!this.user.phone || !this.phoneControl) {
      return true;
    }
    if (Object.keys(this.user.phone).length && !this.phoneControl.valid) {
      return false;
    }
    return true;
  }

  getPromoterDetail(ref_id: string = null): Promise<any> {
    return new Promise((res, rej) => {
      try {
        const data = {
          include_details: true
        };
        if (ref_id) {
          data['ref_id'] = ref_id;
        }
        window['fpr']('set', data);
        window['fpr']('click');
        window['fpr']('getDetails', (d) => {
          res(d);
        });
      } catch (err) {
        rej(err);
      }
    });
  }

  setOptionValue(timezone) {
    return JSON.stringify(timezone);
  }
}
