import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Theater, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if already logged in (after all hooks are called)
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

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
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterForm) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  // Don't render anything if user is logged in (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-claret-blue via-claret-navy to-claret-blue flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Hero Section */}
        <div className="hidden lg:block text-white space-y-6">
          <Button
            variant="ghost"
            className="text-white hover:text-claret-yellow mb-6"
            onClick={() => setLocation("/")}
            data-testid="button-back-home"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Button>
          
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-claret-yellow rounded-lg flex items-center justify-center">
              <Theater className="w-8 h-8 text-claret-navy" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Teatro Claret</h1>
              <p className="text-blue-200">Sevilla</p>
            </div>
          </div>
          
          <h2 className="text-4xl font-bold leading-tight">
            Únete a nuestra comunidad teatral
          </h2>
          
          <p className="text-xl text-blue-100">
            Reserva entradas, mantente al día con las últimas noticias y forma parte 
            de la experiencia teatral del Colegio Claret Sevilla.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-claret-yellow/20 rounded-lg flex items-center justify-center">
                <Theater className="w-5 h-5 text-claret-yellow" />
              </div>
              <span>Reserva entradas para todas las obras</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-claret-yellow/20 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-claret-yellow" />
              </div>
              <span>Recibe notificaciones de nuevos eventos</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-claret-yellow/20 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-claret-yellow" />
              </div>
              <span>Gestiona tu perfil y preferencias</span>
            </div>
          </div>
        </div>

        {/* Auth Forms */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <Card className="shadow-2xl">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-claret-blue rounded-lg flex items-center justify-center lg:hidden">
                  <Theater className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-2xl text-claret-blue">
                  {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
                </CardTitle>
              </div>
              <CardDescription>
                {isLogin 
                  ? "Accede a tu cuenta para reservar entradas" 
                  : "Únete a nuestra comunidad teatral"
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {isLogin ? (
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4" data-testid="form-login">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="tu@email.com"
                        className="pl-10"
                        {...loginForm.register("email")}
                        data-testid="input-login-email"
                      />
                    </div>
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-claret-red">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        {...loginForm.register("password")}
                        data-testid="input-login-password"
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
                    data-testid="button-login-submit"
                  >
                    {loginMutation.isPending ? "Iniciando..." : "Iniciar Sesión"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4" data-testid="form-register">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nombre completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Tu nombre"
                        className="pl-10"
                        {...registerForm.register("name")}
                        data-testid="input-register-name"
                      />
                    </div>
                    {registerForm.formState.errors.name && (
                      <p className="text-sm text-claret-red">{registerForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="tu@email.com"
                        className="pl-10"
                        {...registerForm.register("email")}
                        data-testid="input-register-email"
                      />
                    </div>
                    {registerForm.formState.errors.email && (
                      <p className="text-sm text-claret-red">{registerForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        {...registerForm.register("password")}
                        data-testid="input-register-password"
                      />
                    </div>
                    {registerForm.formState.errors.password && (
                      <p className="text-sm text-claret-red">{registerForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">Confirmar contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-confirm-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        {...registerForm.register("confirmPassword")}
                        data-testid="input-register-confirm-password"
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
                    data-testid="button-register-submit"
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
                  data-testid="button-switch-auth-mode"
                >
                  {isLogin 
                    ? "¿No tienes cuenta? Regístrate" 
                    : "¿Ya tienes cuenta? Inicia sesión"
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
