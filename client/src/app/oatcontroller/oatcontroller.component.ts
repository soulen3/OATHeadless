import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MessageConsoleService } from '../message-console.service';
import { CoordinateDisplayComponent } from '../shared/coordinate-display/coordinate-display.component';

interface CatalogObject {
  name: string;
  ra: string;
  dec: string;
  type: string;
  magnitude: number;
}

@Component({
  selector: 'app-oatcontroller',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatGridListModule,
    MatSelectModule,
    MatTableModule,
    CoordinateDisplayComponent
  ],
  templateUrl: './oatcontroller.component.html',
  styleUrl: './oatcontroller.component.sass'
})
export class OATControllerComponent implements OnInit {
  currentPosition = { ra: '--:--:--', dec: '--:--:--' };
  targetForm: FormGroup;
  isConnected = false;
  isTracking = false;
  
  starCatalog: CatalogObject[] = [
    { name: 'Sirius', ra: '06:45:09', dec: '-16:42:58', type: 'Star', magnitude: -1.46 },
    { name: 'Canopus', ra: '06:23:57', dec: '-52:41:44', type: 'Star', magnitude: -0.74 },
    { name: 'Arcturus', ra: '14:15:40', dec: '+19:10:57', type: 'Star', magnitude: -0.05 },
    { name: 'Vega', ra: '18:36:56', dec: '+38:47:01', type: 'Star', magnitude: 0.03 },
    { name: 'Capella', ra: '05:16:41', dec: '+45:59:53', type: 'Star', magnitude: 0.08 },
    { name: 'Rigel', ra: '05:14:32', dec: '-08:12:06', type: 'Star', magnitude: 0.13 },
    { name: 'Procyon', ra: '07:39:18', dec: '+05:13:30', type: 'Star', magnitude: 0.34 },
    { name: 'Betelgeuse', ra: '05:55:10', dec: '+07:24:25', type: 'Star', magnitude: 0.50 },
    { name: 'M31 (Andromeda)', ra: '00:42:44', dec: '+41:16:09', type: 'Galaxy', magnitude: 3.44 },
    { name: 'M42 (Orion Nebula)', ra: '05:35:17', dec: '-05:23:14', type: 'Nebula', magnitude: 4.0 },
    { name: 'M45 (Pleiades)', ra: '03:47:29', dec: '+24:07:00', type: 'Cluster', magnitude: 1.6 },
    { name: 'M13 (Hercules)', ra: '16:41:41', dec: '+36:27:37', type: 'Cluster', magnitude: 5.8 }
  ];

  displayedColumns: string[] = ['name', 'type', 'magnitude', 'coordinates', 'action'];

  constructor(
    private http: HttpClient,
    private messageService: MessageConsoleService
  ) {
    this.targetForm = new FormGroup({
      ra: new FormControl('', [Validators.required]),
      dec: new FormControl('', [Validators.required])
    });
  }

  ngOnInit() {
    this.updatePosition();
    this.updateTrackingStatus();
  }

  updateTrackingStatus() {
    this.http.get<any>('/api/mount/tracking').subscribe({
      next: (response) => {
        this.isTracking = response.tracking;
      },
      error: (error) => {
        this.messageService.addMessage('Failed to get tracking status: ' + (error.error?.error || error.message), 'error');
      }
    });
  }

  toggleTracking() {
    const newState = !this.isTracking;
    this.messageService.addMessage(`${newState ? 'Enabling' : 'Disabling'} tracking...`, 'info');
    
    this.http.post('/api/mount/tracking', { enabled: newState }).subscribe({
      next: (response: any) => {
        this.isTracking = newState;
        this.messageService.addMessage(response.message, 'success');
      },
      error: (error) => {
        this.messageService.addMessage('Failed to change tracking: ' + (error.error?.error || error.message), 'error');
      }
    });
  }

  selectCatalogTarget(target: CatalogObject) {
    this.targetForm.patchValue({
      ra: target.ra,
      dec: target.dec
    });
    this.messageService.addMessage(`Selected ${target.name} as target`, 'info');
  }

  updatePosition() {
    this.http.get<any>('/api/mount/position').subscribe({
      next: (response) => {
        this.currentPosition = response;
        this.isConnected = true;
      },
      error: (error) => {
        this.isConnected = false;
        this.messageService.addMessage('Failed to get position: ' + (error.error?.error || error.message), 'error');
      }
    });
  }

  autoHome() {
    this.messageService.addMessage('Starting auto-home sequence...', 'info');
    
    this.http.post('/api/mount/home', {}).subscribe({
      next: (response: any) => {
        this.messageService.addMessage(response.message || 'Auto-home completed', 'success');
      },
      error: (error) => {
        this.messageService.addMessage('Auto-home failed: ' + (error.error?.error || error.message), 'error');
      }
    });
  }

  setHome() {
    this.messageService.addMessage('Setting current position as home...', 'info');
    
    this.http.post('/api/mount/home/set', {}).subscribe({
      next: (response: any) => {
        this.messageService.addMessage(response.message, 'success');
      },
      error: (error) => {
        this.messageService.addMessage('Failed to set home: ' + (error.error?.error || error.message), 'error');
      }
    });
  }

  gotoHome() {
    this.messageService.addMessage('Moving to home position...', 'info');
    
    this.http.post('/api/mount/home/goto', {}).subscribe({
      next: (response: any) => {
        this.messageService.addMessage(response.message, 'success');
      },
      error: (error) => {
        this.messageService.addMessage('Failed to go to home: ' + (error.error?.error || error.message), 'error');
      }
    });
  }

  park() {
    this.messageService.addMessage('Parking mount...', 'info');
    
    this.http.post('/api/mount/park', {}).subscribe({
      next: (response: any) => {
        this.messageService.addMessage(response.message, 'success');
      },
      error: (error) => {
        this.messageService.addMessage('Failed to park: ' + (error.error?.error || error.message), 'error');
      }
    });
  }

  setTarget() {
    if (this.targetForm.valid) {
      const target = this.targetForm.value;
      this.messageService.addMessage(`Setting target to RA: ${target.ra}, DEC: ${target.dec}`, 'info');
      
      this.http.post('/api/mount/target', target).subscribe({
        next: (response: any) => {
          this.messageService.addMessage('Target set successfully', 'success');
        },
        error: (error) => {
          this.messageService.addMessage('Failed to set target: ' + (error.error?.error || error.message), 'error');
        }
      });
    }
  }

  manualMove(direction: string) {
    this.messageService.addMessage(`Manual move: ${direction}`, 'info');
    
    this.http.post('/api/mount/move', { direction }).subscribe({
      next: (response: any) => {
        this.messageService.addMessage(response.message, 'success');
      },
      error: (error) => {
        this.messageService.addMessage('Manual move failed: ' + (error.error?.error || error.message), 'error');
      }
    });
  }
}
