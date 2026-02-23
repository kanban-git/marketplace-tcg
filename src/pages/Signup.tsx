import { useState, useRef, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

// Masks
const maskCpf = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
};

type ValidationStatus = "idle" | "checking" | "available" | "taken";

const StatusIcon = ({ status }: { status: ValidationStatus }) => {
  if (status === "checking") return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  if (status === "available") return <CheckCircle className="h-4 w-4 text-primary" />;
  if (status === "taken") return <XCircle className="h-4 w-4 text-destructive" />;
  return null;
};

const Signup = () => {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const isSubmittingRef = useRef(false);

  // Validation states
  const [emailStatus, setEmailStatus] = useState<ValidationStatus>("idle");
  const [cpfStatus, setCpfStatus] = useState<ValidationStatus>("idle");
  const [phoneStatus, setPhoneStatus] = useState<ValidationStatus>("idle");

  // Debounced checker
  const useFieldValidator = (
    value: string,
    column: string,
    minLength: number,
    setStatus: (s: ValidationStatus) => void
  ) => {
    const timerRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
      const clean = value.replace(/\D/g, "");
      if (column === "email" ? !value.includes("@") : clean.length < minLength) {
        setStatus("idle");
        return;
      }

      setStatus("checking");
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        const queryValue = column === "email" ? value.trim().toLowerCase() : clean;
        const res = await (supabase
          .from("profiles")
          .select("id") as any)
          .eq(column, queryValue)
          .maybeSingle();
        setStatus(res.data ? "taken" : "available");
      }, 500);

      return () => clearTimeout(timerRef.current);
    }, [value]);
  };

  useFieldValidator(email, "email", 0, setEmailStatus);
  useFieldValidator(cpf, "cpf", 11, setCpfStatus);
  useFieldValidator(phone, "phone", 10, setPhoneStatus);

  const passwordsMatch = password.length >= 6 && password === confirmPassword;
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const canSubmit =
    displayName.length > 0 &&
    emailStatus === "available" &&
    cpfStatus === "available" &&
    phoneStatus === "available" &&
    passwordsMatch &&
    !loading;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setLoading(true);

    try {

      const cleanCpf = cpf.replace(/\D/g, "");
      const cleanPhone = phone.replace(/\D/g, "");

      const { data: signUpData, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: displayName, cpf: cleanCpf, phone: cleanPhone },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      // Update profile with cpf and phone
      if (signUpData.user) {
        await supabase
          .from("profiles")
          .update({ cpf: cleanCpf, phone: cleanPhone })
          .eq("id", signUpData.user.id);
      }

      toast.success("Conta criada!", { description: "Verifique seu email para confirmar." });
      navigate("/login");
    } catch (err: any) {
      toast.error("Erro ao criar conta", { description: err.message });
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link to="/" className="font-display text-2xl font-bold text-foreground">
            TCG<span className="text-primary">Hub</span>
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">Crie sua conta</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <Input
            placeholder="Nome de exibição"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            maxLength={100}
          />

          {/* Email */}
          <div className="relative">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={emailStatus === "taken" ? "border-destructive" : ""}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <StatusIcon status={emailStatus} />
            </div>
            {emailStatus === "taken" && (
              <p className="mt-1 text-xs text-destructive">
                Email já está em uso.{" "}
                <Link to="/login" className="text-primary underline">Faça login</Link>.
              </p>
            )}
          </div>

          {/* CPF */}
          <div className="relative">
            <Input
              placeholder="CPF"
              value={cpf}
              onChange={(e) => setCpf(maskCpf(e.target.value))}
              required
              maxLength={14}
              className={cpfStatus === "taken" ? "border-destructive" : ""}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <StatusIcon status={cpfStatus} />
            </div>
            {cpfStatus === "taken" && (
              <p className="mt-1 text-xs text-destructive">
                CPF já cadastrado.{" "}
                <Link to="/login" className="text-primary underline">Faça login</Link>.
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="relative">
            <Input
              placeholder="Telefone"
              value={phone}
              onChange={(e) => setPhone(maskPhone(e.target.value))}
              required
              maxLength={15}
              className={phoneStatus === "taken" ? "border-destructive" : ""}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <StatusIcon status={phoneStatus} />
            </div>
            {phoneStatus === "taken" && (
              <p className="mt-1 text-xs text-destructive">
                Telefone já cadastrado.{" "}
                <Link to="/login" className="text-primary underline">Faça login</Link>.
              </p>
            )}
          </div>

          {/* Password */}
          <Input
            type="password"
            placeholder="Senha (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <div>
            <Input
              type="password"
              placeholder="Confirmar senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className={passwordMismatch ? "border-destructive" : ""}
            />
            {passwordMismatch && (
              <p className="mt-1 text-xs text-destructive">As senhas não coincidem.</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={!canSubmit}>
            {loading ? "Criando..." : "Criar conta"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
