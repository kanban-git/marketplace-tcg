const Footer = () => (
  <footer className="border-t border-border bg-card">
    <div className="container mx-auto px-4 py-10">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="font-display text-sm font-bold text-primary-foreground">TC</span>
            </div>
            <span className="font-display text-lg font-bold text-foreground">
              Trade<span className="text-primary">Cards</span>
            </span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            O marketplace #1 de cartas TCG do Brasil.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Categorias</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#" className="hover:text-foreground">Pokémon</a></li>
            <li><a href="#" className="hover:text-foreground">Magic: The Gathering</a></li>
            <li><a href="#" className="hover:text-foreground">Yu-Gi-Oh!</a></li>
            <li><a href="#" className="hover:text-foreground">One Piece</a></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Suporte</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#" className="hover:text-foreground">Como vender</a></li>
            <li><a href="#" className="hover:text-foreground">Guia do comprador</a></li>
            <li><a href="#" className="hover:text-foreground">Central de ajuda</a></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Legal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#" className="hover:text-foreground">Termos de uso</a></li>
            <li><a href="#" className="hover:text-foreground">Privacidade</a></li>
          </ul>
        </div>
      </div>

      <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
        © 2026 TradeCards. Todos os direitos reservados.
      </div>
    </div>
  </footer>
);

export default Footer;
