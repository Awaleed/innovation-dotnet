import { useState, createContext, useContext, useRef, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { X, Plus, Edit2, Loader2, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';

interface LocalizedText {
  [languageCode: string]: string;
}

interface LocalizedArray {
  [languageCode: string]: string[];
}

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

interface LocalizedFormContextType {
  currentLanguage: string;
  setCurrentLanguage: (lang: string) => void;
  languages: Language[];
  formData: { [fieldName: string]: LocalizedText };
  updateField: (fieldName: string, value: LocalizedText) => void;
}

const LocalizedFormContext = createContext<LocalizedFormContextType | null>(null);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const useLocalizedForm = () => {
  const context = useContext(LocalizedFormContext);
  if (!context) {
    throw new Error('useLocalizedForm must be used within a LocalizedFormProvider');
  }
  return context;
};

interface LocalizedInputProps {
  name: string;
  placeholder?: string;
  label?: React.ReactNode;
  required?: boolean;
  maxLength?: number;
  className?: string;
  type?: 'input' | 'textarea';
  languages?: Language[];
  defaultLanguage?: string;
  value?: LocalizedText;
  onChange?: (value: LocalizedText) => void;
  error?: string;
}

const DEFAULT_LANGUAGES: Language[] = [
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
];

function LocalizedInput({
  name,
  placeholder,
  label,
  required: _required = false,
  maxLength,
  className,
  type = 'input',
  languages = DEFAULT_LANGUAGES,
  defaultLanguage = 'ar',
  value = {},
  onChange,
  error,
}: LocalizedInputProps) {
  const { t } = useTranslation();
  const defaultPlaceholder = placeholder || t('ui/localized-form:enter_text');
  const [currentLanguage, setCurrentLanguage] = useState(defaultLanguage);
  const [isTranslating, setIsTranslating] = useState(false);
  const currentValue = value[currentLanguage] || '';

  const getLanguageInfo = (code: string) => {
    return (
      languages.find((lang) => lang.code === code) || {
        code,
        name: code.toUpperCase(),
        nativeName: code.toUpperCase(),
        flag: '🌐',
      }
    );
  };

  const handleChange = (text: string) => {
    const newValue = { ...value, [currentLanguage]: text };
    onChange?.(newValue);
  };

  const sourceLanguage = languages.find(
    (lang) =>
      lang.code !== currentLanguage &&
      typeof value[lang.code] === 'string' &&
      (value[lang.code] as string).trim(),
  );

  const handleTranslate = async () => {
    if (!sourceLanguage || isTranslating) {
      return;
    }
    setIsTranslating(true);
    try {
      // eslint-disable-next-line no-restricted-syntax
      const response = await axios.post('/api/ai-translate', {
        text: value[sourceLanguage.code],
        target_lang: currentLanguage,
      });
      const translated: string = response.data?.data?.translation ?? '';
      if (translated) {
        onChange?.({ ...value, [currentLanguage]: translated });
      }
    } catch {
      // silently ignore — the field stays empty so the user can type manually
    } finally {
      setIsTranslating(false);
    }
  };

  const currentLang = getLanguageInfo(currentLanguage);
  const allLanguages = languages.map((lang) => lang.code);
  const inputtedLanguages = Object.keys(value).filter((lang) => {
    const langValue = value[lang];
    return typeof langValue === 'string' && langValue.trim();
  });

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-2">{label}</Label>
        </div>
      )}

      <div className="space-y-2">
        {type === 'textarea' ? (
          <Textarea
            value={currentValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={`${defaultPlaceholder} (${currentLang.name})`}
            dir={currentLang.code === 'ar' ? 'rtl' : 'ltr'}
            maxLength={maxLength}
            data-testid={`localized-textarea-${name}-${currentLanguage}`}
            name={`${name}-${currentLanguage}`}
            className="bg-white"
          />
        ) : (
          <Input
            value={currentValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={`${defaultPlaceholder} (${currentLang.name})`}
            dir={currentLang.code === 'ar' ? 'rtl' : 'ltr'}
            maxLength={maxLength}
            data-testid={`localized-input-${name}-${currentLanguage}`}
            name={`${name}-${currentLanguage}`}
            className="bg-white"
          />
        )}

        <div className="flex flex-wrap gap-2 items-center">
          {allLanguages.map((langCode) => {
            const lang = getLanguageInfo(langCode);
            const isActive = langCode === currentLanguage;
            const hasContent = inputtedLanguages.includes(langCode);
            return (
              <button
                key={langCode}
                type="button"
                className={cn(
                  'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all duration-200 relative',
                  'border border-border/50 hover:border-border',
                  'hover:scale-105 hover:shadow-sm',
                  'whitespace-nowrap flex-shrink-0',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary/80',
                  hasContent ? 'opacity-100' : 'opacity-60',
                )}
                onClick={() => setCurrentLanguage(langCode)}
                data-testid={`localized-lang-tab-${name}-${langCode}`}
              >
                <span className="me-1.5 text-sm flex-shrink-0">{lang.flag}</span>
                <span className="font-medium truncate max-w-[120px]">{lang.nativeName}</span>
                {hasContent && (
                  <div className="absolute -top-0.5 -end-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-white shadow-sm flex-shrink-0"></div>
                )}
              </button>
            );
          })}

          {sourceLanguage && !currentValue && (
            <button
              type="button"
              disabled={isTranslating}
              onClick={handleTranslate}
              data-testid={`localized-translate-btn-${name}-${currentLanguage}`}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all duration-200',
                'border border-lavender/60 text-[#8b84d7] hover:bg-[#E7E5F7] hover:border-[#8b84d7]',
                'whitespace-nowrap flex-shrink-0',
                isTranslating && 'opacity-60 cursor-not-allowed',
              )}
            >
              {isTranslating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin flex-shrink-0" />
              ) : (
                <Wand2 className="h-3.5 w-3.5 flex-shrink-0" />
              )}
              <span>
                {isTranslating
                  ? t('ui/localized-form:translating')
                  : t('ui/localized-form:translate_from', { lang: sourceLanguage.nativeName })}
              </span>
            </button>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive mt-1" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

interface LocalizedChipInputProps {
  name: string;
  placeholder?: string;
  label?: React.ReactNode;
  required?: boolean;
  className?: string;
  languages?: Language[];
  defaultLanguage?: string;
  value?: LocalizedArray;
  onChange?: (value: LocalizedArray) => void;
  maxTags?: number;
  allowDuplicates?: boolean;
}

function LocalizedChipInput({
  name,
  placeholder,
  label,
  required = false,
  className,
  languages = DEFAULT_LANGUAGES,
  defaultLanguage = 'ar',
  value = {},
  onChange,
  maxTags = 10,
  allowDuplicates = false,
}: LocalizedChipInputProps) {
  const { t } = useTranslation();
  const defaultPlaceholder = placeholder || t('ui/localized-form:enter_item_and_press_enter');
  const [currentLanguage, setCurrentLanguage] = useState(defaultLanguage);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const currentItems = value[currentLanguage] || [];

  const getLanguageInfo = (code: string) => {
    return (
      languages.find((lang) => lang.code === code) || {
        code,
        name: code.toUpperCase(),
        nativeName: code.toUpperCase(),
        flag: '🌐',
      }
    );
  };

  const handleAddItem = (item: string) => {
    if (!item.trim()) return;

    const trimmedItem = item.trim();
    if (!allowDuplicates && currentItems.includes(trimmedItem)) return;
    if (currentItems.length >= maxTags) return;

    const newValue = {
      ...value,
      [currentLanguage]: [...currentItems, trimmedItem],
    };
    onChange?.(newValue);
    setInputValue('');
  };

  const handleRemoveItem = (indexToRemove: number) => {
    const newItems = currentItems.filter((_, index) => index !== indexToRemove);
    const newValue = { ...value, [currentLanguage]: newItems };
    onChange?.(newValue);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && currentItems.length > 0) {
      handleRemoveItem(currentItems.length - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const currentLang = getLanguageInfo(currentLanguage);
  const allLanguages = languages.map((lang) => lang.code);
  const hasItemsLanguages = Object.keys(value).filter((lang) => (value[lang] ?? []).length > 0);

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-2">
            {label}
            {required && <span className="text-destructive">*</span>}
          </Label>
        </div>
      )}

      <div className="space-y-2">
        {/* Chip display area with input */}
        <div
          className={cn(
            'flex flex-wrap gap-1 min-h-[40px] p-2 border border-border rounded-md bg-background',
            'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
            currentLang.code === 'ar' ? 'flex-row-reverse' : 'flex-row',
          )}
        >
          {currentItems.map((item, index) => (
            <Badge
              key={index}
              variant="secondary"
              className={cn(
                'flex items-center gap-1 px-2 py-1 text-xs',
                'hover:bg-secondary/80 transition-colors',
                currentLang.code === 'ar' ? 'flex-row-reverse' : 'flex-row',
              )}
            >
              <span>{item}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="p-0 w-4 h-4 hover:bg-transparent"
                onClick={() => handleRemoveItem(index)}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}

          {currentItems.length < maxTags && (
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                currentItems.length === 0 ? `${defaultPlaceholder} (${currentLang.name})` : ''
              }
              className="flex-1 min-w-[120px] border-none shadow-none focus-visible:ring-0 p-0 h-auto"
              dir={currentLang.code === 'ar' ? 'rtl' : 'ltr'}
              data-testid={`localized-chip-input-${name}`}
            />
          )}

          {inputValue && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto p-1"
              onClick={() => handleAddItem(inputValue)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Language selector */}
        <div className="flex flex-wrap gap-2 items-center">
          {allLanguages.map((langCode) => {
            const lang = getLanguageInfo(langCode);
            const isActive = langCode === currentLanguage;
            const hasContent = hasItemsLanguages.includes(langCode);
            const itemCount = value[langCode]?.length || 0;

            return (
              <button
                key={langCode}
                type="button"
                className={cn(
                  'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all duration-200 relative',
                  'border border-border/50 hover:border-border',
                  'hover:scale-105 hover:shadow-sm',
                  'whitespace-nowrap flex-shrink-0',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary/80',
                  hasContent ? 'opacity-100' : 'opacity-60',
                )}
                onClick={() => setCurrentLanguage(langCode)}
              >
                <span className="me-1.5 text-sm flex-shrink-0">{lang.flag}</span>
                <span className="font-medium truncate max-w-[100px]">{lang.nativeName}</span>
                {hasContent && (
                  <>
                    <div className="absolute -top-0.5 -end-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-white shadow-sm flex-shrink-0"></div>
                    <span className="ms-1.5 text-xs bg-background/20 px-1.5 py-0.5 rounded-full flex-shrink-0">
                      {itemCount}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Helper text */}
        {currentItems.length >= maxTags && (
          <p className="text-xs text-muted-foreground">
            {t('ui/localized-form:maximum_items_allowed', { count: maxTags })}
          </p>
        )}

        {inputValue && (
          <p className="text-xs text-muted-foreground">
            {t('ui/localized-form:press_enter_to_add', { item: inputValue })}
          </p>
        )}
      </div>
    </div>
  );
}

interface LocalizedPairedArrayInputProps {
  name: string;
  placeholder?: string;
  label?: React.ReactNode;
  required?: boolean;
  className?: string;
  languages?: Language[];
  value?: LocalizedArray;
  onChange?: (value: LocalizedArray) => void;
  maxItems?: number;
  addButtonText?: string;
  editButtonText?: string;
  emptyStateText?: string;
}

function LocalizedPairedArrayInput({
  name: _name,
  placeholder,
  label,
  required = false,
  className,
  languages = DEFAULT_LANGUAGES,
  value = {},
  onChange,
  maxItems = 10,
  addButtonText,
  editButtonText,
  emptyStateText,
}: LocalizedPairedArrayInputProps) {
  const { t } = useTranslation();
  const defaultPlaceholder = placeholder || t('ui/localized-form:enter_item');
  const defaultAddButtonText = addButtonText || t('ui/localized-form:add_item');
  const _defaultEditButtonText = editButtonText || t('ui/localized-form:edit');
  const defaultEmptyStateText = emptyStateText || t('ui/localized-form:no_items_added_yet');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<LocalizedText>({});

  // Get the maximum number of items across all languages
  const maxItemCount = Math.max(...languages.map((lang) => value[lang.code]?.length || 0), 0);

  const handleAddItem = () => {
    setEditingIndex(null);
    setFormData({});
    setIsDialogOpen(true);
  };

  const handleEditItem = (index: number) => {
    setEditingIndex(index);
    // Build form data from the item at this index across all languages
    const itemData: LocalizedText = {};
    languages.forEach((lang) => {
      itemData[lang.code] = value[lang.code]?.[index] || '';
    });
    setFormData(itemData);
    setIsDialogOpen(true);
  };

  const handleRemoveItem = (index: number) => {
    const newValue: LocalizedArray = {};
    languages.forEach((lang) => {
      const langArray = value[lang.code] || [];
      newValue[lang.code] = langArray.filter((_, i) => i !== index);
    });
    onChange?.(newValue);
  };

  const handleSaveItem = () => {
    // Validate that at least one language has content
    const hasContent = languages.some((lang) => formData[lang.code]?.trim());
    if (!hasContent) return;

    const newValue: LocalizedArray = { ...value };

    languages.forEach((lang) => {
      if (!newValue[lang.code]) {
        newValue[lang.code] = [];
      }

      const itemText = formData[lang.code] || '';

      if (editingIndex !== null) {
        // Update existing item at the same index across all languages
        if (newValue[lang.code]) {
          newValue[lang.code]![editingIndex] = itemText;
        }
      } else {
        // Add new item to the end of each language array
        newValue[lang.code]?.push(itemText);
      }
    });

    onChange?.(newValue);
    setIsDialogOpen(false);
    setFormData({});
    setEditingIndex(null);
  };

  const handleInputChange = (langCode: string, text: string) => {
    setFormData((prev) => ({ ...prev, [langCode]: text }));
  };

  const getDisplayText = (index: number) => {
    // Show the first available language text at this index, prefer Arabic then English
    return (
      value.ar?.[index] ||
      value.en?.[index] ||
      languages.map((lang) => value[lang.code]?.[index]).find((text) => text?.trim()) ||
      ''
    );
  };

  const _getLanguageInfo = (code: string) => {
    return (
      languages.find((lang) => lang.code === code) || {
        code,
        name: code.toUpperCase(),
        nativeName: code.toUpperCase(),
        flag: '🌐',
      }
    );
  };

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-2">
            {label}
            {required && <span className="text-destructive">*</span>}
          </Label>
          <span className="text-xs text-muted-foreground">
            {maxItemCount}/{maxItems}
          </span>
        </div>
      )}

      <div className="space-y-2">
        {/* Items list */}
        {maxItemCount > 0 ? (
          <div className="space-y-2">
            {Array.from({ length: maxItemCount }, (_, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border border-border rounded-md bg-secondary/20 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{getDisplayText(index)}</p>
                  <div className="flex gap-2 mt-1">
                    {languages.map((lang) => {
                      const text = value[lang.code]?.[index];
                      if (!text?.trim()) return null;
                      return (
                        <Badge key={lang.code} variant="outline" className="text-xs">
                          {lang.flag} {text}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditItem(index)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed border-border rounded-md">
            {defaultEmptyStateText}
          </div>
        )}

        {/* Add button */}
        {maxItemCount < maxItems && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="w-full"
              >
                <Plus className="w-4 h-4 me-2" />
                {defaultAddButtonText}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingIndex !== null
                    ? t('ui/localized-form:edit_item')
                    : t('ui/localized-form:add_new_item')}
                </DialogTitle>
                <DialogDescription>
                  {t('ui/localized-form:enter_text_different_languages')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {languages.map((lang) => (
                  <div key={lang.code} className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <span className="text-sm">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </Label>
                    <Input
                      value={formData[lang.code] || ''}
                      onChange={(e) => handleInputChange(lang.code, e.target.value)}
                      placeholder={`${defaultPlaceholder} (${lang.nativeName})`}
                      dir={lang.code === 'ar' ? 'rtl' : 'ltr'}
                    />
                  </div>
                ))}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('common:cancel')}
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveItem}
                  disabled={!languages.some((lang) => formData[lang.code]?.trim())}
                >
                  {editingIndex !== null ? t('common:update') : t('ui/localized-form:add_item')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

export {
  LocalizedInput,
  LocalizedChipInput,
  LocalizedPairedArrayInput,
  type LocalizedText,
  type LocalizedArray,
  type Language,
};
