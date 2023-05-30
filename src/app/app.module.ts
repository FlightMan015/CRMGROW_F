import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import {
  HttpClient,
  HttpClientModule,
  HTTP_INTERCEPTORS
} from '@angular/common/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrModule } from 'ngx-toastr';
import { ComponentsModule } from 'src/app/components/components.module';
import { AppRoutingModule } from './app-routing.module';
import { ApiInterceptor } from 'src/app/interceptors/api.interceptor';
import { PageExitGuard } from './guards/page-exit.guard';
import { AppComponent } from './app.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { environment } from '../environments/environment';
import { MatSidenavModule } from '@angular/material/sidenav';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { PageBuilderComponent } from './pages/page-builder/page-builder.component';

const config: SocketIoConfig = {
  url: environment.server + '/application',
  options: {}
};

export function HttpLoaderFactory(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient);
}

@NgModule({
  declarations: [
    AppComponent,
    AuthLayoutComponent,
    AdminLayoutComponent,
    PageBuilderComponent
  ],
  imports: [
    BrowserAnimationsModule,
    RouterModule,
    FormsModule,
    AppRoutingModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production
    }),
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    NgbModule,
    MatSidenavModule,
    ComponentsModule,
    ToastrModule.forRoot({
      positionClass: 'toast-top-center'
    }),
    SocketIoModule.forRoot(config)
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi: true },
    PageExitGuard
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
