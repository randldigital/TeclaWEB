import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, User, Baby } from "lucide-react";

const MIN_TOTAL = 1;
const MAX_TOTAL = 6;

function adultOptionsForChildren(children: number): number[] {
  const minA = Math.max(0, MIN_TOTAL - children);
  const maxA = MAX_TOTAL - children;
  return Array.from({ length: maxA - minA + 1 }, (_, i) => minA + i);
}

function childOptionsForAdults(adults: number): number[] {
  const minC = Math.max(0, MIN_TOTAL - adults);
  const maxC = MAX_TOTAL - adults;
  return Array.from({ length: maxC - minC + 1 }, (_, i) => minC + i);
}

interface TicketQuantitySelectorProps {
  basePrice: number;
  onQuantityChange: (quantity: number, adultTickets: number, childTickets: number, totalPrice: number) => void;
}

export function TicketQuantitySelector({ basePrice, onQuantityChange }: TicketQuantitySelectorProps) {
  const [adultTickets, setAdultTickets] = useState(1);
  const [childTickets, setChildTickets] = useState(0);

  const totalPeople = adultTickets + childTickets;

  const adultSelectValues = useMemo(() => adultOptionsForChildren(childTickets), [childTickets]);
  const childSelectValues = useMemo(() => childOptionsForAdults(adultTickets), [adultTickets]);

  // Calculate total price
  const calculateTotalPrice = (adults: number, children: number): number => {
    const adultTotal = adults * basePrice;
    const childTotal = Math.ceil(children / 2) * basePrice; // 1 ticket per 2 children
    return adultTotal + childTotal;
  };

  // Update parent component when quantities change
  useEffect(() => {
    const totalPrice = calculateTotalPrice(adultTickets, childTickets);
    onQuantityChange(adultTickets + childTickets, adultTickets, childTickets, totalPrice);
  }, [adultTickets, childTickets, basePrice, onQuantityChange]);

  const handleAdultChange = (newAdults: number) => {
    setAdultTickets(newAdults);
  };

  const handleChildChange = (newChildren: number) => {
    setChildTickets(newChildren);
  };

  const totalPrice = calculateTotalPrice(adultTickets, childTickets);
  const childTicketPrice = Math.ceil(childTickets / 2) * basePrice;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-claret-blue flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Seleccionar Cantidad de Entradas
        </CardTitle>
        <CardDescription>
          Máximo 6 personas (adultos + niños) por reserva.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="adults" className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              Adultos
            </Label>
            <Select value={adultTickets.toString()} onValueChange={(v) => handleAdultChange(parseInt(v, 10))}>
              <SelectTrigger id="adults">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {adultSelectValues.map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    {n} {n === 1 ? "adulto" : "adultos"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="children" className="flex items-center">
              <Baby className="w-4 h-4 mr-1" />
              Niños
            </Label>
            <Select value={childTickets.toString()} onValueChange={(v) => handleChildChange(parseInt(v, 10))}>
              <SelectTrigger id="children">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {childSelectValues.map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    {n} {n === 1 ? "niño" : "niños"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Price Summary */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              Adultos ({adultTickets}):
            </span>
            <span>€{(adultTickets * basePrice).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center">
              <Baby className="w-4 h-4 mr-1" />
              Niños ({childTickets}):
            </span>
            <span>€{childTicketPrice.toFixed(2)}</span>
          </div>
          {childTickets > 0 && (
            <div className="text-xs text-gray-600 italic">
              * Niños 2x1
            </div>
          )}
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between items-center font-bold text-lg">
              <span>Total:</span>
              <span className="text-claret-red">€{totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {totalPeople > 1 && (
          <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
            ℹ️ Esta será una reserva de grupo con un solo código QR
          </div>
        )}
      </CardContent>
    </Card>
  );
}
