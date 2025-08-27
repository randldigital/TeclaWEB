# Test QR Codes for Validation System

## Real Database Integration ✅

The system now uses **real database storage** instead of mock data. All tickets are stored in the SQLite database (`teclaweb.db`) and can be validated through the scanner.

## Valid Ticket QR Codes
These QR codes should be detected and validated successfully:

1. **Test Ticket 1**: `TICKET-1756214993403-nl265v1u6` (Pendiente - A1)
2. **Test Ticket 2**: `TICKET-1756214993404-abc123def` (Pagado - C3) ✅ **Recently validated**
3. **Test Ticket 3**: `TICKET-1756215517380-zozlc79fx` (Pagado - B2)
4. **Test Ticket 4**: `TICKET-1756287933457-jy598algs` (Pagado - D4) ✅ **Recently validated**

## Database Status Tracking

### ✅ **Real Database Features:**
- **Persistent Storage**: Tickets survive server restarts
- **Status Updates**: Real-time status changes from "Pendiente" to "Pagado"
- **Timestamp Tracking**: `paidAt` timestamps when tickets are validated
- **Validation Logging**: All validation events are logged in the database

### 🔄 **Complete Validation Flow:**
1. **QR Detection** → Scanner reads ticket ID from QR code
2. **Database Lookup** → System queries real database for ticket
3. **Status Check** → Returns current status (Pendiente/Pagado)
4. **User Action** → Confirm payment or cancel
5. **Database Update** → Status changes to "Pagado" with timestamp
6. **Validation Log** → Event logged in database

## API Endpoints for Testing

### Weekly Code Validation
```bash
curl -X POST https://localhost:5001/api/validation/weekly-code \
  -H "Content-Type: application/json" \
  -d '{"code":"12345"}' \
  -k
```

### Ticket Validation
```bash
curl -X POST https://localhost:5001/api/validation/ticket/TICKET-1756214993404-abc123def \
  -H "Content-Type: application/json" \
  -d '{"weeklyCode":"12345"}' \
  -k
```

### Payment Confirmation
```bash
curl -X POST https://localhost:5001/api/validation/confirm-payment/TICKET-1756214993404-abc123def \
  -H "Content-Type: application/json" \
  -d '{"weeklyCode":"12345"}' \
  -k
```

## Test Results

### ✅ **Recent Validation Tests:**
- **TICKET-1756287933457-jy598algs**: Successfully validated and status changed to "Pagado"
- **TICKET-1756214993404-abc123def**: Successfully validated and status changed to "Pagado"
- **Status Persistence**: Verified that status changes are persistent across server restarts
- **Timestamp Tracking**: `paidAt` timestamps are correctly recorded

### 🎯 **Scanner Behavior:**
- **New Tickets (Pendiente)**: Shows "NUEVO TICKET PENDIENTE" message, pauses scanning, waits for payment confirmation
- **Validated Tickets (Pagado)**: Shows "TICKET YA VALIDADO" warning message
- **Invalid Tickets**: Shows "ACCESO DENEGADO" error message
- **Network Errors**: Shows "Error de conexión" with automatic retry

## Database Schema

The system uses SQLite with the following key tables:

```sql
-- Tickets table
CREATE TABLE tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  play_id TEXT NOT NULL,
  qr_code TEXT NOT NULL,
  seat_number TEXT,
  status TEXT DEFAULT 'Pendiente' NOT NULL,
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Settings table for weekly codes and validation logs
CREATE TABLE settings (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

## Production Ready ✅

The system is now **production ready** with:
- ✅ Real database storage
- ✅ Persistent ticket data
- ✅ Real-time status updates
- ✅ Comprehensive error handling
- ✅ Validation logging
- ✅ Performance optimizations 