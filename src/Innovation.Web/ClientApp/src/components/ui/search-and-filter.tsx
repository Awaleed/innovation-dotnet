import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Grid,
  List,
  RefreshCw,
  Search,
  SortAsc,
  X,
} from 'lucide-react';
import { parseAsBoolean, useQueryState } from 'nuqs';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface SelectOption {
  value: string | undefined;
  label: string;
}

interface SearchAndFilterProps {
  searchTerm?: string;
  onSearchChange: (term: string) => void;

  sortBy?: string;
  onSortChange: (sort: string) => void;
  sortOptions: SelectOption[];

  // statuses
  status?: string;
  onStatusChange?: (status: string) => void;
  statusOptions?: SelectOption[];

  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;

  // Reset function
  onResetFilters?: () => void;

  // Customization
  searchPlaceholder?: string;
  className?: string;
  advancedFilters?: React.ReactNode;
  children?: React.ReactNode;
  filterOptions?: {
    key: string;
    label: string;
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
  }[];
}

export function SearchAndFilter({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  sortOptions,
  status,
  onStatusChange,
  statusOptions,
  viewMode,
  onViewModeChange,
  onResetFilters,
  searchPlaceholder = "البحث في التحديات، المنظمات، الكلمات المفتاحية...",
  className,
  advancedFilters,
  children,
  filterOptions,
}: SearchAndFilterProps) {
  const { t } = useTranslation('ui/search-and-filter');
  const [showFilters, setShowFilters] = useQueryState('showAdvancedFilters', parseAsBoolean.withDefault(false));
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm || '');

  // Update local search term when prop changes
  useEffect(() => {
    setLocalSearchTerm(searchTerm || '');
  }, [searchTerm]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchChange(localSearchTerm);
    }
  };

  const handleClearSearch = () => {
    setLocalSearchTerm('');
    onSearchChange('');
  };


  return (
    <Card className={className}>
      <CardContent className="px-6">
        <div className="space-y-4">
          {/* Main Search Bar */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              {localSearchTerm && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                  onClick={handleClearSearch}
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  <span className="sr-only">{t('clear_search')}</span>
                </Button>
              )}
              <Input
                placeholder={searchPlaceholder || t('search_placeholder')}
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className={`pr-10 bg-white ${localSearchTerm ? 'pl-10' : ''}`}
              />
            </div>

            {filterOptions && filterOptions.map(filter => (
              <Select key={filter.key} value={filter.value} onValueChange={filter.onChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value!}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}

            {advancedFilters && (
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2 bg-transparent"
              >
                <Filter className="w-4 h-4" />
                {t('advanced_filters')}
                {showFilters ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            )}

            {/* status */}
            {statusOptions && (
              <Select value={status} onValueChange={onStatusChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-48">
                <SortAsc className="w-4 h-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-1">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => onViewModeChange?.("grid")}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => onViewModeChange?.("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {advancedFilters && showFilters && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         {advancedFilters}

              </div>

                {onResetFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onResetFilters}
                  >
                    <RefreshCw className="w-4 h-4 ml-2" />
                    {t('reset_filters')}
                  </Button>
                )}
            </div>
          )}

          {children && (
            <div className="pt-4 border-t">
              {children}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
