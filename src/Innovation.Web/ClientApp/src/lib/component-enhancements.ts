export function enhanceComponent(className: string, enhancements: Record<string, string>): string {
  return [className, ...Object.values(enhancements).filter(Boolean)].join(' ').trim();
}

export const buttonVariants: Record<string, string | Record<string, string>> & {
  size: Record<string, string>;
} = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-accent/10 hover:text-accent-foreground',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  link: 'text-primary underline-offset-4 hover:underline',
  size: {
    default: 'h-9 px-4 py-2',
    sm: 'h-8 px-3 text-xs',
    lg: 'h-11 px-6 text-base',
    icon: 'size-9',
  },
};

export const cardVariants: Record<string, string> = {
  default: '',
  glass: 'bg-background/80 backdrop-blur-sm border-border/50',
  elevated: 'shadow-lg hover:shadow-xl',
  bordered: 'border-2',
  flat: 'shadow-none border-0 bg-muted/50',
};

export const hoverEffects: Record<string, string> = {
  lift: 'transition-transform hover:-translate-y-0.5',
  glow: 'transition-shadow hover:shadow-lg',
  slide: 'transition-transform hover:translate-x-0.5',
  fade: 'transition-opacity hover:opacity-80',
  modern: 'transition-all hover:-translate-y-0.5 hover:shadow-lg',
};

export const animations: Record<string, string> = {
  fadeIn: 'animate-in fade-in duration-300',
  slideIn: 'animate-in slide-in-from-bottom-2 duration-300',
  scaleIn: 'animate-in zoom-in-95 duration-300',
  slideUp: 'animate-in slide-in-from-bottom-4 duration-300',
  slideDown: 'animate-in slide-in-from-top-4 duration-300',
  slideLeft: 'animate-in slide-in-from-right-4 duration-300',
  slideRight: 'animate-in slide-in-from-left-4 duration-300',
};

export const spacing: Record<string, string> = {
  section: 'p-8',
  card: 'p-6',
  compact: 'p-4',
  tight: 'p-2',
  loose: 'p-10',
};

export const shadows: Record<string, string> = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  modern: 'shadow-md hover:shadow-lg transition-shadow',
  elevated: 'shadow-lg hover:shadow-xl transition-shadow',
  glass: 'shadow-lg shadow-black/5',
};
