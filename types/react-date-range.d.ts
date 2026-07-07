declare module 'react-date-range' {
  import { Component } from 'react';

  export interface Range {
    startDate: Date;
    endDate: Date;
    key: string;
  }

  export interface RangeKeyDict {
    selection: Range;
  }

  export interface DateRangeProps {
    ranges: Range[];
    onChange: (ranges: RangeKeyDict) => void;
    months?: number;
    direction?: 'vertical' | 'horizontal';
    showDateDisplay?: boolean;
    showMonthAndYearPickers?: boolean;
    rangeColors?: string[];
    date?: Date;
    minDate?: Date;
    maxDate?: Date;
    disabledDates?: Date[];
    className?: string;
  }

  export class DateRange extends Component<DateRangeProps> {}
} 