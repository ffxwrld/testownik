import React from 'react';

export const ScheduleStyles: React.FC = () => {
  return (
    <style>{`
      .rbc-calendar {
        font-family: inherit;
        height: 100% !important;
        display: flex;
        flex-direction: column;
      }

      /* Month Grid Container */
      .rbc-month-view {
        border: 1px solid #e4e4e7 !important;
        border-radius: 1.25rem;
        overflow: hidden;
        flex: 1 1 0;
        display: flex;
        flex-direction: column;
        background: transparent;
      }
      .dark .rbc-month-view {
        border-color: #27272a !important;
      }

      /* Weekday Header Row */
      .rbc-month-header {
        border-bottom: 1px solid #e4e4e7 !important;
        background: rgba(244, 244, 245, 0.4);
      }
      .dark .rbc-month-header {
        border-bottom-color: #27272a !important;
        background: rgba(39, 39, 42, 0.3);
      }
      .rbc-header {
        padding: 0.65rem 0.5rem !important;
        font-weight: 600 !important;
        font-size: 0.72rem !important;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #71717a !important;
        border-bottom: 0 !important;
      }
      .dark .rbc-header {
        color: #a1a1aa !important;
      }

      /* Day Rows */
      .rbc-month-row {
        border-top: 1px solid #f4f4f5 !important;
        min-height: 72px;
      }
      .dark .rbc-month-row {
        border-top-color: rgba(39, 39, 42, 0.6) !important;
      }

      /* Day Cell Backgrounds */
      .rbc-day-bg + .rbc-day-bg {
        border-left: 1px solid #f4f4f5 !important;
      }
      .dark .rbc-day-bg + .rbc-day-bg {
        border-left-color: rgba(39, 39, 42, 0.6) !important;
      }

      /* Today Highlight in Apple Calendar style */
      .rbc-day-bg.rbc-today {
        background-color: rgba(37, 99, 235, 0.03) !important;
      }
      .dark .rbc-day-bg.rbc-today {
        background-color: rgba(37, 99, 235, 0.08) !important;
      }

      /* Outside month range */
      .rbc-day-bg.rbc-off-range-bg {
        background-color: rgba(244, 244, 245, 0.5) !important;
      }
      .dark .rbc-day-bg.rbc-off-range-bg {
        background-color: rgba(18, 18, 21, 0.4) !important;
      }

      /* Date Number Cell */
      .rbc-date-cell {
        padding: 0.4rem 0.5rem !important;
        font-size: 0.75rem;
        font-weight: 500;
        color: #52525b;
      }
      .dark .rbc-date-cell {
        color: #a1a1aa;
      }
      .rbc-date-cell.rbc-off-range {
        color: #d4d4d8 !important;
      }
      .dark .rbc-date-cell.rbc-off-range {
        color: #52525b !important;
      }

      /* Apple Calendar Today Circle */
      .rbc-date-cell.rbc-now > a,
      .rbc-date-cell.rbc-now > button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.6rem;
        height: 1.6rem;
        border-radius: 9999px;
        background-color: #2563eb;
        color: #ffffff !important;
        font-weight: 700;
        margin-right: -0.15rem;
      }
      .dark .rbc-date-cell.rbc-now > a,
      .dark .rbc-date-cell.rbc-now > button {
        background-color: #3b82f6;
      }

      /* Event Container */
      .rbc-row-segment {
        padding: 1px 3px !important;
      }

      /* Agenda / List View in Apple Calendar Style */
      .rbc-agenda-view {
        border: 1px solid #e4e4e7 !important;
        border-radius: 1.25rem;
        overflow: hidden;
        flex: 1 1 0;
        background: transparent;
        display: flex;
        flex-direction: column;
      }
      .dark .rbc-agenda-view {
        border-color: #27272a !important;
      }

      /* Ensure both thead and tbody tables use fixed layout and identical widths */
      .rbc-agenda-table {
        width: 100% !important;
        table-layout: fixed !important;
        border-collapse: collapse !important;
        border: 0 !important;
      }

      /* Strip all vertical dividers between columns */
      .rbc-agenda-table thead > tr > th,
      .rbc-agenda-table tbody > tr > td,
      .rbc-agenda-table thead > tr > th + th,
      .rbc-agenda-table tbody > tr > td + td {
        border-left: 0 !important;
        border-right: 0 !important;
      }

      /* Column 1: DATA */
      .rbc-agenda-table thead > tr > th:nth-child(1),
      .rbc-agenda-table tbody > tr > td.rbc-agenda-date-cell {
        width: 180px !important;
        min-width: 180px !important;
        max-width: 180px !important;
        padding: 0.85rem 1.25rem !important;
        text-align: left !important;
        font-size: 0.82rem !important;
        font-weight: 600 !important;
        color: #18181b !important;
        white-space: nowrap;
      }
      .dark .rbc-agenda-table tbody > tr > td.rbc-agenda-date-cell {
        color: #f4f4f5 !important;
      }

      /* Column 2: GODZINA */
      .rbc-agenda-table thead > tr > th:nth-child(2),
      .rbc-agenda-table tbody > tr > td.rbc-agenda-time-cell {
        width: 140px !important;
        min-width: 140px !important;
        max-width: 140px !important;
        padding: 0.85rem 1.25rem !important;
        text-align: left !important;
        font-size: 0.8rem !important;
        font-weight: 500 !important;
        color: #71717a !important;
        white-space: nowrap;
        text-transform: capitalize;
      }
      .dark .rbc-agenda-table tbody > tr > td.rbc-agenda-time-cell {
        color: #a1a1aa !important;
      }

      /* Column 3: EGZAMIN */
      .rbc-agenda-table thead > tr > th:nth-child(3),
      .rbc-agenda-table tbody > tr > td.rbc-agenda-event-cell {
        width: auto !important;
        padding: 0.85rem 1.25rem !important;
        text-align: left !important;
        vertical-align: middle !important;
      }

      /* Table Header Styling */
      .rbc-agenda-table thead > tr > th {
        padding: 0.75rem 1.25rem !important;
        font-weight: 600 !important;
        font-size: 0.72rem !important;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #71717a !important;
        border-bottom: 1px solid #e4e4e7 !important;
        background: rgba(244, 244, 245, 0.5) !important;
      }
      .dark .rbc-agenda-table thead > tr > th {
        color: #a1a1aa !important;
        border-bottom-color: #27272a !important;
        background: rgba(39, 39, 42, 0.4) !important;
      }

      /* Row reset, dividers & smooth hover */
      .rbc-agenda-table tbody > tr {
        display: table-row !important;
        background-color: transparent !important;
        border-radius: 0 !important;
        border-bottom: 1px solid #f4f4f5 !important;
        transition: background-color 0.15s ease;
        cursor: pointer;
      }
      .dark .rbc-agenda-table tbody > tr {
        border-bottom-color: rgba(39, 39, 42, 0.6) !important;
      }
      .rbc-agenda-table tbody > tr:hover {
        background-color: rgba(244, 244, 245, 0.7) !important;
      }
      .dark .rbc-agenda-table tbody > tr:hover {
        background-color: rgba(39, 39, 42, 0.45) !important;
      }

      .rbc-agenda-empty {
        padding: 4rem 1.5rem !important;
        text-align: center;
        color: #71717a;
        font-size: 0.875rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .dark .rbc-agenda-empty {
        color: #a1a1aa;
      }
    `}</style>
  );
};
