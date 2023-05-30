import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbToast } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DetailErrorComponent } from '../components/detail-error/detail-error.component';
import { NotifyComponent } from '../components/notify/notify.component';
import { Strings } from '../constants/strings.constant';
import { Cookie } from '../utils/cookie';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  private errorSubject: BehaviorSubject<any[]> = new BehaviorSubject([]);
  public errors$ = this.errorSubject.asObservable();

  lastError = {
    operation: 'Ready',
    message: 'Unknown Error',
    detail: '',
    statusText: '',
    status: 200
  };
  lastTime = new Date().getTime();

  constructor(
    private router: Router,
    private toast: ToastrService,
    private dialog: MatDialog
  ) {}
  addError(operation: string, error: any) {
    const errorObj = {
      operation,
      message: (error.error && error.error.error) || 'Unknown Error',
      detail: error.message,
      statusText: error.statusText,
      status: error.status
    };

    // if (!operation) {
    //   return;
    // }

    // const diffTime = new Date().getTime() - this.lastTime;
    // if (
    //   errorObj.status === 402 ||
    //   errorObj.status === 403 ||
    //   errorObj.status === 406
    // ) {
    //   if (this.lastError.status === errorObj.status) {
    //     return;
    //   }
    // }
    // if (
    //   this.lastError.operation === errorObj.operation &&
    //   this.lastError.status === errorObj.status &&
    //   this.lastError.detail === errorObj.detail &&
    //   diffTime < 2000
    // ) {
    //   return;
    // }
    // if (
    //   this.lastError.status === 0 &&
    //   errorObj.status === 0 &&
    //   diffTime < 3000
    // ) {
    //   return;
    // }
    if (operation === 'GET CONVERT STATUS') {
      return;
    }

    switch (error.status) {
      case 0:
        // Network Error
        if (
          !document.querySelector('.toast-top-center div') &&
          operation !== 'GET NOTIFICATION DELIVERY STATUS'
        ) {
          // this.toast.error(
          //   Strings.NETWORK_ERROR_CONTENT,
          //   Strings.NETWORK_ERROR_TITLE,
          //   {
          //     positionClass: 'toast-top-center',
          //     timeOut: 360000
          //   }
          // );
        }
        break;
      case 401:
        // Authorization Error (Auth Page & Invalid Token)
        if (this.router.url.indexOf('/login') === 0) {
          this.toast.error(errorObj.message, Strings.LOGIN, {
            closeButton: true
          });
        } else {
          this.toast.error(errorObj.message, Strings.AUTHENTICATION, {
            closeButton: true
          });
          this.clearData();
          this.router.navigate(['/']);
        }
        break;
      case 402:
        this.dialog.closeAll();
        this.dialog.open(DetailErrorComponent, {
          width: '98vw',
          maxWidth: '420px',
          disableClose: true,
          data: {
            errorCode: 402
          }
        });
        break;
      case 403:
        this.dialog.closeAll();
        this.dialog.open(DetailErrorComponent, {
          width: '98vw',
          maxWidth: '420px',
          data: {
            errorCode: 403
          }
        });
        break;
      case 405:
        this.dialog.closeAll();
        console.log('error happened', error);
        this.dialog.open(DetailErrorComponent, {
          width: '98vw',
          maxWidth: '420px',
          data: {
            errorCode: 405,
            operation: operation,
            error: error.error
          }
        });
        break;
      case 406:
        this.dialog.closeAll();
        this.dialog.open(DetailErrorComponent, {
          width: '98vw',
          maxWidth: '420px',
          data: {
            errorCode: 406
          }
        });
        break;
      case 407:
        this.dialog.closeAll();
        this.dialog.open(DetailErrorComponent, {
          width: '98vw',
          maxWidth: '420px',
          data: {
            errorCode: 407
          }
        });
        break;
      case 408:
        this.dialog.closeAll();
        this.dialog.open(DetailErrorComponent, {
          position: { top: '100px' },
          width: '100vw',
          maxWidth: '650px',
          disableClose: true,
          data: {
            errorCode: 408
          }
        });
        break;
      case 409:
        this.dialog.closeAll();
        this.dialog.open(DetailErrorComponent, {
          position: { top: '100px' },
          width: '100vw',
          maxWidth: '650px',
          disableClose: true,
          data: {
            errorCode: 409
          }
        });
        break;
      case 410:
        this.dialog.closeAll();
        this.dialog.open(DetailErrorComponent, {
          position: { top: '100px' },
          width: '100vw',
          maxWidth: '450px',
          disableClose: true,
          data: {
            errorCode: 410,
            errorMessage: errorObj.message
          }
        });
        break;
      default:
        if (Array.isArray(errorObj.message)) {
          errorObj.message.forEach((message) => {
            this.toast.error(message, errorObj.operation, {
              closeButton: true
            });
          });
        } else {
          this.toast.error(errorObj.message, errorObj.operation, {
            closeButton: true
          });
        }
        this.errorSubject.next([errorObj, ...this.errorSubject.getValue()]);
    }

    this.lastError = errorObj;
    this.lastTime = new Date().getTime();
  }

  showSuccess(message): void {
    this.toast.success('', message, { closeButton: true });
  }

  clearData(): void {
    localStorage.removeItem('token');
    Cookie.setLogout();
  }

  clear$(): void {
    this.errorSubject.next([]);
  }
}
