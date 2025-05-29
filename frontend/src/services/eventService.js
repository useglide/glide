import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Service for managing calendar events in Firestore
 */
export class EventService {
  constructor() {
    this.collectionName = 'calendar_events';
  }

  /**
   * Create a new event
   * @param {Object} eventData - Event data
   * @param {string} userId - User ID
   * @returns {Promise<string>} Document ID of created event
   */
  async createEvent(eventData, userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const event = {
        ...eventData,
        user_id: userId,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.collectionName), event);
      return docRef.id;
    } catch (error) {
      console.error('Error creating event:', error);
      throw new Error('Failed to create event: ' + error.message);
    }
  }

  /**
   * Update an existing event
   * @param {string} eventId - Event ID
   * @param {Object} eventData - Updated event data
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async updateEvent(eventId, eventData, userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const eventRef = doc(db, this.collectionName, eventId);
      const updateData = {
        ...eventData,
        updated_at: serverTimestamp()
      };

      await updateDoc(eventRef, updateData);
    } catch (error) {
      console.error('Error updating event:', error);
      throw new Error('Failed to update event: ' + error.message);
    }
  }

  /**
   * Delete an event
   * @param {string} eventId - Event ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async deleteEvent(eventId, userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const eventRef = doc(db, this.collectionName, eventId);
      await deleteDoc(eventRef);
    } catch (error) {
      console.error('Error deleting event:', error);
      throw new Error('Failed to delete event: ' + error.message);
    }
  }

  /**
   * Get all events for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of events
   */
  async getUserEvents(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // First try a simple query without orderBy to check permissions
      const simpleQuery = query(
        collection(db, this.collectionName),
        where('user_id', '==', userId)
      );

      const querySnapshot = await getDocs(simpleQuery);
      const events = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by created_at on the client side if needed
      return events.sort((a, b) => {
        if (!a.created_at || !b.created_at) return 0;
        const aTime = a.created_at.toDate ? a.created_at.toDate() : new Date(a.created_at);
        const bTime = b.created_at.toDate ? b.created_at.toDate() : new Date(b.created_at);
        return bTime - aTime; // Descending order
      });
    } catch (error) {
      console.error('Error getting user events:', error);

      // If it's a permissions error, provide more helpful message
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied. Please check Firestore security rules for calendar_events collection.');
      }

      throw new Error('Failed to get events: ' + error.message);
    }
  }

  /**
   * Subscribe to real-time updates for user events
   * @param {string} userId - User ID
   * @param {Function} callback - Callback function to handle updates
   * @returns {Function} Unsubscribe function
   */
  subscribeToUserEvents(userId, callback) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Use simple query without orderBy to avoid index issues
      const q = query(
        collection(db, this.collectionName),
        where('user_id', '==', userId)
      );

      return onSnapshot(q, (querySnapshot) => {
        const events = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Sort by created_at on the client side
        const sortedEvents = events.sort((a, b) => {
          if (!a.created_at || !b.created_at) return 0;
          const aTime = a.created_at.toDate ? a.created_at.toDate() : new Date(a.created_at);
          const bTime = b.created_at.toDate ? b.created_at.toDate() : new Date(b.created_at);
          return bTime - aTime; // Descending order
        });

        callback(sortedEvents);
      }, (error) => {
        console.error('Error in events subscription:', error);

        // Provide more helpful error message for permissions
        if (error.code === 'permission-denied') {
          const permissionError = new Error('Permission denied. Please check Firestore security rules for calendar_events collection.');
          permissionError.code = 'permission-denied';
          callback([], permissionError);
        } else {
          callback([], error);
        }
      });
    } catch (error) {
      console.error('Error subscribing to events:', error);
      throw new Error('Failed to subscribe to events: ' + error.message);
    }
  }

  /**
   * Convert Firestore event to FullCalendar format
   * @param {Object} firestoreEvent - Event from Firestore
   * @returns {Object} FullCalendar formatted event
   */
  formatEventForCalendar(firestoreEvent) {
    const event = {
      id: firestoreEvent.id,
      title: firestoreEvent.title,
      backgroundColor: firestoreEvent.color || '#3b82f6',
      borderColor: firestoreEvent.color || '#3b82f6',
      extendedProps: {
        description: firestoreEvent.description,
        user_id: firestoreEvent.user_id,
        created_at: firestoreEvent.created_at,
        updated_at: firestoreEvent.updated_at
      }
    };

    // Handle start date/time
    if (firestoreEvent.start) {
      if (firestoreEvent.start.toDate) {
        // Firestore Timestamp
        event.start = firestoreEvent.start.toDate().toISOString();
      } else {
        // String date
        event.start = firestoreEvent.start;
      }
    }

    // Handle end date/time
    if (firestoreEvent.end) {
      if (firestoreEvent.end.toDate) {
        // Firestore Timestamp
        event.end = firestoreEvent.end.toDate().toISOString();
      } else {
        // String date
        event.end = firestoreEvent.end;
      }
    }

    // If no end time, make it an all-day event
    if (!event.end && event.start) {
      event.allDay = true;
    }

    return event;
  }

  /**
   * Convert FullCalendar event to Firestore format
   * @param {Object} calendarEvent - Event from FullCalendar
   * @returns {Object} Firestore formatted event
   */
  formatEventForFirestore(calendarEvent) {
    const event = {
      title: calendarEvent.title,
      description: calendarEvent.description || '',
      color: calendarEvent.color || '#3b82f6'
    };

    // Handle start date/time
    if (calendarEvent.start) {
      event.start = new Date(calendarEvent.start);
    }

    // Handle end date/time
    if (calendarEvent.end) {
      event.end = new Date(calendarEvent.end);
    }

    return event;
  }
}

// Export singleton instance
export const eventService = new EventService();
