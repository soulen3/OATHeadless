import { Routes } from '@angular/router';
import { OATControllerComponent } from './oatcontroller/oatcontroller.component';
import { HomeComponent } from './home/home.component';
import { CameraComponent } from './camera/camera.component';
import { GuiderComponent } from './guider/guider.component';
import { SettingsComponent } from './settings/settings.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, data: { title: 'OATHeadless' } },
  {
    path: 'oatcontroller',
    component: OATControllerComponent,
    data: { title: 'OATControl' },
  },
  { path: 'camera', component: CameraComponent, data: { title: 'Camera' } },
  { path: 'guider', component: GuiderComponent, data: { title: 'Guider' } },
  {
    path: 'settings',
    component: SettingsComponent,
    data: { title: 'Settings' },
  },
];
