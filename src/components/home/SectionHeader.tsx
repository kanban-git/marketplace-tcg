import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  icon?: string;
}

const SectionHeader = ({ title, subtitle, ctaLabel, ctaHref, icon }: Props) => (
  <div className="mb-6 flex items-end justify-between gap-4">
    <div>
      <h2 className="font-display text-xl font-bold text-foreground md:text-2xl">
        {icon && <span className="mr-1.5">{icon}</span>}
        {title}
      </h2>
      {subtitle && (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
    {ctaLabel && ctaHref && (
      <Link
        to={ctaHref}
        className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
      >
        {ctaLabel}
        <ChevronRight className="h-4 w-4" />
      </Link>
    )}
  </div>
);

export default SectionHeader;
