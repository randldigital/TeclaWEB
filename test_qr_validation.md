# QR Validation Event Handler Test Plan

## 🧪 Unit Tests

### 1. Event Handler Functions
```typescript
// Test handleNewUnvalidatedTicket
describe('handleNewUnvalidatedTicket', () => {
  it('should trigger exactly once for new unvalidated tickets', () => {
    const mockTicket = { id: 'TICKET-123', status: 'Pendiente' };
    const handler = jest.fn();
    handleNewUnvalidatedTicket(mockTicket);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should add ticket to processedTickets set', () => {
    const mockTicket = { id: 'TICKET-123', status: 'Pendiente' };
    const initialSet = new Set();
    const result = addToProcessedTickets(initialSet, mockTicket.id);
    expect(result.has(mockTicket.id)).toBe(true);
  });

  it('should play distinctive audio pattern', () => {
    const mockAudioContext = { createOscillator: jest.fn() };
    window.AudioContext = jest.fn(() => mockAudioContext);
    handleNewUnvalidatedTicket(mockTicket);
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });
});

// Test handleAlreadyValidatedTicket
describe('handleAlreadyValidatedTicket', () => {
  it('should trigger for already validated tickets', () => {
    const mockTicket = { id: 'TICKET-456', status: 'Pagado' };
    const handler = jest.fn();
    handleAlreadyValidatedTicket(mockTicket);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should play warning audio pattern', () => {
    const mockAudioContext = { createOscillator: jest.fn() };
    window.AudioContext = jest.fn(() => mockAudioContext);
    handleAlreadyValidatedTicket(mockTicket);
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });
});
```

### 2. Duplicate Prevention
```typescript
describe('Duplicate Prevention', () => {
  it('should prevent duplicate processing of same ticket', () => {
    const ticketId = 'TICKET-123';
    const processedTickets = new Set([ticketId]);
    const result = isTicketProcessed(processedTickets, ticketId);
    expect(result).toBe(true);
  });

  it('should allow processing of different tickets', () => {
    const processedTickets = new Set(['TICKET-123']);
    const result = isTicketProcessed(processedTickets, 'TICKET-456');
    expect(result).toBe(false);
  });
});
```

### 3. Status Routing
```typescript
describe('Status Routing', () => {
  it('should route Pendiente tickets to new unvalidated handler', () => {
    const ticketData = { id: 'TICKET-123', status: 'Pendiente' };
    const newHandler = jest.fn();
    const validatedHandler = jest.fn();
    
    routeTicketByStatus(ticketData, newHandler, validatedHandler);
    
    expect(newHandler).toHaveBeenCalledWith(ticketData);
    expect(validatedHandler).not.toHaveBeenCalled();
  });

  it('should route Pagado tickets to already validated handler', () => {
    const ticketData = { id: 'TICKET-456', status: 'Pagado' };
    const newHandler = jest.fn();
    const validatedHandler = jest.fn();
    
    routeTicketByStatus(ticketData, newHandler, validatedHandler);
    
    expect(validatedHandler).toHaveBeenCalledWith(ticketData);
    expect(newHandler).not.toHaveBeenCalled();
  });
});
```

## 🔄 Integration Tests

### 1. End-to-End QR Detection Flow
```typescript
describe('QR Detection Integration', () => {
  it('should detect QR → validate → trigger appropriate handler', async () => {
    // Mock QR detection
    const qrData = 'TICKET-1756214993403-nl265v1u6';
    
    // Mock validation response
    const mockResponse = {
      id: 'TICKET-1756214993403-nl265v1u6',
      status: 'Pendiente',
      playTitle: 'Romeo y Julieta',
      userName: 'Usuario de Prueba'
    };
    
    // Simulate flow
    const result = await simulateQRFlow(qrData, mockResponse);
    
    expect(result.handlerCalled).toBe('newUnvalidated');
    expect(result.audioPlayed).toBe(true);
    expect(result.modalShown).toBe(true);
    expect(result.scanningPaused).toBe(true);
  });
});
```

### 2. Session Management
```typescript
describe('Session Management', () => {
  it('should reset processed tickets on new scanning session', () => {
    const initialSet = new Set(['TICKET-123', 'TICKET-456']);
    const resetSet = resetProcessedTickets(initialSet);
    expect(resetSet.size).toBe(0);
  });

  it('should maintain processed tickets during same session', () => {
    const session = new ValidationSession();
    session.processTicket('TICKET-123');
    session.processTicket('TICKET-456');
    
    expect(session.isProcessed('TICKET-123')).toBe(true);
    expect(session.isProcessed('TICKET-456')).toBe(true);
    expect(session.isProcessed('TICKET-789')).toBe(false);
  });
});
```

## ✅ Acceptance Criteria

### **🎯 Core Functionality**
- [ ] **Event handler runs exactly once** for each new unvalidated ticket
- [ ] **Event handler does NOT run** for already validated/used tickets
- [ ] **Duplicate scans of same QR** do not cause multiple triggers
- [ ] **Session-based tracking** prevents reprocessing within same session
- [ ] **Status-based routing** directs tickets to appropriate handlers

### **🔊 Audio Feedback**
- [ ] **Distinctive sound pattern** plays for new unvalidated tickets (4-tone ascending)
- [ ] **Warning sound pattern** plays for already validated tickets (3-tone low frequency)
- [ ] **Audio feedback is optional** and gracefully handles unsupported browsers

### **🎨 Visual Feedback**
- [ ] **Specific success messages** for different ticket statuses
- [ ] **Modal alerts** clearly indicate ticket status (Pendiente/Pagado)
- [ ] **Color-coded badges** show ticket status (blue for pending, red for paid)
- [ ] **Scanning state indicators** show when system is paused for user action

### **⚡ Performance & Reliability**
- [ ] **RequestAnimationFrame** used for smooth scanning performance
- [ ] **Proper cleanup** prevents memory leaks and duplicate event listeners
- [ ] **Error handling** gracefully manages network failures and invalid responses
- [ ] **Timeout management** prevents infinite scanning loops

### **🔄 User Experience**
- [ ] **Automatic resumption** of scanning after user actions (confirm/cancel)
- [ ] **Clear visual states** for all scanning phases (active, paused, error)
- [ ] **Intuitive button labels** change based on current state
- [ ] **Responsive design** works on mobile and desktop devices

### **🧪 Testing Coverage**
- [ ] **Unit tests** cover all event handler functions
- [ ] **Integration tests** verify end-to-end QR detection flow
- [ ] **Edge case testing** handles invalid QR codes, network errors, etc.
- [ ] **Cross-browser testing** ensures compatibility with major browsers

## 🚀 Test Execution

### **Manual Testing Steps**
1. **Start validation session** with weekly code
2. **Scan unvalidated ticket** → Verify new unvalidated handler triggers
3. **Scan same ticket again** → Verify duplicate prevention
4. **Scan validated ticket** → Verify already validated handler triggers
5. **Confirm payment** → Verify scanning resumes automatically
6. **Cancel modal** → Verify scanning resumes automatically
7. **Start new session** → Verify processed tickets reset

### **Automated Testing Commands**
```bash
# Run unit tests
npm test -- --testPathPattern="qr-validation"

# Run integration tests
npm run test:integration -- --testPathPattern="qr-flow"

# Run specific test suite
npm test -- --testNamePattern="handleNewUnvalidatedTicket"
```

## 📊 Success Metrics
- **100% handler trigger rate** for new unvalidated tickets
- **0% duplicate triggers** for same ticket in same session
- **<100ms response time** for event handler execution
- **100% audio feedback success** on supported browsers
- **100% visual feedback consistency** across all states 