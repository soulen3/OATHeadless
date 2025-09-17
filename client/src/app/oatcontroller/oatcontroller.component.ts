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
import { MatDialog } from '@angular/material/dialog';
import { MessageConsoleService } from '../message-console.service';
import { CoordinateDisplayComponent } from '../shared/coordinate-display/coordinate-display.component';
import { ObjectSelectionDialogComponent } from '../shared/object-selection-dialog/object-selection-dialog.component';

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
  isIndiConnected = false;
  cameraStatus = { connected: false, device: null };
  guiderStatus = { connected: false, device: null };

  constructor(
    private http: HttpClient,
    private messageService: MessageConsoleService,
    private dialog: MatDialog
  ) {
    this.targetForm = new FormGroup({
      ra: new FormControl('', [Validators.required]),
      dec: new FormControl('', [Validators.required])
    });
  }

  ngOnInit() {
    this.updatePosition();
    this.updateTrackingStatus();
    this.updateIndiStatus();
    this.updateCameraStatus();
    this.updateGuiderStatus();
    setInterval(() => {
      this.updatePosition();
      this.updateTrackingStatus();
      this.updateIndiStatus();
      this.updateCameraStatus();
      this.updateGuiderStatus();
    }, 5000);
  }

  updateCameraStatus() {
    this.http.get<any>('/api/camera/status').subscribe({
      next: (response) => {
        this.cameraStatus = response;
      },
      error: (error) => {
        this.cameraStatus = { connected: false, device: null };
      }
    });
  }

  updateGuiderStatus() {
    this.http.get<any>('/api/guider/status').subscribe({
      next: (response) => {
        this.guiderStatus = response;
      },
      error: (error) => {
        this.guiderStatus = { connected: false, device: null };
      }
    });
  }

  updateIndiStatus() {
    this.http.get<any>('/api/mount/indi/status').subscribe({
      next: (response) => {
        this.isIndiConnected = response.connected;
      },
      error: (error) => {
        this.isIndiConnected = false;
      }
    });
  }

  toggleIndiConnection() {
    const action = this.isIndiConnected ? 'disconnect' : 'connect';
    this.messageService.addMessage(`${action === 'connect' ? 'Connecting to' : 'Disconnecting from'} INDI server...`, 'info');
    
    this.http.post('/api/mount/indi/connection', { action }).subscribe({
      next: (response: any) => {
        this.isIndiConnected = action === 'connect';
        this.messageService.addMessage(response.message, 'success');
      },
      error: (error) => {
        this.messageService.addMessage('INDI connection failed: ' + (error.error?.error || error.message), 'error');
      }
    });
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

  openObjectDialog() {
    const dialogRef = this.dialog.open(ObjectSelectionDialogComponent, {
      width: '800px',
      height: '600px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.selectCatalogTarget(result);
      }
    });
  }

  selectCatalogTarget(target: any) {
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

  homeRA() {
    this.messageService.addMessage('Homing RA axis...', 'info');
    
    this.http.post('/api/mount/home/ra', {}).subscribe({
      next: (response: any) => {
        this.messageService.addMessage(response.message || 'RA home completed', 'success');
      },
      error: (error) => {
        this.messageService.addMessage('RA home failed: ' + (error.error?.error || error.message), 'error');
      }
    });
  }

  homeDEC() {
    this.messageService.addMessage('Homing DEC axis...', 'info');
    
    this.http.post('/api/mount/home/dec', {}).subscribe({
      next: (response: any) => {
        this.messageService.addMessage(response.message || 'DEC home completed', 'success');
      },
      error: (error) => {
        this.messageService.addMessage('DEC home failed: ' + (error.error?.error || error.message), 'error');
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

  slew() {
    this.messageService.addMessage('Slewing to target...', 'info');
    
    this.http.post('/api/mount/slew', {}).subscribe({
      next: (response: any) => {
        this.messageService.addMessage(response.message, 'success');
      },
      error: (error) => {
        this.messageService.addMessage('Slew failed: ' + (error.error?.error || error.message), 'error');
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
