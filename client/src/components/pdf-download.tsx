import React, { useState } from 'react';
import { Download, FileText, FileImage, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '../hooks/use-auth';

interface PDFDownloadProps {
  ticketId: string;
  playTitle: string;
  className?: string;
}

export function PDFDownload({ ticketId, playTitle, className = '' }: PDFDownloadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCustom, setIsLoadingCustom] = useState(false);
  const { user } = useAuth();

  const downloadPDF = async (useCustomTemplate: boolean = false) => {
    if (!user) return;

    const setLoading = useCustomTemplate ? setIsLoadingCustom : setIsLoading;
    setLoading(true);

    try {
      const method = useCustomTemplate ? 'POST' : 'GET';
      const response = await fetch(`/api/tickets/${ticketId}/pdf`, {
        method,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${ticketId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error downloading PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Descargar Entrada
        </CardTitle>
        <CardDescription>
          Descarga tu entrada en formato PDF para imprimir o guardar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Plantilla Original</h4>
            <p className="text-xs text-muted-foreground">
              Usa la plantilla HTML original del sistema
            </p>
            <Button
              onClick={() => downloadPDF(false)}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Descargar Original
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Plantilla Personalizada</h4>
            <p className="text-xs text-muted-foreground">
              Usa una plantilla moderna y elegante
            </p>
            <Button
              onClick={() => downloadPDF(true)}
              disabled={isLoadingCustom}
              className="w-full"
            >
              {isLoadingCustom ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileImage className="h-4 w-4 mr-2" />
              )}
              Descargar Personalizada
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
          <p className="font-medium mb-1">Información:</p>
          <ul className="space-y-1">
            <li>• La entrada incluye un código QR para validación</li>
            <li>• Puedes imprimir la entrada o guardarla en tu dispositivo</li>
            <li>• Presenta la entrada impresa o el código QR en la entrada</li>
            <li>• Llega 15 minutos antes del inicio del evento</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 