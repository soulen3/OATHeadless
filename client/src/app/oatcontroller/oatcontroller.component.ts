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
  homingOffsetForm: FormGroup;
  isConnected = false;
  isTracking = false;
  isIndiConnected = false;
  isIndiServerRunning = false;
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

    this.homingOffsetForm = new FormGroup({
      raOffset: new FormControl(0),
      decOffset: new FormControl(0)
    });
  }

  ngOnInit() {
    this.updateAllStatus();
    setInterval(() => {
      this.updateAllStatus();
    }, 5000);
  }

  updateAllStatus() {
    this.http.get<any>('/api/mount/status/all').subscribe({
      next: (response) => {
        // Mount status
        this.isConnected = response.mount.connected;
        this.currentPosition = response.mount.position;
        this.isTracking = response.mount.tracking;
        this.isIndiConnected = response.mount.indi_connected;
        this.isIndiServerRunning = response.mount.indi_server_running;
        
        // Device status
        this.cameraStatus = response.camera;
        this.guiderStatus = response.guider;
      },
      error: (error) => {
        this.isConnected = false;
        this.cameraStatus = { connected: false, device: null };
        this.guiderStatus = { connected: false, device: null };
      }
    });
  }

  startIndiServer() {
    this.messageService.addMessage('Starting INDI server...', 'info');
    
    this.http.post('/api/mount/indi/server', { action: 'start' }).subscribe({
      next: (response: any) => {
        this.messageService.addMessage(response.message, 'success');
      },
      error: (error) => {
        this.messageService.addMessage('Failed to start INDI server: ' + (error.error?.error || error.message), 'error');
      }
    });
  }

  stopIndiServer() {
    this.messageService.addMessage('Stopping INDI server...', 'info');
    
    this.http.post('/api/mount/indi/server', { action: 'stop' }).subscribe({
      next: (response: any) => {
        this.messageService.addMessage(response.message, 'success');
      },
      error: (error) => {
        this.messageService.addMessage('Failed to stop INDI server: ' + (error.error?.error || error.message), 'error');
      }
    });
  }

  toggleIndiConnection() {
    const connect = !this.isIndiConnected;
    this.messageService.addMessage(`${connect ? 'Connecting to' : 'Disconnecting from'} INDI server...`, 'info');
    
    this.http.post('/api/mount/indi/connection', { connect }).subscribe({
      next: (response: any) => {
        this.messageService.addMessage(response.message, 'success');
        // Update status immediately to reflect change
        this.updateAllStatus();
      },
      error: (error) => {
        this.messageService.addMessage('INDI connection failed: ' + (error.error?.error || error.message), 'error');
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
      height: '600px',
      panelClass: 'custom-dialog-container'
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

  setHomingOffset() {
    const offsets = this.homingOffsetForm.value;
    this.messageService.addMessage(`Setting homing offset: RA ${offsets.raOffset}, DEC ${offsets.decOffset}`, 'info');
    
    this.http.post('/api/mount/home/offset', offsets).subscribe({
      next: (response: any) => {
        this.messageService.addMessage('Homing offset set successfully', 'success');
      },
      error: (error) => {
        this.messageService.addMessage('Failed to set homing offset: ' + (error.error?.error || error.message), 'error');
      }
    });
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
