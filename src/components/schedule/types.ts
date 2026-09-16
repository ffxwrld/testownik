import { SavedSessionMetadata } from '../../models/types';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: SavedSessionMetadata;
}
