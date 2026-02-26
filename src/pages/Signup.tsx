import { useState, useRef, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { isValidCPF, isValidCNPJ, maskCpf, maskCnpj, maskPhone } from "@/lib/validators";

type ValidationStatus = "idle" | "checking" | "available" | "taken";
type AccountType = "individual" | "business";

const StatusIcon = ({ status }: { status: ValidationStatus }) => {
  if (status === "checking") return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  if (status === "available") return <CheckCircle className="h-4 w-4 text-primary" />;
  if (status === "taken") return <XCircle className="h-4 w-4 text-destructive" />;
  return null;
};

const Signup = () => {
  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [displayName, setDisplayName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const isSubmittingRef = useRef(false);

  // Validation states
  const [nameStatus, setNameStatus] = useState<ValidationStatus>("idle");
  const [emailStatus, setEmailStatus] = useState<ValidationStatus>("idle");
  const [docStatus, setDocStatus] = useState<ValidationStatus>("idle");
  const [phoneStatus, setPhoneStatus] = useState<ValidationStatus>("idle");

  // Reset document when switching account type
  useEffect(() => {
    setDocument("");
    setDocStatus("idle");
  }, [accountType]);

  // Debounced email validator
  const emailTimerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!email.includes("@")) { setEmailStatus("idle"); return; }
    setEmailStatus("checking");
    clearTimeout(emailTimerRef.current);
    emailTimerRef.current = setTimeout(async () => {
      const { data, error } = await supabase.rpc("check_email_exists", { _email: email.trim() });
      if (error) { setEmailStatus("idle"); return; }
      setEmailStatus(data ? "taken" : "available");
    }, 500);
    return () => clearTimeout(emailTimerRef.current);
  }, [email]);

  // Profile field validator hook
  const useProfileFieldValidator = (
    value: string, column: string, minLength: number,
    setStatus: (s: ValidationStatus) => void, stripNonDigits = true
  ) => {
    const timerRef = useRef<ReturnType<typeof setTimeout>>();
    useEffect(() => {
      const queryValue = stripNonDigits ? value.replace(/\D/g, "") : value.trim();
      if (queryValue.length < minLength) { setStatus("idle"); return; }
      setStatus("checking");
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        const res = await (supabase.from("profiles").select("id") as any)
          .eq(column, queryValue).maybeSingle();
        setStatus(res.data ? "taken" : "available");
      }, 500);
      return () => clearTimeout(timerRef.current);
    }, [value]);
  };

  useProfileFieldValidator(displayName, "display_name", 2, setNameStatus, false);
  useProfileFieldValidator(document, "document", accountType === "business" ? 14 : 11, setDocStatus, true);
  useProfileFieldValidator(phone, "phone", 10, setPhoneStatus, true);

  // Derived validations
  const cleanDoc = document.replace(/\D/g, "");
  const docValid = accountType === "business" ? isValidCNPJ(cleanDoc) : isValidCPF(cleanDoc);
  const docError = cleanDoc.length >= (accountType === "business" ? 14 : 11) && !docValid;
  const emailsMatch = email.length > 0 && email === confirmEmail;
  const emailMismatch = confirmEmail.length > 0 && email !== confirmEmail;
  const passwordsMatch = password.length >= 6 && password === confirmPassword;
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const canSubmit =
    displayName.length > 0 &&
    fullName.length > 0 &&
    nameStatus === "available" &&
    emailStatus === "available" &&
    emailsMatch &&
    docValid &&
    docStatus === "available" &&
    phoneStatus === "available" &&
    passwordsMatch &&
    !loading;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setLoading(true);

    try {
      const cleanPhone = phone.replace(/\D/g, "");
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName,
            full_name: fullName,
            document: cleanDoc,
            phone: cleanPhone,
            account_type: accountType,
          },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;

      // Update profile with extra fields (trigger may not have all)
      if (signUpData.user) {
        await supabase.from("profiles").update({
          cpf: accountType === "individual" ? cleanDoc : null,
          phone: cleanPhone,
          full_name: fullName,
          document: cleanDoc,
          account_type: accountType,
        } as any).eq("id", signUpData.user.id);
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

  const docLabel = accountType === "business" ? "CNPJ" : "CPF";
  const docMask = accountType === "business" ? maskCnpj : maskCpf;
  const docMaxLen = accountType === "business" ? 18 : 14;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link to="/" className="font-display text-2xl font-bold text-foreground">
            TCG<span className="text-primary">Hub</span>
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">Crie sua conta</p>
        </div>

        {/* Account type tabs */}
        <Tabs value={accountType} onValueChange={(v) => setAccountType(v as AccountType)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="individual">Pessoa Física (CPF)</TabsTrigger>
            <TabsTrigger value="business">Lojista (CNPJ)</TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={handleSignup} className="space-y-3">
          {/* Display name */}
          <div className="relative">
            <Input
              placeholder={accountType === "business" ? "Nome da loja" : "Nickname (nome de exibição)"}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required maxLength={100}
              className={nameStatus === "taken" ? "border-destructive" : ""}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2"><StatusIcon status={nameStatus} /></div>
            {nameStatus === "taken" && <p className="mt-1 text-xs text-destructive">Nome já está em uso.</p>}
          </div>

          {/* Full name */}
          <Input
            placeholder={accountType === "business" ? "Nome do responsável" : "Nome completo"}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required maxLength={200}
          />

          {/* Email */}
          <div className="relative">
            <Input
              type="email" placeholder="Email" value={email}
              onChange={(e) => setEmail(e.target.value)} required
              className={emailStatus === "taken" ? "border-destructive" : ""}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2"><StatusIcon status={emailStatus} /></div>
            {emailStatus === "taken" && (
              <p className="mt-1 text-xs text-destructive">
                Email já está em uso. <Link to="/login" className="text-primary underline">Faça login</Link>.
              </p>
            )}
          </div>

          {/* Confirm email */}
          <div>
            <Input
              type="email" placeholder="Confirmar email" value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)} required
              className={emailMismatch ? "border-destructive" : ""}
            />
            {emailMismatch && <p className="mt-1 text-xs text-destructive">Os emails não coincidem.</p>}
          </div>

          {/* Document (CPF or CNPJ) */}
          <div className="relative">
            <Input
              placeholder={docLabel} value={document}
              onChange={(e) => setDocument(docMask(e.target.value))}
              required maxLength={docMaxLen}
              className={docStatus === "taken" || docError ? "border-destructive" : ""}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2"><StatusIcon status={docStatus} /></div>
            {docStatus === "taken" && (
              <p className="mt-1 text-xs text-destructive">
                {docLabel} já cadastrado. <Link to="/login" className="text-primary underline">Faça login</Link>.
              </p>
            )}
            {docError && docStatus !== "taken" && (
              <p className="mt-1 text-xs text-destructive">{docLabel} inválido.</p>
            )}
          </div>

          {/* Phone */}
          <div className="relative">
            <Input
              placeholder="Telefone (com DDD)" value={phone}
              onChange={(e) => setPhone(maskPhone(e.target.value))}
              required maxLength={15}
              className={phoneStatus === "taken" ? "border-destructive" : ""}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2"><StatusIcon status={phoneStatus} /></div>
            {phoneStatus === "taken" && (
              <p className="mt-1 text-xs text-destructive">
                Telefone já cadastrado. <Link to="/login" className="text-primary underline">Faça login</Link>.
              </p>
            )}
          </div>

          {/* Password */}
          <Input
            type="password" placeholder="Senha (mín. 6 caracteres)"
            value={password} onChange={(e) => setPassword(e.target.value)}
            required minLength={6}
          />
          <div>
            <Input
              type="password" placeholder="Confirmar senha"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              required minLength={6}
              className={passwordMismatch ? "border-destructive" : ""}
            />
            {passwordMismatch && <p className="mt-1 text-xs text-destructive">As senhas não coincidem.</p>}
          </div>

          <Button type="submit" className="w-full" disabled={!canSubmit}>
            {loading ? "Criando..." : "Criar conta"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
