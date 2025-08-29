import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, QrCode, Search } from 'lucide-react';

interface TicketValidation {
  isValid: boolean;
  ticketId?: string;
  playTitle?: string;
  userName?: string;
  date?: string;
  time?: string;
  seatNumber?: string;
  price?: number;
  status?: string;
  paidAt?: string;
  error?: string;
}

export default function QRValidatorPage() {
  const [ticketId, setTicketId] = useState('');
  const [weeklyCode, setWeeklyCode] = useState('');
  const [validation, setValidation] = useState<TicketValidation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateTicket = async () => {
    if (!ticketId.trim()) {
      setValidation({
        isValid: false,
        error: 'Por favor, ingresa un ID de ticket válido'
      });
      return;
    }

    if (!weeklyCode.trim()) {
      setValidation({
        isValid: false,
        error: 'Por favor, ingresa el código semanal'
      });
      return;
    }

    setIsLoading(true);
    try {
      // Use the correct endpoint with weekly code
      const response = await fetch(`/api/validation/ticket/${ticketId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ weeklyCode }),
      });
      
      if (response.ok) {
        const ticketData = await response.json();
        setValidation({
          isValid: true,
          ticketId: ticketData.id,
          playTitle: ticketData.playTitle,
          userName: ticketData.userName,
          date: ticketData.date,
          time: ticketData.time,
          seatNumber: ticketData.seatNumber,
          price: ticketData.price,
          status: ticketData.status,
          paidAt: ticketData.paidAt
        });
      } else {
        const errorData = await response.json();
        setValidation({
          isValid: false,
          error: errorData.message || 'Ticket no encontrado o inválido'
        });
      }
    } catch (error) {
      setValidation({
        isValid: false,
        error: 'Error al validar el ticket. Inténtalo de nuevo.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      validateTicket();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Breadcrumb />
        <div className="text-center mb-8">
          <QrCode className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold mb-2">Validador de Entradas</h1>
          <p className="text-muted-foreground">
            Escanea o ingresa el código QR de la entrada para validar su autenticidad
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Validar Entrada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="weeklyCode">Código Semanal</Label>
              <Input
                id="weeklyCode"
                placeholder="12345"
                value={weeklyCode}
                onChange={(e) => setWeeklyCode(e.target.value)}
                maxLength={5}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ticketId">ID de la Entrada</Label>
              <div className="flex gap-2">
                <Input
                  id="ticketId"
                  placeholder="Ej: TICKET-1756214993403-nl265v1u6"
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button 
                  onClick={validateTicket} 
                  disabled={isLoading}
                  className="min-w-[100px]"
                >
                  {isLoading ? 'Validando...' : 'Validar'}
                </Button>
              </div>
            </div>

            {validation && (
              <div className="mt-6">
                {validation.isValid ? (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Entrada Válida
                          </Badge>
                          <Badge 
                            variant={validation.status === 'Pagado' ? 'destructive' : 'default'}
                            className={validation.status === 'Pagado' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}
                          >
                            {validation.status === 'Pagado' ? 'Ya Validado' : 'Pendiente'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-semibold">Obra:</span>
                            <p className="text-green-700">{validation.playTitle}</p>
                          </div>
                          <div>
                            <span className="font-semibold">Asistente:</span>
                            <p className="text-green-700">{validation.userName}</p>
                          </div>
                          <div>
                            <span className="font-semibold">Fecha:</span>
                            <p className="text-green-700">{validation.date}</p>
                          </div>
                          <div>
                            <span className="font-semibold">Hora:</span>
                            <p className="text-green-700">{validation.time}</p>
                          </div>
                          <div>
                            <span className="font-semibold">Asiento:</span>
                            <p className="text-green-700">{validation.seatNumber || 'General'}</p>
                          </div>
                          <div>
                            <span className="font-semibold">Precio:</span>
                            <p className="text-green-700">€{validation.price?.toFixed(2)}</p>
                          </div>
                          <div>
                            <span className="font-semibold">Estado:</span>
                            <p className="text-green-700">{validation.status === 'Pagado' ? 'Validado' : 'Pendiente'}</p>
                          </div>
                        </div>
                        
                        <div className="pt-2 border-t border-green-200">
                          <span className="font-semibold">ID de Ticket:</span>
                          <p className="font-mono text-xs text-green-600 bg-green-100 p-2 rounded mt-1">
                            {validation.ticketId}
                          </p>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-red-200 bg-red-50">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {validation.error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">¿Cómo usar el validador?</h3>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Ingresa el código semanal de validación</li>
                <li>Ingresa el ID del ticket (formato: TICKET-timestamp-randomstring)</li>
                <li>Haz clic en "Validar" para verificar la entrada</li>
                <li>Revisa la información mostrada y el estado del ticket</li>
              </ol>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <h4 className="font-semibold text-yellow-800 mb-2">Datos de Prueba:</h4>
                <div className="text-sm text-yellow-700 space-y-2">
                  <p><strong>Código semanal:</strong> 12345</p>
                  <p><strong>Ticket de prueba:</strong> TICKET-1756214993403-nl265v1u6</p>
                  <p><strong>Otros tickets:</strong> TICKET-1756214993404-abc123def, TICKET-1756215517380-zozlc79fx</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 