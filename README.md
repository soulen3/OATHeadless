# OATHeadless

A web-based interface for controlling OpenAstroTech (OAT) telescope mounts without requiring a laptop in the field.

## Overview

OATHeadless provides a modern web interface for OAT telescope mount control, featuring a Flask backend with an Angular frontend. The system connects to telescope mounts via serial communication and integrates with INDI server for PHD2 compatibility.

## Architecture

- **Backend**: Flask REST API server with mount control via serial communication
- **Frontend**: Angular web application with Material Design components
- **Mount Communication**: OAT Meade command protocol implementation
- **INDI Integration**: Support for INDI server connection and PHD2 compatibility

## Features

### Mount Control
- **Status Monitoring**: Real-time position (RA/DEC), tracking rate, and slewing status
- **Homing Operations**: Individual axis homing (RA/DEC) and full mount homing using Hall sensors
- **Date/Time Setting**: Sync mount time with device or manual entry
- **Location Setting**: GPS-based or manual coordinate entry with automatic format conversion
- **Firmware Information**: Retrieve and display mount firmware version

### User Interface
- **Material Design**: Modern, responsive Angular interface with Material components
- **Message Console**: Real-time logging of all operations with timestamps and status indicators
- **Settings Management**: Tabbed interface for location, time, and device configuration
- **One-Click Setup**: Automatic location and time configuration from browser

### Technical Features
- **Serial Communication**: Robust mount communication with error handling and logging
- **REST API**: Complete RESTful interface for all mount operations
- **Unit Testing**: Comprehensive test coverage for all backend routes
- **Error Handling**: Detailed error reporting and user feedback

## API Endpoints

### Mount Status
- `GET /mount/status` - Comprehensive mount status
- `GET /mount/position` - Current RA/DEC coordinates
- `GET /mount/tracking` - Current tracking rate
- `GET /mount/firmware` - Firmware version

### Mount Control
- `POST /mount/datetime` - Set mount date and time
- `POST /mount/location` - Set mount coordinates
- `POST /mount/home` - Home both axes
- `POST /mount/home/ra` - Home RA axis
- `POST /mount/home/dec` - Home DEC axis

### Target Management
- `GET /mount/target` - Get current target coordinates
- `POST /mount/target` - Set target coordinates
- **Messier Catalog** - Complete catalog of 110 Messier objects with searchable dialog interface
  - Source: [celestialprogramming.com/snippets/messier.json](https://celestialprogramming.com/snippets/messier.json)
  - Search by object name, type, or constellation
  - Automatic coordinate conversion from decimal to HMS/DMS format

### INDI Integration
- `GET /mount/indi/status` - INDI server connection status
- `POST /mount/indi/connection` - Connect/disconnect INDI

## Setup

### Backend (Flask)
```bash
cd server
pip install -r requirements.txt
python app.py
```

### Frontend (Angular)
```bash
cd client
npm install
npm start
```

### Development
- Backend runs on `http://localhost:5000`
- Frontend runs on `http://localhost:4200`
- API endpoints available at `/api/mount/*`

## Testing

### Backend Tests
```bash
cd server
python -m pytest mount/test_*.py -v
```

### Unit Test Coverage
- Mount route testing with mocked serial communication
- Error condition handling and validation
- INDI integration testing

## Mount Communication

Uses OAT Meade command protocol:
- `:GR#` - Get RA coordinate
- `:GD#` - Get DEC coordinate  
- `:SC#` - Set date
- `:SL#` - Set local time
- `:St#` - Set latitude
- `:Sg#` - Set longitude
- `:GVN#` - Get firmware version
- `:hF#` - Home both axes
- `:MHRL#` - Home RA axis
- `:MHDU#` - Home DEC axis

## Contributing

This project serves as a practical implementation for OAT mount control and a development exercise with modern web technologies.

## License

Open source project for the OpenAstroTech community.
