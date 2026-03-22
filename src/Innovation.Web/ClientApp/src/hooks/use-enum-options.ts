import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface SelectOption {
  value: string;
  label: string;
}

export function useEnumOptions<T extends Record<string, string | number>>(
  enumObj: T,
  labelFn: (value: T[keyof T]) => string,
  includeAll = true,
): SelectOption[] {
  const { t } = useTranslation();

  return useMemo(() => {
    const options = Object.keys(enumObj)
      .filter((k) => isNaN(Number(k)))
      .map((name) => ({ value: name, label: labelFn(enumObj[name as keyof T]) }));
    return includeAll ? [{ value: 'all', label: t('common:all') }, ...options] : options;
  }, [enumObj, labelFn, includeAll, t]);
}
