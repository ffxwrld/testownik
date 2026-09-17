import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  format, 
  parseISO, 
  isValid, 
  addDays, 
  addMonths, 
  subMonths, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday, 
  isBefore, 
  startOfDay 
} from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface DatePickerProps {
  value?: string; // 'YYYY-MM-DD'
  onChange: (date: string) => void;
  minDate?: string; // 'YYYY-MM-DD'
  maxDate?: string; // 'YYYY-MM-DD'
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  allowClear?: boolean;
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'right' | 'center';
}

interface PresetOption {
  label: string;
  days: number;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder,
  className = '',
  disabled = false,
  allowClear = true,
  size = 'md',
  align = 'left',
}) => {
  const { t, i18n } = useTranslation();
  const currentLocale = i18n.language === 'en' ? enUS : pl;
  const isEn = i18n.language === 'en';
  const defaultPlaceholder = isEn ? 'Select date...' : 'Wybierz datę...';

  const presets: PresetOption[] = useMemo(() => [
    { label: isEn ? 'Tomorrow' : 'Jutro', days: 1 },
    { label: isEn ? 'In 3 days' : 'Za 3 dni', days: 3 },
    { label: isEn ? 'In a week' : 'Za tydzień', days: 7 },
    { label: isEn ? 'In 2 weeks' : 'Za 2 tyg.', days: 14 },
    { label: isEn ? 'In a month' : 'Za miesiąc', days: 30 },
  ], [isEn]);

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current selected date
  const selectedDate = useMemo(() => {
    if (!value) return null;
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : null;
  }, [value]);

  // Current view month/year
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (selectedDate) return selectedDate;
    if (minDate) {
      const parsedMin = parseISO(minDate);
      if (isValid(parsedMin)) return parsedMin;
    }
    return new Date();
  });

  // Sync current month when value changes
  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(selectedDate);
    }
  }, [selectedDate]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const minDateObj = useMemo(() => {
    if (!minDate) return null;
    const parsed = parseISO(minDate);
    return isValid(parsed) ? startOfDay(parsed) : null;
  }, [minDate]);

  const maxDateObj = useMemo(() => {
    if (!maxDate) return null;
    const parsed = parseISO(maxDate);
    return isValid(parsed) ? startOfDay(parsed) : null;
  }, [maxDate]);

  // Generate days grid for current month
  const daysInGrid = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentMonth]);

  const handleSelectDay = (day: Date) => {
    const formatted = format(day, 'yyyy-MM-dd');
    onChange(formatted);
    setIsOpen(false);
  };

  const handleSelectPreset = (daysOffset: number) => {
    const target = addDays(new Date(), daysOffset);
    const formatted = format(target, 'yyyy-MM-dd');
    onChange(formatted);
    setCurrentMonth(target);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const isDayDisabled = (day: Date) => {
    const normalizedDay = startOfDay(day);
    if (minDateObj && isBefore(normalizedDay, minDateObj)) return true;
    if (maxDateObj && isBefore(maxDateObj, normalizedDay)) return true;
    return false;
  };

  // Human-friendly label for the trigger button
  const displayLabel = useMemo(() => {
    if (!selectedDate) return null;
    return format(selectedDate, 'd MMMM yyyy (EEEE)', { locale: currentLocale });
  }, [selectedDate, currentLocale]);

  const weekDayHeaders = isEn 
    ? ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] 
    : ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs min-h-[36px] rounded-lg gap-2',
    md: 'px-4 py-2.5 text-sm min-h-[44px] rounded-xl gap-2.5',
    lg: 'px-5 py-3 text-base min-h-[48px] rounded-xl gap-3',
  }[size];

  const alignClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  }[align];

  return (
    <div ref={containerRef} className={cn('relative inline-block w-full text-left', className)}>
      {/* Trigger Button */}
      <motion.button
        type="button"
        whileTap={disabled ? undefined : { scale: 0.985 }}
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'w-full flex items-center justify-between border font-medium transition-all duration-150 select-none cursor-pointer',
          sizeClasses,
          isOpen
            ? 'border-primary-500 ring-2 ring-primary-500/20 bg-white dark:bg-zinc-900 shadow-md'
            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/60 shadow-xs',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <CalendarIcon className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
          <span className={cn('truncate', !selectedDate ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-900 dark:text-zinc-100 font-semibold')}>
            {displayLabel || placeholder || defaultPlaceholder}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {allowClear && selectedDate && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title={isEn ? 'Clear date' : 'Wyczyść datę'}
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </motion.button>

      {/* Popover Calendar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={cn(
              'absolute top-full mt-2 z-50 w-[320px] sm:w-[340px] rounded-2xl p-4 shadow-2xl border',
              'bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border-zinc-200/80 dark:border-zinc-800/80',
              alignClasses
            )}
          >
            {/* Quick Presets */}
            <div className="mb-3.5 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 mb-2 uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-primary-500" />
                <span>{isEn ? 'Quick presets' : 'Szybki wybór'}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleSelectPreset(p.days)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-primary-50 hover:text-primary-600 dark:bg-zinc-800 dark:hover:bg-primary-950/40 dark:hover:text-primary-400 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Month Stepper Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-sm font-bold capitalize text-zinc-900 dark:text-zinc-100">
                {format(currentMonth, 'LLLL yyyy', { locale: currentLocale })}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
                  className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title={isEn ? 'Previous month' : 'Poprzedni miesiąc'}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
                  className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title={isEn ? 'Next month' : 'Następny miesiąc'}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 mb-1 text-center">
              {weekDayHeaders.map((dayName) => (
                <span
                  key={dayName}
                  className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 py-1"
                >
                  {dayName}
                </span>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {daysInGrid.map((day) => {
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isTodayDate = isToday(day);
                const disabledDay = isDayDisabled(day);

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    disabled={disabledDay}
                    onClick={() => handleSelectDay(day)}
                    className={cn(
                      'h-9 w-full rounded-xl text-xs font-semibold flex items-center justify-center relative transition-all duration-150 cursor-pointer',
                      isSelected
                        ? 'bg-primary-600 text-white font-bold shadow-md shadow-primary-500/30 scale-105 z-10'
                        : isCurrentMonth
                        ? 'text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        : 'text-zinc-300 dark:text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/40',
                      isTodayDate && !isSelected && 'ring-1.5 ring-primary-500/50 font-bold',
                      disabledDay && 'opacity-25 cursor-not-allowed pointer-events-none hover:bg-transparent'
                    )}
                  >
                    <span>{format(day, 'd')}</span>
                    {isTodayDate && !isSelected && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer Buttons */}
            <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  if (!isDayDisabled(today)) {
                    handleSelectDay(today);
                  }
                }}
                disabled={isDayDisabled(new Date())}
                className="font-semibold text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-40 cursor-pointer"
              >
                {isEn ? 'Today' : 'Dzisiaj'}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 font-semibold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              >
                {t('common.close', isEn ? 'Close' : 'Zamknij')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
