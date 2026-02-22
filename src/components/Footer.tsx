import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <button onClick={() => navigate("/")} className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="font-display text-sm font-bold text-primary-foreground">TG</span>
              </div>
              <span className="font-display text-lg font-bold text-foreground">
                TCG<span className="text-primary">Hub</span>
              </span>
            </button>
            <p className="mt-3 text-sm text-muted-foreground">
              O seu hub de cartas TCG no Brasil.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Suporte</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button className="hover:text-foreground">Como vender</button></li>
              <li><button className="hover:text-foreground">Guia do comprador</button></li>
              <li><button className="hover:text-foreground">Central de ajuda</button></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button className="hover:text-foreground">Termos de uso</button></li>
              <li><button className="hover:text-foreground">Privacidade</button></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © 2026 TCGHub. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
