import { cn } from '@/lib/utils';
import { ImgHTMLAttributes } from 'react';

interface LogoIconProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  size?: number;
  variant?: 'light' | 'dark';
}

/**
 * Alinma Brandmark Shorthand (Emblem Only)
 *
 * Use only for:
 * - Mobile app icons
 * - Favicons
 * - Severely space-constrained digital contexts
 *
 * Minimum size: 35px or 4mm (emblem height)
 * Clear space: Half the height of the emblem must be maintained
 *
 * @see brand.txt Section 2.1 for complete brandmark usage guidelines
 */
export default function LogoIcon({
  size = 35,
  variant = 'light',
  className,
  ...props
}: LogoIconProps) {
  // Ensure minimum size requirement
  const actualSize = Math.max(size, 35);

  // Clear space (half of emblem height)
  const clearSpace = actualSize * 0.5;

  // Determine logo asset based on variant
  const logoSrc =
    variant === 'dark'
      ? '/assets/images/brand/logo-shorthand-white.svg'
      : '/assets/images/brand/logo-shorthand.svg';

  return (
    <div
      className={cn('inline-flex items-center justify-center', className)}
      style={{
        padding: `${clearSpace}px`,
        minWidth: `${actualSize + clearSpace * 2}px`,
        minHeight: `${actualSize + clearSpace * 2}px`,
      }}
      {...props}
    >
      <img
        src={logoSrc}
        alt="Alinma Emblem"
        style={{
          width: `${actualSize}px`,
          height: `${actualSize}px`,
          objectFit: 'contain',
        }}
        onError={(e) => {
          // Fallback to placeholder if asset not found
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const placeholder = document.createElement('div');
          placeholder.className =
            'flex items-center justify-center bg-gray-100 text-gray-400 text-xs rounded-full';
          placeholder.style.width = `${actualSize}px`;
          placeholder.style.height = `${actualSize}px`;
          placeholder.textContent = 'A';
          target.parentElement?.appendChild(placeholder);
        }}
      />
    </div>
  );
}
