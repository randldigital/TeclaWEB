import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const contactSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  subject: z.string().min(1, "El asunto es requerido"),
  message: z.string().min(10, "El mensaje debe tener al menos 10 caracteres"),
});

type ContactForm = z.infer<typeof contactSchema>;

export function ContactSection() {
  const [selectedSubject, setSelectedSubject] = useState("");
  const { toast } = useToast();

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const contactMutation = useMutation({
    mutationFn: async (data: ContactForm) => {
      const response = await apiRequest("POST", "/api/contact", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Mensaje enviado",
        description: "Tu mensaje ha sido enviado correctamente. Te responderemos pronto.",
      });
      form.reset();
      setSelectedSubject("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error al enviar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactForm) => {
    contactMutation.mutate(data);
  };

  const subjectOptions = [
    { value: "reservas", label: "Consulta sobre reservas" },
    { value: "informacion", label: "Información general" },
    { value: "talleres", label: "Talleres y cursos" },
    { value: "colaboracion", label: "Colaboración" },
    { value: "otros", label: "Otros" },
  ];

  return (
    <section className="py-16 bg-white" id="contact">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-claret-blue mb-4">Contacto</h3>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            ¿Tienes alguna pregunta? No dudes en contactarnos
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="bg-claret-yellow p-3 rounded-lg">
                <MapPin className="w-6 h-6 text-claret-navy" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-claret-blue mb-2">Ubicación</h4>
                <p className="text-gray-600">
                  Colegio Claret Sevilla<br />
                  C/ Marques de Nervión, 25<br />
                  41005 Sevilla, España
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-claret-yellow p-3 rounded-lg">
                <Phone className="w-6 h-6 text-claret-navy" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-claret-blue mb-2">Teléfono</h4>
                <p className="text-gray-600">+34 954 123 456</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-claret-yellow p-3 rounded-lg">
                <Mail className="w-6 h-6 text-claret-navy" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-claret-blue mb-2">Email</h4>
                <p className="text-gray-600">teatro@claretsevilla.es</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-claret-yellow p-3 rounded-lg">
                <Clock className="w-6 h-6 text-claret-navy" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-claret-blue mb-2">Horario</h4>
                <p className="text-gray-600">
                  Lunes a Viernes: 9:00 - 18:00<br />
                  Sábados: 9:00 - 14:00
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-gray-50 p-8 rounded-2xl">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-contact">
              <div>
                <Label htmlFor="contact-name">Nombre completo</Label>
                <Input 
                  id="contact-name"
                  placeholder="Tu nombre"
                  {...form.register("name")}
                  data-testid="input-contact-name"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-claret-red mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="contact-email">Email</Label>
                <Input 
                  id="contact-email"
                  type="email"
                  placeholder="tu@email.com"
                  {...form.register("email")}
                  data-testid="input-contact-email"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-claret-red mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="contact-subject">Asunto</Label>
                <Select
                  value={selectedSubject}
                  onValueChange={(value) => {
                    setSelectedSubject(value);
                    form.setValue("subject", value);
                  }}
                >
                  <SelectTrigger data-testid="select-contact-subject">
                    <SelectValue placeholder="Selecciona un asunto" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.subject && (
                  <p className="text-sm text-claret-red mt-1">{form.formState.errors.subject.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="contact-message">Mensaje</Label>
                <Textarea 
                  id="contact-message"
                  rows={4}
                  placeholder="Escribe tu mensaje aquí..."
                  {...form.register("message")}
                  data-testid="textarea-contact-message"
                />
                {form.formState.errors.message && (
                  <p className="text-sm text-claret-red mt-1">{form.formState.errors.message.message}</p>
                )}
              </div>
              
              <Button 
                type="submit"
                className="w-full bg-claret-blue hover:bg-claret-navy text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                disabled={contactMutation.isPending}
                data-testid="button-send-contact"
              >
                {contactMutation.isPending ? "Enviando..." : "Enviar Mensaje"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
