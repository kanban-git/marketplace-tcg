import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2, User, Store } from "lucide-react";
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

  const [nameStatus, setNameStatus] = useState<ValidationStatus>("idle");
  const [emailStatus, setEmailStatus] = useState<ValidationStatus>("idle");
  const [docStatus, setDocStatus] = useState<ValidationStatus>("idle");
  const [phoneStatus, setPhoneStatus] = useState<ValidationStatus>("idle");

  useEffect(() => { setDocument(""); setDocStatus("idle"); }, [accountType]);

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

  const cleanDoc = document.replace(/\D/g, "");
  const docValid = accountType === "business" ? isValidCNPJ(cleanDoc) : isValidCPF(cleanDoc);
  const docError = cleanDoc.length >= (accountType === "business" ? 14 : 11) && !docValid;
  const emailsMatch = email.length > 0 && email === confirmEmail;
  const emailMismatch = confirmEmail.length > 0 && email !== confirmEmail;
  const passwordsMatch = password.length >= 6 && password === confirmPassword;
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const canSubmit =
    displayName.length > 0 && fullName.length > 0 &&
    nameStatus === "available" && emailStatus === "available" && emailsMatch &&
    docValid && docStatus === "available" &&
    phoneStatus === "available" && passwordsMatch && !loading;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, "");
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: email.trim(), password,
        options: {
          data: { display_name: displayName, full_name: fullName, document: cleanDoc, phone: cleanPhone, account_type: accountType },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      if (signUpData.user) {
        await supabase.from("profiles").update({
          cpf: accountType === "individual" ? cleanDoc : null,
          phone: cleanPhone, full_name: fullName, document: cleanDoc, account_type: accountType,
        } as any).eq("id", signUpData.user.id);
      }
      toast.success("Conta criada!", { description: "Verifique seu email para confirmar." });
      navigate("/login");
    } catch (err: any) {
      toast.error("Erro ao criar conta", { description: err.message });
    } finally { setLoading(false); isSubmittingRef.current = false; }
  };

  const docLabel = accountType === "business" ? "CNPJ" : "CPF";
  const docMask = accountType === "business" ? maskCnpj : maskCpf;
  const docMaxLen = accountType === "business" ? 18 : 14;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-block font-display text-3xl font-bold text-foreground">
            TCG<span className="text-primary">Hub</span>
          </Link>
          <p className="mt-2 text-muted-foreground">Crie sua conta e comece a negociar</p>
        </div>

        {/* Account Type Selector */}
        <Tabs value={accountType} onValueChange={(v) => setAccountType(v as AccountType)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl bg-secondary/60 p-1">
            <TabsTrigger
              value="individual"
              className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-md gap-2 text-sm font-semibold transition-all"
            >
              <User className="h-4 w-4" />
              Pessoa Física
            </TabsTrigger>
            <TabsTrigger
              value="business"
              className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-md gap-2 text-sm font-semibold transition-all"
            >
              <Store className="h-4 w-4" />
              Lojista
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-5">
          {/* Two-column row for name fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                {accountType === "business" ? "Nome da loja" : "Nickname"}
              </Label>
              <div className="relative">
                <Input
                  placeholder={accountType === "business" ? "Ex: PokéStore BR" : "Ex: TrainerAsh"}
                  value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                  required maxLength={100}
                  className={`h-11 rounded-lg bg-secondary/40 border-border/50 focus:bg-secondary/60 ${nameStatus === "taken" ? "border-destructive" : ""}`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2"><StatusIcon status={nameStatus} /></div>
              </div>
              {nameStatus === "taken" && <p className="text-xs text-destructive">Nome já está em uso.</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                {accountType === "business" ? "Nome do responsável" : "Nome completo"}
              </Label>
              <Input
                placeholder="Seu nome completo"
                value={fullName} onChange={(e) => setFullName(e.target.value)}
                required maxLength={200}
                className="h-11 rounded-lg bg-secondary/40 border-border/50 focus:bg-secondary/60"
              />
            </div>
          </div>

          {/* Email row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <div className="relative">
                <Input
                  type="email" placeholder="seu@email.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} required
                  className={`h-11 rounded-lg bg-secondary/40 border-border/50 focus:bg-secondary/60 ${emailStatus === "taken" ? "border-destructive" : ""}`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2"><StatusIcon status={emailStatus} /></div>
              </div>
              {emailStatus === "taken" && (
                <p className="text-xs text-destructive">
                  Email já em uso. <Link to="/login" className="text-primary underline">Entrar</Link>
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Confirmar email</Label>
              <Input
                type="email" placeholder="Repita o email" value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)} required
                className={`h-11 rounded-lg bg-secondary/40 border-border/50 focus:bg-secondary/60 ${emailMismatch ? "border-destructive" : ""}`}
              />
              {emailMismatch && <p className="text-xs text-destructive">Os emails não coincidem.</p>}
            </div>
          </div>

          {/* Document + Phone */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{docLabel}</Label>
              <div className="relative">
                <Input
                  placeholder={accountType === "business" ? "00.000.000/0000-00" : "000.000.000-00"}
                  value={document} onChange={(e) => setDocument(docMask(e.target.value))}
                  required maxLength={docMaxLen}
                  className={`h-11 rounded-lg bg-secondary/40 border-border/50 focus:bg-secondary/60 ${docStatus === "taken" || docError ? "border-destructive" : ""}`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2"><StatusIcon status={docStatus} /></div>
              </div>
              {docStatus === "taken" && (
                <p className="text-xs text-destructive">
                  {docLabel} já cadastrado. <Link to="/login" className="text-primary underline">Entrar</Link>
                </p>
              )}
              {docError && docStatus !== "taken" && (
                <p className="text-xs text-destructive">{docLabel} inválido.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Telefone</Label>
              <div className="relative">
                <Input
                  placeholder="(11) 99999-9999" value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  required maxLength={15}
                  className={`h-11 rounded-lg bg-secondary/40 border-border/50 focus:bg-secondary/60 ${phoneStatus === "taken" ? "border-destructive" : ""}`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2"><StatusIcon status={phoneStatus} /></div>
              </div>
              {phoneStatus === "taken" && (
                <p className="text-xs text-destructive">
                  Telefone já cadastrado. <Link to="/login" className="text-primary underline">Entrar</Link>
                </p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/40" /></div>
            <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">Segurança</span></div>
          </div>

          {/* Password */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Senha</Label>
              <Input
                type="password" placeholder="Mín. 6 caracteres"
                value={password} onChange={(e) => setPassword(e.target.value)}
                required minLength={6}
                className="h-11 rounded-lg bg-secondary/40 border-border/50 focus:bg-secondary/60"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Confirmar senha</Label>
              <Input
                type="password" placeholder="Repita a senha"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                required minLength={6}
                className={`h-11 rounded-lg bg-secondary/40 border-border/50 focus:bg-secondary/60 ${passwordMismatch ? "border-destructive" : ""}`}
              />
              {passwordMismatch && <p className="text-xs text-destructive">As senhas não coincidem.</p>}
            </div>
          </div>

          <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold" disabled={!canSubmit}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
