import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';


const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const EventComponent = memo(({ event }) => (
  <span>
    {event.title}
  </span>
));

const Appointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAppointments = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      let endpoint = 'appointments';
      
      if (user.roles.includes('ROLE_DOCTOR')) {
        endpoint = `appointments/doctor/name/${user.username}`;
      } else if (user.roles.includes('ROLE_PATIENT')) {
        endpoint = `appointments/patient/name/${user.username}`;
      }

      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      
      // Transform appointments for calendar view
      const calendarEvents = data.map(appointment => ({
        id: appointment.id,
        title: `${appointment.patientName ? 'Patient: ' + appointment.patientName : ''}${appointment.doctorName ? ' Doctor: Dr. ' + appointment.doctorName : ''} - ${appointment.reason}`,
        start: new Date(appointment.startTime),
        end: new Date(new Date(appointment.startTime).getTime() + 60 * 60 * 1000), // 1 hour duration
        status: appointment.status,
      }));

      setAppointments(calendarEvents);
      setError(null);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err.message || 'Failed to load appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [user.roles, user.username]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, px: { xs: 0, sm: 2 } }}>
      <Paper sx={{ p: { xs: 1, sm: 3 } }}>
        <Typography variant="h4" gutterBottom>
          Appointments
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ width: '100%', overflowX: { xs: 'auto', sm: 'visible' } }}>
            <Calendar
              localizer={localizer}
              events={appointments}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 500 }}
              components={{ event: EventComponent }}
            />
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Appointments; 