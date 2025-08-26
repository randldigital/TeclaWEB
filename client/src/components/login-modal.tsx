import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, User, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  name: z.string().min(1, "El nombre es requerido"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const { loginMutation, registerMutation } = useAuth();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      confirmPassword: "",
    },
  });

  const onLogin = (data: LoginForm) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const onRegister = (data: RegisterForm) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const handleClose = () => {
    onClose();
    setIsLogin(true);
    loginForm.reset();
    registerForm.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-login">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-claret-blue">
            {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
          </DialogTitle>
          <DialogDescription>
            {isLogin 
              ? "Accede a tu cuenta para reservar entradas" 
              : "Únete a nuestra comunidad teatral"
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {isLogin ? (
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4" data-testid="form-modal-login">
              <div className="space-y-2">
                <Label htmlFor="modal-login-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="modal-login-email"
                    type="email"
                    placeholder="tu@email.com"
                    className="pl-10"
                    {...loginForm.register("email")}
                    data-testid="input-modal-login-email"
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-claret-red">{loginForm.formState.errors.email.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="modal-login-password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="modal-login-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    {...loginForm.register("password")}
                    data-testid="input-modal-login-password"
                  />
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-claret-red">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-claret-blue hover:bg-claret-navy"
                disabled={loginMutation.isPending}
                data-testid="button-modal-login-submit"
              >
                {loginMutation.isPending ? "Iniciando..." : "Iniciar Sesión"}
              </Button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4" data-testid="form-modal-register">
              <div className="space-y-2">
                <Label htmlFor="modal-register-name">Nombre completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="modal-register-name"
                    type="text"
                    placeholder="Tu nombre"
                    className="pl-10"
                    {...registerForm.register("name")}
                    data-testid="input-modal-register-name"
                  />
                </div>
                {registerForm.formState.errors.name && (
                  <p className="text-sm text-claret-red">{registerForm.formState.errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="modal-register-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="modal-register-email"
                    type="email"
                    placeholder="tu@email.com"
                    className="pl-10"
                    {...registerForm.register("email")}
                    data-testid="input-modal-register-email"
                  />
                </div>
                {registerForm.formState.errors.email && (
                  <p className="text-sm text-claret-red">{registerForm.formState.errors.email.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="modal-register-password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="modal-register-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    {...registerForm.register("password")}
                    data-testid="input-modal-register-password"
                  />
                </div>
                {registerForm.formState.errors.password && (
                  <p className="text-sm text-claret-red">{registerForm.formState.errors.password.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="modal-register-confirm-password">Confirmar contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="modal-register-confirm-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    {...registerForm.register("confirmPassword")}
                    data-testid="input-modal-register-confirm-password"
                  />
                </div>
                {registerForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-claret-red">{registerForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-claret-blue hover:bg-claret-navy"
                disabled={registerMutation.isPending}
                data-testid="button-modal-register-submit"
              >
                {registerMutation.isPending ? "Creando cuenta..." : "Crear Cuenta"}
              </Button>
            </form>
          )}
          
          <Separator />
          
          <div className="text-center">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsLogin(!isLogin);
                loginForm.reset();
                registerForm.reset();
              }}
              className="text-claret-blue hover:text-claret-navy"
              data-testid="button-modal-switch-auth-mode"
            >
              {isLogin 
                ? "¿No tienes cuenta? Regístrate" 
                : "¿Ya tienes cuenta? Inicia sesión"
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
