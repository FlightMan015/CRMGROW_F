import { Routes } from '@angular/router';
import { LoginComponent } from 'src/app/pages/login/login.component';
import { RegisterComponent } from 'src/app/pages/register/register.component';
import { ForgotPasswordComponent } from '../../pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from '../../pages/reset-password/reset-password.component';
import { CompanyChooseComponent } from '../../pages/company-choose/company-choose.component';
import { ScheduleComponent } from 'src/app/pages/schedule/schedule.component';

export const AuthLayoutRoutes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    data: {
      title: 'Log in'
    }
  },
  {
    path: 'signup',
    component: RegisterComponent,
    data: {
      title: 'Sign Up'
    }
  },
  {
    path: 'signup/:social',
    component: RegisterComponent,
    data: {
      title: 'Sign Up'
    }
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    data: {
      title: 'Password Reset 1'
    }
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    data: {
      title: 'Password Reset 2'
    }
  },
  {
    path: 'company',
    component: CompanyChooseComponent,
    data: {
      title: 'Company'
    }
  },
  {
    path: 'oneonone',
    component: ScheduleComponent,
    data: {
      title: 'Schedule'
    }
  }
];
