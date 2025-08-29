import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, User, Baby } from "lucide-react";

interface TicketQuantitySelectorProps {
  basePrice: number;
  onQuantityChange: (quantity: number, adultTickets: number, childTickets: number, totalPrice: number) => void;
}

export function TicketQuantitySelector({ basePrice, onQuantityChange }: TicketQuantitySelectorProps) {
  const [quantity, setQuantity] = useState(1);
  const [adultTickets, setAdultTickets] = useState(1);
  const [childTickets, setChildTickets] = useState(0);

  // Calculate total price
  const calculateTotalPrice = (adults: number, children: number): number => {
    const adultTotal = adults * basePrice;
    const childTotal = Math.ceil(children / 2) * basePrice; // 1 ticket per 2 children
    return adultTotal + childTotal;
  };

  // Update parent component when quantities change
  useEffect(() => {
    const totalPrice = calculateTotalPrice(adultTickets, childTickets);
    onQuantityChange(quantity, adultTickets, childTickets, totalPrice);
  }, [quantity, adultTickets, childTickets, basePrice, onQuantityChange]);

  // Handle quantity change
  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
    
    // Adjust adult/child breakdown to match new quantity
    if (newQuantity < adultTickets + childTickets) {
      // Reduce quantities to match new total
      if (newQuantity <= adultTickets) {
        setAdultTickets(newQuantity);
        setChildTickets(0);
      } else {
        setChildTickets(newQuantity - adultTickets);
      }
    }
  };

  // Handle adult tickets change
  const handleAdultChange = (newAdults: number) => {
    setAdultTickets(newAdults);
    setChildTickets(quantity - newAdults);
  };

  // Handle child tickets change
  const handleChildChange = (newChildren: number) => {
    setChildTickets(newChildren);
    setAdultTickets(quantity - newChildren);
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
          Máximo 6 entradas por reserva. Niños: 1 entrada por cada 2 niños.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quantity Selector */}
        <div>
          <Label htmlFor="quantity">Cantidad Total (1-6)</Label>
          <Select value={quantity.toString()} onValueChange={(v) => handleQuantityChange(parseInt(v))}>
            <SelectTrigger id="quantity">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6].map(num => (
                <SelectItem key={num} value={num.toString()}>
                  {num} {num === 1 ? 'entrada' : 'entradas'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Adult/Child Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="adults" className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              Adultos
            </Label>
            <Select value={adultTickets.toString()} onValueChange={(v) => handleAdultChange(parseInt(v))}>
              <SelectTrigger id="adults">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: quantity + 1 }, (_, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {i} {i === 1 ? 'adulto' : 'adultos'}
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
            <Select value={childTickets.toString()} onValueChange={(v) => handleChildChange(parseInt(v))}>
              <SelectTrigger id="children">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: quantity + 1 }, (_, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {i} {i === 1 ? 'niño' : 'niños'}
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
              * Niños: 1 entrada por cada 2 niños
            </div>
          )}
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between items-center font-bold text-lg">
              <span>Total:</span>
              <span className="text-claret-red">€{totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Validation Messages */}
        {adultTickets + childTickets !== quantity && (
          <div className="text-sm text-claret-red bg-red-50 p-2 rounded">
            ⚠️ La suma de adultos y niños debe igualar la cantidad total
          </div>
        )}
        
        {quantity > 1 && (
          <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
            ℹ️ Esta será una reserva de grupo con un solo código QR
          </div>
        )}
      </CardContent>
    </Card>
  );
}
