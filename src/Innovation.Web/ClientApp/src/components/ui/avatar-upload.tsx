import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Building, Camera, Upload, X } from 'lucide-react';
import React, { ChangeEvent, useState } from 'react';

interface AvatarUploadProps {
  value?: File | string;
  onChange?: (value?: File) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallbackIcon?: React.ReactNode;
  fallbackText?: string;
  accept?: string;
  maxSize?: number; // in MB
  disabled?: boolean;
  showRemove?: boolean;
  variant?: 'avatar' | 'square';
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
  xl: 'w-40 h-40',
};

function getImageData(event: ChangeEvent<HTMLInputElement>) {
  if (!event.target.files || event.target.files.length === 0) {
    return null;
  }

  const file = event.target.files[0];
  if (!file) return null;
  const displayUrl = URL.createObjectURL(file);

  return { file, displayUrl };
}

export function AvatarUpload({
  value,
  onChange,
  className,
  size = 'md',
  fallbackIcon,
  fallbackText,
  accept = 'image/*',
  maxSize = 2, // 2MB default
  disabled = false,
  showRemove = true,
  variant = 'avatar',
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string>('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Get the preview URL
  const previewUrl = React.useMemo(() => {
    if (preview) return preview;
    if (typeof value === 'string') return value;
    if (value instanceof File) return URL.createObjectURL(value);
    return '';
  }, [value, preview]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const result = getImageData(event);
    if (!result) return;

    const { file, displayUrl } = result;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`حجم الملف يجب أن يكون أقل من ${maxSize}MB`);
      return;
    }

    setPreview(displayUrl);
    onChange?.(file);
  };

  const handleRemove = () => {
    setPreview('');
    onChange?.(undefined);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('يجب أن يكون الملف صورة');
        return;
      }

      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        alert(`حجم الملف يجب أن يكون أقل من ${maxSize}MB`);
        return;
      }

      const displayUrl = URL.createObjectURL(file);
      setPreview(displayUrl);
      onChange?.(file);
    }
  };

  return (
    <div className={cn('relative group', className)}>
      <div
        className={cn(
          'relative cursor-pointer transition-all duration-200',
          sizeClasses[size],
          dragOver && 'scale-105 ring-2 ring-alinma-deep-blue ring-opacity-50',
          disabled && 'cursor-not-allowed opacity-50',
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <Avatar
          className={cn(
            'w-full h-full transition-all duration-200 group-hover:brightness-75 border border-primary bg-background',
            variant === 'square' && 'rounded-lg',
          )}
        >
          <AvatarImage src={previewUrl} className="object-cover" />
          <AvatarFallback
            className={cn(
              'bg-white flex flex-col items-center justify-center gap-2 text-muted-foreground',
              variant === 'square' && 'rounded-lg',
            )}
          >
            {fallbackIcon || <Building className="h-6 w-6" />}
            {fallbackText && size !== 'sm' && (
              <span className="text-xs text-center px-1">{fallbackText}</span>
            )}
          </AvatarFallback>
        </Avatar>

        {/* Overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center',
            variant === 'square' && 'rounded-lg',
            variant === 'avatar' && 'rounded-full',
          )}
        >
          {previewUrl ? (
            <Camera className="h-6 w-6 text-white" />
          ) : (
            <Upload className="h-6 w-6 text-white" />
          )}
        </div>
      </div>

      {/* Remove button */}
      {showRemove && previewUrl && !disabled && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            handleRemove();
          }}
          type="button"
        >
          <X className="h-3 w-3" />
        </Button>
      )}

      {/* Hidden input */}
      <Input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload hint */}
      {!previewUrl && size !== 'sm' && (
        <p className="text-xs text-muted-foreground text-center mt-2">اضغط أو اسحب لرفع الصورة</p>
      )}
    </div>
  );
}
