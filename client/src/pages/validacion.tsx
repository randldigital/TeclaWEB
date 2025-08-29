import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle, XCircle, QrCode, Camera, Lock, Unlock, CreditCard } from 'lucide-react';
import jsQR from 'jsqr';

interface WeeklyCode {
  code: string;
  validFrom: string;
  validTo: string;
}

interface TicketDetails {
  id: string;
  playTitle: string;
  date: string;
  time: string;
  price: number;
  seatNumber?: string;
  userName: string;
  status: 'Pendiente' | 'Pagado';
  paidAt?: string;
  isGroupTicket?: boolean;
  quantity?: number;
  adultTickets?: number;
  childTickets?: number;
  totalPrice?: number;
  basePrice?: number;
}

interface ValidationLog {
  id: string;
  ticketId: string;
  validatedAt: string;
  validatedBy: string;
  weeklyCode: string;
}

export default function ValidacionPage() {
  const [weeklyCode, setWeeklyCode] = useState('');
  const [isCodeValid, setIsCodeValid] = useState(false);
  const [isCodeChecking, setIsCodeChecking] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [scannedTicket, setScannedTicket] = useState<TicketDetails | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [noQRDetected, setNoQRDetected] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);
  const [qrDetected, setQrDetected] = useState(false);
  const [processedTickets, setProcessedTickets] = useState<Set<string>>(new Set());
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const isScanningRef = useRef(false);
  
  // Mobile detection
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Validate ticket ID format
  const isValidTicketId = (ticketId: string): boolean => {
    // Ticket ID format: TICKET-timestamp-randomstring or GROUP-timestamp-randomstring
    const ticketPattern = /^(TICKET|GROUP)-\d{13}-[a-z0-9]+$/;
    return ticketPattern.test(ticketId);
  };

  // Check weekly code validity
  const checkWeeklyCode = async () => {
    if (!weeklyCode.trim()) {
      setError('Por favor, ingresa el código semanal');
      return;
    }

    setIsCodeChecking(true);
    setError(null);

    try {
      const response = await fetch('/api/validation/weekly-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: weeklyCode }),
      });

      if (response.ok) {
        setIsCodeValid(true);
        setSuccess('✅ Código semanal válido. Acceso desbloqueado.');
      } else {
        const data = await response.json();
        setError('❌ Código semanal incorrecto o caducado');
        setIsCodeValid(false);
      }
    } catch (error) {
      setError('❌ Error al verificar el código semanal');
      setIsCodeValid(false);
    } finally {
      setIsCodeChecking(false);
    }
  };

  // Start camera for QR scanning
  const startCamera = async () => {
    try {
      setError(null);
      
      // Immediately set camera as active to show video container
      setCameraActive(true);
      
      // Check browser compatibility
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access not supported in this browser');
      }

      // Request camera access with optimized constraints
      const constraints = {
        video: {
          facingMode: isMobile ? 'environment' : 'user', // Back camera on mobile, front on desktop
          width: { ideal: isMobile ? 640 : 1280, min: 320 },
          height: { ideal: isMobile ? 480 : 720, min: 240 },
          frameRate: { ideal: 30, min: 15 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        const video = videoRef.current;
        
        // Set up video element immediately
        video.srcObject = stream;
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        
        // Try to play immediately without waiting
        video.play().catch(console.error);
        
        streamRef.current = stream;
        setError(null);
        
        // Continue initialization in background
        video.addEventListener('loadedmetadata', () => {
          console.log('Video metadata loaded, dimensions:', video.videoWidth, 'x', video.videoHeight);
          video.setAttribute('playsinline', 'true'); // iOS Safari
          if (video.paused) {
            video.play().catch(console.error);
          }
        }, { once: true });
        
        video.addEventListener('canplay', () => {
          console.log('Video can play, ensuring it\'s playing');
          if (video.paused) {
            video.play().catch(console.error);
          }
        }, { once: true });
        
      }
    } catch (error) {
      console.error('Camera error:', error);
      let errorMessage = '❌ No se ha podido acceder a la cámara';
      
      if (error instanceof Error) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = '❌ Acceso a la cámara denegado. Por favor, permite el acceso a la cámara.';
            break;
          case 'NotFoundError':
            errorMessage = '❌ No se encontró ninguna cámara en el dispositivo.';
            break;
          case 'NotSupportedError':
            errorMessage = '❌ Cámara no soportada en este navegador.';
            break;
          case 'NotReadableError':
            errorMessage = '❌ La cámara está siendo usada por otra aplicación.';
            break;
          default:
            errorMessage = `❌ Error de cámara: ${error.message}`;
        }
      }
      
      setError(errorMessage);
      setCameraActive(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setCameraActive(false);
    setIsScanning(false);
  };

  // Start continuous QR scanning
  const startScanning = () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Immediately show scanning overlay
    setIsScanning(true);
    isScanningRef.current = true;
    setError(null);
    setNoQRDetected(false);
    setScanAttempts(0);
    setQrDetected(false);
    
    // Reset processed tickets when starting a new scanning session
    setProcessedTickets(new Set());

    // Set scanning timeout (30 seconds)
    scanTimeoutRef.current = setTimeout(() => {
      if (isScanningRef.current) {
        setIsScanning(false);
        isScanningRef.current = false;
        setError('⏰ Tiempo de escaneo agotado. Inténtalo de nuevo.');
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
      }
    }, 30000);

    const scanFrame = async () => {
      if (!videoRef.current || !canvasRef.current || !isScanningRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;

      if (!context) return;

      // Check if video is ready
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        scanIntervalRef.current = setTimeout(scanFrame, 200);
        return;
      }

      // Set canvas size with device pixel ratio for high-DPI displays
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(video.videoWidth * dpr);
      canvas.height = Math.floor(video.videoHeight * dpr);
      canvas.style.width = `${video.videoWidth}px`;
      canvas.style.height = `${video.videoHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data for QR scanning
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      try {
        const qrData = await scanQRFromImageData(imageData);
        
        if (qrData) {
          console.log('QR Code detected:', qrData);
          setQrDetected(true);
          setNoQRDetected(false);
          
          if (isValidTicketId(qrData)) {
            console.log('Valid ticket ID format found:', qrData);
            setIsScanning(false);
            
            // Clear timeouts
            if (rafIdRef.current) {
              cancelAnimationFrame(rafIdRef.current);
              rafIdRef.current = null;
            }
            if (scanTimeoutRef.current) {
              clearTimeout(scanTimeoutRef.current);
              scanTimeoutRef.current = null;
            }
            
            await validateTicket(qrData);
          } else {
            console.log('Invalid ticket ID format:', qrData);
            // Show denial message for invalid QR format
            setError('❌ ACCESO DENEGADO - Formato de QR inválido. Se esperaba un código de ticket válido.');
            setIsScanning(false);
            setNoQRDetected(false);
            
            // Clear timeouts
            if (rafIdRef.current) {
              cancelAnimationFrame(rafIdRef.current);
              rafIdRef.current = null;
            }
            if (scanTimeoutRef.current) {
              clearTimeout(scanTimeoutRef.current);
              scanTimeoutRef.current = null;
            }
            
            // Reset error after 3 seconds
            setTimeout(() => {
              setError(null);
              setIsScanning(true);
              setScanAttempts(0);
              setQrDetected(false);
              scanFrame();
            }, 3000);
          }
        } else {
          // Increment scan attempts and show "No QR detected" after 5 attempts
          setScanAttempts(prev => {
            const newAttempts = prev + 1;
            if (newAttempts >= 5) {
              setNoQRDetected(true);
            }
            return newAttempts;
          });
          
          // Continue scanning with requestAnimationFrame for better performance
          rafIdRef.current = requestAnimationFrame(scanFrame);
        }
              } catch (error) {
          console.error('Error scanning QR code:', error);
          rafIdRef.current = requestAnimationFrame(scanFrame);
        }
    };

    scanFrame();
  };

  // Stop continuous scanning
  const stopScanning = () => {
    setIsScanning(false);
    isScanningRef.current = false;
    setNoQRDetected(false);
    setScanAttempts(0);
    setQrDetected(false);
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
  };

  // Scan QR code using jsQR library
  const scanQRFromImageData = async (imageData: ImageData): Promise<string | null> => {
    return new Promise((resolve) => {
      try {
        console.log('Scanning image data:', imageData.width, 'x', imageData.height);
        
        const startTime = performance.now();
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth', // More robust than 'dontInvert'
        });
        const decodeTime = performance.now() - startTime;
        
        if (code) {
          console.log(`QR Code detected in ${decodeTime.toFixed(2)}ms:`, code.data);
          console.log('QR location:', code.location);
          resolve(code.data);
        } else {
          console.log(`No QR code found in ${decodeTime.toFixed(2)}ms (${imageData.width}x${imageData.height})`);
          resolve(null);
        }
      } catch (error) {
        console.error('Error scanning QR code:', error);
        resolve(null);
      }
    });
  };

  // Event handler for new unvalidated tickets
  const handleNewUnvalidatedTicket = (ticketData: TicketDetails) => {
    console.log('🎯 NEW UNVALIDATED TICKET DETECTED:', ticketData.id);
    
    // Play distinctive sound for new unvalidated tickets
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Distinctive pattern for new unvalidated tickets
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2);
      oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.3);
      
      gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (audioError) {
      console.log('Audio feedback not supported');
    }
    
    // Show specific message for new unvalidated tickets
    setSuccess('🎫 NUEVO TICKET PENDIENTE - Requiere confirmación de pago');
    
    // Mark ticket as processed to prevent duplicate triggers
    setProcessedTickets(prev => new Set(Array.from(prev).concat(ticketData.id)));
  };

  // Event handler for already validated tickets
  const handleAlreadyValidatedTicket = (ticketData: TicketDetails) => {
    console.log('⚠️ ALREADY VALIDATED TICKET DETECTED:', ticketData.id);
    
    // Play warning sound for already validated tickets
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Warning pattern for already validated tickets
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.2);
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.4);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.6);
    } catch (audioError) {
      console.log('Audio feedback not supported');
    }
    
    setSuccess('⚠️ TICKET YA VALIDADO - Esta entrada ya fue procesada');
  };

  // Validate ticket from QR code
  const validateTicket = async (ticketId: string) => {
    try {
      console.log('Validating ticket:', ticketId);
      
      // Check if ticket was already processed in this session
      if (processedTickets.has(ticketId)) {
        console.log('Ticket already processed in this session:', ticketId);
        setError('🔄 Este ticket ya fue procesado en esta sesión');
        setTimeout(() => {
          setError(null);
          setIsScanning(true);
          isScanningRef.current = true;
          setScanAttempts(0);
          setQrDetected(false);
          startScanning();
        }, 2000);
        return;
      }
      
      // Show loading state
      setError(null);
      setSuccess('🔄 Validando ticket...');
      
      console.log('Sending validation request for ticket:', ticketId);
      const response = await fetch(`/api/validation/ticket/${ticketId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ weeklyCode }),
      });

      console.log('Validation response status:', response.status);
      if (response.ok) {
        const ticketData = await response.json();
        console.log('Ticket data received:', ticketData);
        
        // Route to appropriate event handler based on ticket status
        if (ticketData.status === 'Pendiente') {
          handleNewUnvalidatedTicket(ticketData);
        } else if (ticketData.status === 'Pagado') {
          handleAlreadyValidatedTicket(ticketData);
        }
        
        setScannedTicket(ticketData);
        setShowModal(true);
        
        // Pause scanning but keep camera active
        setIsScanning(false);
        isScanningRef.current = false;
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
      } else {
        const data = await response.json();
        console.log('Validation error response:', data);
        
        // Handle different error types with specific messages
        let errorMessage = '❌ ACCESO DENEGADO - Error desconocido';
        
        if (response.status === 404) {
          errorMessage = '❌ ACCESO DENEGADO - Ticket no encontrado en el sistema';
        } else if (response.status === 401) {
          errorMessage = '❌ ACCESO DENEGADO - Código semanal inválido';
        } else if (data.message) {
          errorMessage = `❌ ACCESO DENEGADO - ${data.message}`;
        }
        
        setError(errorMessage);
        setSuccess(null);
        setNoQRDetected(false);
        
        // Reset error after 3 seconds and resume scanning
        setTimeout(() => {
          setError(null);
          setIsScanning(true);
          setScanAttempts(0);
          setQrDetected(false);
          startScanning();
        }, 3000);
      }
    } catch (error) {
      console.error('Validation error:', error);
      
      // Handle different types of errors
      let errorMessage = '❌ Error al validar el ticket';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = '❌ Error de conexión - No se pudo conectar al servidor';
      } else if (error instanceof Error) {
        errorMessage = `❌ Error al validar el ticket: ${error.message}`;
      }
      
      setError(errorMessage);
      setSuccess(null);
      
      // Reset error after 3 seconds and resume scanning
      setTimeout(() => {
        setError(null);
        setIsScanning(true);
        setScanAttempts(0);
        setQrDetected(false);
        startScanning();
      }, 3000);
    }
  };

  // Manual ticket validation for testing
  const validateManualTicket = async () => {
    const ticketId = prompt('Ingresa el ID del ticket para validar:');
    if (ticketId) {
      await validateTicket(ticketId);
    }
  };

  // Generate test QR code for development
  const generateTestQR = async () => {
    try {
      const testTicketId = 'TICKET-1756214993403-nl265v1u6';
      const response = await fetch('/api/validation/ticket/' + testTicketId, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ weeklyCode }),
      });

      if (response.ok) {
        const ticketData = await response.json();
        setScannedTicket(ticketData);
        setShowModal(true);
        setSuccess('✅ Ticket de prueba válido');
      } else {
        setError('❌ Ticket de prueba no válido');
      }
    } catch (error) {
      setError('❌ Error al validar ticket de prueba');
    }
  };

  // Test camera capture (for debugging)
  const testCameraCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const dataURL = canvas.toDataURL('image/png');
        console.log('Camera capture successful');
        alert('✅ Camera capture successful!');
      } else {
        alert('❌ Cannot capture: Video not ready');
      }
    } else {
      alert('❌ Cannot capture: Video or canvas not available');
    }
  };

  // Test video display
  const testVideoDisplay = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const info = {
        readyState: video.readyState,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        currentTime: video.currentTime,
        paused: video.paused,
        srcObject: !!video.srcObject,
        networkState: video.networkState,
        error: video.error?.message || 'None'
      };
      console.log('Video element info:', info);
      alert(`Video Info:\nReady: ${video.readyState === 4}\nSize: ${video.videoWidth}x${video.videoHeight}\nPaused: ${video.paused}\nNetwork: ${video.networkState}\nError: ${video.error?.message || 'None'}\nStream: ${!!video.srcObject}`);
    } else {
      alert('❌ Video element not found');
    }
  };

  // Test QR detection manually
  const testQRDetection = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const qrData = await scanQRFromImageData(imageData);
        
        if (qrData) {
          console.log('QR detected in test:', qrData);
          alert(`QR Code detected: ${qrData}\nValid format: ${isValidTicketId(qrData) ? 'Yes' : 'No'}`);
        } else {
          alert('No QR code detected in current frame');
        }
      } else {
        alert('❌ Cannot test: Video not ready or canvas not available');
      }
    } else {
      alert('❌ Cannot test: Video or canvas not available');
    }
  };

  // Confirm payment
  const confirmPayment = async () => {
    if (!scannedTicket) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/validation/confirm-payment/${scannedTicket.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ weeklyCode }),
      });

      if (response.ok) {
        setSuccess('✅ Pago confirmado exitosamente');
        setShowModal(false);
        setScannedTicket(null);
        // Resume scanning after successful payment confirmation
        setTimeout(() => {
          setSuccess(null);
          setIsScanning(true);
          isScanningRef.current = true;
          setScanAttempts(0);
          setQrDetected(false);
          setNoQRDetected(false);
          startScanning();
        }, 1000);
      } else {
        const data = await response.json();
        setError(data.message || '❌ Error al confirmar el pago');
      }
    } catch (error) {
      setError('❌ Error al confirmar el pago');
    } finally {
      setIsProcessing(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Video management and debugging effect
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      const stream = streamRef.current;
      
      console.log('Video management effect triggered');
      console.log('Video readyState:', video.readyState);
      console.log('Video paused:', video.paused);
      console.log('Video srcObject:', !!video.srcObject);
      console.log('Stream active:', stream.active);
      
      // Ensure video has the stream and is playing
      if (!video.srcObject) {
        console.log('Setting video srcObject');
        video.srcObject = stream;
      }
      
      if (video.readyState >= 2 && video.paused) {
        console.log('Forcing video play');
        video.play().catch(console.error);
      }
      
      // Additional check for video visibility
      if (video.readyState >= 2 && video.videoWidth === 0) {
        console.log('Video has no dimensions, forcing refresh');
        setTimeout(() => {
          if (video.videoWidth === 0) {
            video.srcObject = null;
            setTimeout(() => {
              video.srcObject = stream;
              video.play().catch(console.error);
            }, 100);
          }
        }, 1000);
      }
    }
  }, [cameraActive]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Breadcrumb />
        <div className="text-center mb-8">
          <QrCode className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold mb-2">Validación de Entradas</h1>
          <p className="text-muted-foreground">
            Sistema de validación con código semanal y escáner de códigos QR
          </p>
        </div>

        {/* Weekly Code Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isCodeValid ? <Unlock className="w-5 h-5 text-green-600" /> : <Lock className="w-5 h-5 text-red-600" />}
              Código Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isCodeValid ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="weeklyCode">Código de Validación Semanal (5 dígitos)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="weeklyCode"
                      type="text"
                      placeholder="12345"
                      value={weeklyCode}
                      onChange={(e) => setWeeklyCode(e.target.value)}
                      maxLength={5}
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && checkWeeklyCode()}
                    />
                    <Button 
                      onClick={checkWeeklyCode} 
                      disabled={isCodeChecking || !weeklyCode.trim()}
                      className="min-w-[120px]"
                    >
                      {isCodeChecking ? 'Verificando...' : 'Verificar'}
                    </Button>
                  </div>
                </div>
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  ✅ Código semanal válido. Puedes proceder con la validación de entradas.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Manual Validation Section - Always shown when code is valid */}
        {isCodeValid && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Validación Manual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  Para pruebas sin cámara, puedes validar tickets manualmente
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={validateManualTicket} variant="default" className="gap-2">
                    <QrCode className="w-4 h-4" />
                    Validar Manualmente
                  </Button>
                  <Button onClick={generateTestQR} variant="outline" className="gap-2">
                    <QrCode className="w-4 h-4" />
                    Probar Ticket
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Camera Section - Only shown when code is valid */}
        {isCodeValid && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Escáner de Códigos QR
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!cameraActive ? (
                <div className="text-center py-8">
                  <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    Haz clic en el botón para activar la cámara y escanear códigos QR
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={startCamera} className="gap-2">
                      <Camera className="w-4 h-4" />
                      Activar Cámara
                    </Button>
                    <Button onClick={validateManualTicket} variant="outline" className="gap-2">
                      <QrCode className="w-4 h-4" />
                      Validar Manualmente
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    {/* Video container */}
                    <div className="w-full max-w-md mx-auto border rounded-lg bg-black overflow-hidden relative">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        controls={false}
                        className="w-full h-full object-cover"
                        style={{ 
                          minHeight: isMobile ? '250px' : '300px',
                          maxHeight: isMobile ? '350px' : '400px',
                          display: 'block',
                          width: '100%',
                          height: '100%',
                          backgroundColor: '#000'
                        }}
                      />
                      
                      {/* Loading indicator - only show briefly */}
                      {cameraActive && videoRef.current && videoRef.current.readyState < 2 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
                            <p className="text-sm">Inicializando...</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Camera active but no video indicator - less intrusive */}
                      {cameraActive && videoRef.current && videoRef.current.readyState >= 2 && videoRef.current.videoWidth === 0 && (
                        <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                          <Camera className="w-4 h-4 inline mr-1" />
                          Cámara activa
                        </div>
                      )}
                      
                      {/* Camera status indicator */}
                      {cameraActive && videoRef.current && videoRef.current.readyState >= 2 && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          {isMobile ? '📱 Cámara lista' : '🖥️ Cámara lista'}
                        </div>
                      )}
                      
                      {/* Scanning overlay with QR frame */}
                      {isScanning && !noQRDetected && !error && (
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                          {/* Semi-transparent overlay */}
                          <div className="absolute inset-0 bg-black bg-opacity-60"></div>
                          
                          {/* QR scanning frame */}
                          <div className="relative z-30">
                            <div className="w-64 h-64 border-2 border-white rounded-lg relative shadow-2xl">
                              {/* Corner indicators */}
                              <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-green-400"></div>
                              <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-green-400"></div>
                              <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-green-400"></div>
                              <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-green-400"></div>
                              
                              {/* Scanning line animation */}
                              <div className="absolute top-0 left-0 w-full h-1 bg-green-400 animate-pulse shadow-lg"></div>
                            </div>
                            
                            <div className="text-center text-white mt-4">
                              <QrCode className="w-8 h-8 mx-auto mb-2 text-green-400" />
                              <p className="text-sm font-medium">Coloca el código QR dentro del marco</p>
                              <p className="text-xs mt-1 text-gray-300">Escaneando automáticamente...</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Error overlay for invalid QR */}
                      {error && error.includes('QR') && (
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                          {/* Semi-transparent overlay */}
                          <div className="absolute inset-0 bg-red-900 bg-opacity-80"></div>
                          
                          {/* Error message */}
                          <div className="relative z-30 text-center text-white">
                            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
                            <p className="text-lg font-medium mb-2">QR Inválido</p>
                            <p className="text-sm text-red-200">{error}</p>
                            <p className="text-xs mt-2 text-red-300">Reanudando escaneo en 3 segundos...</p>
                          </div>
                        </div>
                      )}
                      
                      {/* No QR detected overlay */}
                      {isScanning && noQRDetected && !error && !qrDetected && (
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                          {/* Semi-transparent overlay */}
                          <div className="absolute inset-0 bg-blue-900 bg-opacity-60"></div>
                          
                          {/* No QR message */}
                          <div className="relative z-30 text-center text-white">
                            <QrCode className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                            <p className="text-lg font-medium mb-2">No se detectó QR</p>
                            <p className="text-sm text-blue-200">Coloca un código QR dentro del marco</p>
                            <p className="text-xs mt-2 text-blue-300">Escaneando continuamente...</p>
                          </div>
                        </div>
                      )}
                      
                      {/* QR detected overlay */}
                      {isScanning && qrDetected && !error && (
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                          {/* Semi-transparent overlay */}
                          <div className="absolute inset-0 bg-yellow-900 bg-opacity-60"></div>
                          
                          {/* QR detected message */}
                          <div className="relative z-30 text-center text-white">
                            <QrCode className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
                            <p className="text-lg font-medium mb-2">QR Detectado</p>
                            <p className="text-sm text-yellow-200">Validando ticket...</p>
                            <div className="mt-2">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400 mx-auto"></div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Scanning paused overlay - waiting for user action */}
                      {!isScanning && scannedTicket && (
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                          {/* Semi-transparent overlay */}
                          <div className="absolute inset-0 bg-blue-900 bg-opacity-60"></div>
                          
                          {/* Scanning paused message */}
                          <div className="relative z-30 text-center text-white">
                            <QrCode className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                            <p className="text-lg font-medium mb-2">Escaneo Pausado</p>
                            <p className="text-sm text-blue-200">Esperando confirmación del usuario</p>
                            <p className="text-xs mt-2 text-blue-300">Revisa el ticket en el modal</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  <div className="flex gap-2 justify-center flex-wrap">
                    {!isScanning ? (
                      <Button onClick={startScanning} variant="outline" className="gap-2">
                        <QrCode className="w-4 h-4" />
                        {scannedTicket ? 'Reanudar Escaneo' : 'Iniciar Escaneo'}
                      </Button>
                    ) : (
                      <Button onClick={stopScanning} variant="outline" className="gap-2">
                        <QrCode className="w-4 h-4" />
                        Detener Escaneo
                      </Button>
                    )}
                    <Button onClick={stopCamera} variant="destructive">
                      Detener Cámara
                    </Button>
                    <Button 
                      onClick={() => {
                        if (videoRef.current && streamRef.current) {
                          const video = videoRef.current;
                          const stream = streamRef.current;
                          video.srcObject = null;
                          setTimeout(() => {
                            video.srcObject = stream;
                            video.play().catch(console.error);
                          }, 100);
                        }
                      }}
                      variant="outline" 
                      size="sm"
                    >
                      Refrescar Video
                    </Button>
                    <Button 
                      onClick={testCameraCapture} 
                      variant="outline" 
                      size="sm"
                    >
                      Test Cámara
                    </Button>
                    <Button 
                      onClick={testVideoDisplay} 
                      variant="outline" 
                      size="sm"
                    >
                      Debug Video
                    </Button>
                    <Button 
                      onClick={testQRDetection} 
                      variant="outline" 
                      size="sm"
                    >
                      Test QR
                    </Button>
                  </div>
                </div>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Ticket Details Modal */}
        <Dialog open={showModal} onOpenChange={(open) => {
          setShowModal(open);
          // If modal is closing by clicking outside and we're not processing, resume scanning
          if (!open && !isProcessing) {
            setTimeout(() => {
              setScannedTicket(null);
              setSuccess(null);
              setIsScanning(true);
              isScanningRef.current = true;
              setScanAttempts(0);
              setQrDetected(false);
              setNoQRDetected(false);
              startScanning();
            }, 500);
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Detalles de la Entrada
              </DialogTitle>
            </DialogHeader>
            
            {scannedTicket && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Obra:</span>
                    <p className="text-muted-foreground">{scannedTicket.playTitle}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Día y hora:</span>
                    <p className="text-muted-foreground">{scannedTicket.date} - {scannedTicket.time}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Precio:</span>
                    <p className="text-muted-foreground">
                      {scannedTicket.isGroupTicket 
                        ? `€${scannedTicket.totalPrice?.toFixed(2)} (Grupo)`
                        : `€${scannedTicket.price.toFixed(2)}`
                      }
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold">Asiento:</span>
                    <p className="text-muted-foreground">{scannedTicket.seatNumber || 'General'}</p>
                  </div>
                </div>

                {/* Group ticket information */}
                {scannedTicket.isGroupTicket && (
                  <div className="pt-2 border-t bg-blue-50 p-3 rounded-lg">
                    <span className="font-semibold text-blue-800">🎭 Entrada de Grupo:</span>
                    <div className="text-sm text-blue-700 mt-1">
                      <p>• Total de entradas: {scannedTicket.quantity}</p>
                      <p>• Adultos: {scannedTicket.adultTickets}</p>
                      <p>• Niños: {scannedTicket.childTickets}</p>
                      <p>• Precio base: €{scannedTicket.basePrice?.toFixed(2)}</p>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <span className="font-semibold">Asistente:</span>
                  <p className="text-muted-foreground">{scannedTicket.userName}</p>
                </div>

                <div className="pt-2 border-t">
                  <span className="font-semibold">Estado:</span>
                  <Badge 
                    variant={scannedTicket.status === 'Pagado' ? 'destructive' : 'default'}
                    className="ml-2"
                  >
                    {scannedTicket.status}
                  </Badge>
                </div>

                {scannedTicket.status === 'Pendiente' && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertDescription className="text-blue-800">
                      🎫 Ticket pendiente de pago - Requiere confirmación
                    </AlertDescription>
                  </Alert>
                )}

                {scannedTicket.status === 'Pagado' && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertDescription className="text-yellow-800">
                      ⚠️ Esta entrada ya fue validada anteriormente
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowModal(false);
                  // Resume scanning after cancel
                  setTimeout(() => {
                    setScannedTicket(null);
                    setSuccess(null);
                    setIsScanning(true);
                    isScanningRef.current = true;
                    setScanAttempts(0);
                    setQrDetected(false);
                    setNoQRDetected(false);
                    startScanning();
                  }, 500);
                }}
                disabled={isProcessing}
              >
                Cancelar
              </Button>
              {scannedTicket?.status === 'Pendiente' && (
                <Button 
                  onClick={confirmPayment}
                  disabled={isProcessing}
                  className="gap-2"
                >
                  {isProcessing ? 'Procesando...' : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Confirmar Pago
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 