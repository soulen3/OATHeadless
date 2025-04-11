import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Material Modules
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';

// Custom Modules
import { ThemeService } from './theme/theme.service';
import { OATControllerComponent } from './OATController/OATController.component';
import { SettingsComponent } from './settings/settings.component';
import { CameraComponent } from './camera/camera.component';
import { GuiderComponent } from './guider/guider.component';
import { HomeComponent } from './home/.homecomponent';

@NgModule({
  declarations: [
    AppComponent,
    ThemeService,
    OATControllerComponent,
    HomeComponent,
    SettingsComponent,
    CameraComponent,
    GuiderComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    RouterModule.forRoot(routes),
    ReactiveFormsModule,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
  ],
  providers: [ThemeService],
  bootstrap: [AppComponent],
})
export class AppModule {}
