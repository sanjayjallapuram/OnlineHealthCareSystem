import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';


const PatientDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openBooking, setOpenBooking] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [bookingData, setBookingData] = useState({
    doctorId: '',
    date: null,
    time: '',
    reason: '',
  });
  const navigate = useNavigate();
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [openRecordDialog, setOpenRecordDialog] = useState(false);
  const [videoCallError, setVideoCallError] = useState('');
  const [bookingValidationError, setBookingValidationError] = useState('');

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      // Fetch appointments using username
      const appointmentsResponse = await fetch(`${API_BASE_URL}/appointments/patient/name/${user.username}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      

      if (!appointmentsResponse.ok) {
        const errorText = await appointmentsResponse.text();
        throw new Error(`Failed to fetch appointments: ${errorText}`);
      }

      const data = await appointmentsResponse.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid appointments data format');
      }

      // Sort appointments by date and time
      const sortedAppointments = data.sort((a, b) => {
        const dateA = new Date(a.startTime || `${a.date}T${a.time}`);
        const dateB = new Date(b.startTime || `${b.date}T${b.time}`);
        return dateA - dateB;
      });


      // Add doctor details to each appointment
      const appointmentsWithDoctors = await Promise.all(sortedAppointments.map(async (appointment) => {
        try {
          const doctorUrl = `${API_BASE_URL}/doctor/${appointment.doctorId}`;
          
          const doctorResponse = await fetch(doctorUrl, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (doctorResponse.ok) {
            const doctorData = await doctorResponse.json();
            return {
              ...appointment,
              doctorName: doctorData.username || 'Unknown Doctor'
            };
          }
          return {
            ...appointment,
            doctorName: 'Unknown Doctor'
          };
        } catch (error) {
          return {
            ...appointment,
            doctorName: 'Unknown Doctor'
          };
        }
      }));


      // Fetch medical records for each appointment
      const appointmentsWithRecords = await Promise.all(appointmentsWithDoctors.map(async (appointment) => {
        try {
          const recordResponse = await fetch(`${API_BASE_URL}/medical-records/appointment/${appointment.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (recordResponse.ok) {
            const records = await recordResponse.json();
            return {
              ...appointment,
              medicalRecords: records
            };
          }
          return {
            ...appointment,
            medicalRecords: []
          };
        } catch (error) {
          return {
            ...appointment,
            medicalRecords: []
          };
        }
      }));

      setAppointments(appointmentsWithRecords);
    } catch (err) {
      setError(err.message || 'Failed to load appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [user.username]);

  // Add effect to log when appointments change
  useEffect(() => {
  }, [appointments]);

  const fetchDoctors = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/doctor`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch doctors');
      }

      const data = await response.json();
      
      // Ensure we have the correct data structure
      const formattedDoctors = data.map(doctor => {
        return {
          _id: doctor.id || doctor._id,
          fullName: doctor.fullName || doctor.username,
          username: doctor.username,
          specialty: doctor.specialty || doctor.speciality || 'General Medicine'
        };
      });
      
      setDoctors(formattedDoctors);
    } catch (err) {
      setError('Failed to load doctors');
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, [fetchAppointments, fetchDoctors]);

  const handleBookingSubmit = async () => {
    setBookingValidationError('');
    try {
      // Frontend validation for time and date
      if (!bookingData.date || !bookingData.time) {
        setBookingValidationError('Please select both date and time.');
        return;
      }

      if (!bookingData.doctorId) {
        setBookingValidationError('Please select a doctor.');
        return;
      }

      const selectedDate = new Date(bookingData.date);
      const [hour, minute] = bookingData.time.split(':').map(Number);
      selectedDate.setHours(hour, minute, 0, 0);
      
      // Add 5 minutes to current time for minimum appointment time
      const now = new Date();
      const minAppointmentTime = new Date(now.getTime() + 5 * 60000);

      // Check if appointment is at least 5 minutes in the future
      if (selectedDate < minAppointmentTime) {
        setBookingValidationError('Appointment must be at least 5 minutes in the future.');
        return;
      }

      // Check if appointment is during working hours (9 AM to 5 PM)
      if (hour < 9 || hour >= 17) {
        setBookingValidationError('Appointments must be between 9:00 AM and 5:00 PM.');
        return;
      }

      const token = localStorage.getItem('token');
      
      // Format date as YYYY-MM-DD without timezone issues
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      // Create the appointment data
      const appointmentData = {
        patientId: user.username,
        doctorId: bookingData.doctorId,
        time: bookingData.time,
        date: formattedDate,
        durationInMinutes: 30,
        reason: bookingData.reason,
        status: 'PENDING'
      };

      // Show loading state
      setLoading(true);

      // Make the API call
      const response = await fetch(`${API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to book appointment');
      }

      // Close the dialog and show success message immediately
      setOpenBooking(false);
      setSuccessMessage('Appointment booked successfully!');
      
      // Reset booking form
      setBookingData({
        doctorId: '',
        date: null,
        time: '',
        reason: '',
      });

      // Refresh appointments in the background
      fetchAppointments();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

    } catch (err) {
      setError(err.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to cancel appointment');
      }

      await fetchAppointments();
      setSuccessMessage('Appointment cancelled successfully');
    } catch (err) {
      setError('Failed to cancel appointment');
    }
  };

  const handleViewRecord = async (appointmentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/medical-records/appointment/${appointmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const records = await response.json();
        if (records && records.length > 0) {
          setSelectedRecord(records[0]);  // Show the most recent record
          setOpenRecordDialog(true);
        } else {
          setError('No medical records found for this appointment');
        }
      } else {
        throw new Error('Failed to fetch medical record');
      }
    } catch (err) {
      setError('Failed to load medical record');
    }
  };

  const handleJoinVideoCall = (appointment) => {
    // Navigate directly to video call room
    navigate(`/video-call/${appointment.id}?role=patient&userId=${user.id || user.username}&userName=${encodeURIComponent(user.username)}`);
  };

  const canCancelAppointment = (appointment) => {
    if (appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED') {
      return false;
    }
    
    // Get appointment date/time
    const appointmentDate = new Date(appointment.startTime);
    const now = new Date();
    
    // Can't cancel appointments less than 1 hour before
    const hourBeforeAppointment = new Date(appointmentDate.getTime() - (60 * 60 * 1000));
    return now < hourBeforeAppointment;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      case 'COMPLETED':
        return 'info';
      default:
        return 'warning';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const AppointmentRow = memo(({ appointment, handleViewRecord, canCancelAppointment, handleCancelAppointment, handleJoinVideoCall }) => {
    const appointmentDate = appointment.startTime 
      ? new Date(appointment.startTime)
      : new Date(`${appointment.date}T${appointment.time}`);
    return (
      <TableRow key={appointment.id}>
        <TableCell>
          Dr. {appointment.doctorName || 'Loading...'}
        </TableCell>
        <TableCell>
          {appointmentDate.toLocaleDateString()}
        </TableCell>
        <TableCell>
          {appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </TableCell>
        <TableCell>
          {appointment.durationInMinutes} minutes
        </TableCell>
        <TableCell>{appointment.reason}</TableCell>
        <TableCell>
          <Chip
            label={appointment.status}
            color={getStatusColor(appointment.status)}
            size="small"
          />
        </TableCell>
        <TableCell>
          {appointment.medicalRecords && appointment.medicalRecords.length > 0 && (
            <Button
              size="small"
              color="info"
              onClick={() => handleViewRecord(appointment.id)}
            >
              View Record
            </Button>
          )}
        </TableCell>
        <TableCell>
          {canCancelAppointment(appointment) && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => handleCancelAppointment(appointment.id)}
            >
              Cancel
            </Button>
          )}
          {appointment.status === 'CONFIRMED' && (
            <Button
              variant="contained"
              color="success"
              size="small"
              sx={{ ml: 1 }}
              onClick={() => handleJoinVideoCall(appointment)}
            >
              Start Video Call
            </Button>
          )}
        </TableCell>
      </TableRow>
    );
  });

  // Count summary for dashboard cards
  const summary = appointments.reduce(
    (acc, appt) => {
      acc.total++;
      if (appt.status === 'CONFIRMED') acc.upcoming++;
      if (appt.status === 'COMPLETED') acc.completed++;
      if (appt.status === 'CANCELLED') acc.cancelled++;
      return acc;
    },
    { total: 0, upcoming: 0, completed: 0, cancelled: 0 }
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, px: { xs: 0, sm: 2 } }}>
      {/* Dashboard Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}>
          <Paper elevation={4} sx={{ p: 3, borderRadius: 3, bgcolor: 'primary.light', color: 'primary.contrastText', boxShadow: 2 }}>
            <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Upcoming</Typography>
            <Typography variant="h4" fontWeight={700}>{summary.upcoming}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper elevation={4} sx={{ p: 3, borderRadius: 3, bgcolor: 'success.light', color: 'success.contrastText', boxShadow: 2 }}>
            <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Completed</Typography>
            <Typography variant="h4" fontWeight={700}>{summary.completed}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper elevation={4} sx={{ p: 3, borderRadius: 3, bgcolor: 'error.light', color: 'error.contrastText', boxShadow: 2 }}>
            <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Cancelled</Typography>
            <Typography variant="h4" fontWeight={700}>{summary.cancelled}</Typography>
          </Paper>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: { xs: 1, sm: 3 }, borderRadius: 3, boxShadow: 3 }}>
            <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={4} gap={3}>
              <Typography variant="h4" gutterBottom sx={{ mb: { xs: 2, sm: 0 } }}>
                Welcome, {user?.username}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 3, alignItems: 'center', width: '100%' }}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={fetchAppointments}
                  sx={{ px: 3, py: 1 }}
                >
                  Refresh
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setOpenBooking(true)}
                  sx={{ px: 3, py: 1 }}
                >
                  Book Appointment
                </Button>
              </Box>
            </Box>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {successMessage && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {successMessage}
              </Alert>
            )}

            <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
              Your Appointments
            </Typography>
            
            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ width: '100%', overflowX: { xs: 'auto', sm: 'visible' } }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Doctor</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell>Duration</TableCell>
                        <TableCell>Reason</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Medical Record</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {appointments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            No appointments found
                          </TableCell>
                        </TableRow>
                      ) : (
                        appointments.map((appointment) => (
                          <AppointmentRow
                            key={appointment.id}
                            appointment={appointment}
                            handleViewRecord={handleViewRecord}
                            canCancelAppointment={canCancelAppointment}
                            handleCancelAppointment={handleCancelAppointment}
                            handleJoinVideoCall={handleJoinVideoCall}
                          />
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Booking Dialog */}
      <Dialog open={openBooking} onClose={() => {
        setOpenBooking(false);
        setBookingData({
          doctorId: '',
          date: null,
          time: '',
          reason: '',
        });
      }} maxWidth="sm" fullWidth>
        <DialogTitle>Book an Appointment</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {bookingValidationError && (
              <Alert severity="error" sx={{ mb: 2 }}>{bookingValidationError}</Alert>
            )}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Doctor</InputLabel>
              <Select
                value={bookingData.doctorId || ''}
                onChange={(e) => {
                  const selectedDoctorId = e.target.value;
                  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId || d._id === selectedDoctorId);
                  setBookingData(prev => ({
                    ...prev,
                    doctorId: selectedDoctorId
                  }));
                }}
                label="Doctor"
                error={!bookingData.doctorId && bookingValidationError}
              >
                {doctors && doctors.length > 0 ? (
                  doctors.map((doctor) => {
                    const doctorId = doctor.id || doctor._id;
                    const doctorName = doctor.username || doctor.fullName;
                    const doctorSpecialty = doctor.specialty;
                    return (
                      <MenuItem key={doctorId} value={doctorId}>
                        Dr. {doctorName} - {doctorSpecialty}
                      </MenuItem>
                    );
                  })
                ) : (
                  <MenuItem disabled>No doctors available</MenuItem>
                )}
              </Select>
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Date"
                value={bookingData.date}
                onChange={(newDate) => setBookingData({ ...bookingData, date: newDate })}
                minDate={new Date()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: 'normal'
                  }
                }}
              />
            </LocalizationProvider>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Time</InputLabel>
              <Select
                value={bookingData.time}
                onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                label="Time"
              >
                <MenuItem value="09:00">09:00 AM</MenuItem>
                <MenuItem value="10:00">10:00 AM</MenuItem>
                <MenuItem value="11:00">11:00 AM</MenuItem>
                <MenuItem value="12:00">12:00 AM</MenuItem>
                <MenuItem value="14:00">02:00 PM</MenuItem>
                <MenuItem value="15:00">03:00 PM</MenuItem>
                <MenuItem value="16:00">04:00 PM</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Reason for Visit"
              multiline
              rows={4}
              value={bookingData.reason}
              onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenBooking(false);
            setBookingData({
              doctorId: '',
              date: null,
              time: '',
              reason: '',
            });
          }}>Cancel</Button>
          <Button
            onClick={handleBookingSubmit}
            variant="contained"
            disabled={!bookingData.doctorId || !bookingData.date || !bookingData.time || !bookingData.reason}
          >
            Book Appointment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Medical Record Dialog */}
      <Dialog
        open={openRecordDialog}
        onClose={() => setOpenRecordDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Medical Record
          <Typography variant="subtitle2" color="text.secondary">
            {selectedRecord && formatDate(selectedRecord.createdAt)}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold">Diagnosis</Typography>
                <Typography>{selectedRecord.diagnosis}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold">Symptoms</Typography>
                <Typography>{selectedRecord.symptoms || 'Not specified'}</Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold">Notes</Typography>
                <Typography>{selectedRecord.notes || 'No notes'}</Typography>
              </Grid>

              {selectedRecord.medications && selectedRecord.medications.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold">Medications</Typography>
                  {selectedRecord.medications.map((med, index) => (
                    <Typography key={index}>
                      • {med.name} - {med.dosage}, {med.frequency}, {med.duration}
                    </Typography>
                  ))}
                </Grid>
              )}

              {selectedRecord.vitalSigns && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold">Vital Signs</Typography>
                  <Typography>
                    Temperature: {selectedRecord.vitalSigns.temperature}°C
                    <br />
                    Blood Pressure: {selectedRecord.vitalSigns.bloodPressureSystolic}/{selectedRecord.vitalSigns.bloodPressureDiastolic} mmHg
                    <br />
                    Heart Rate: {selectedRecord.vitalSigns.heartRate} bpm
                    <br />
                    Respiratory Rate: {selectedRecord.vitalSigns.respiratoryRate} breaths/min
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRecordDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Video Call Error Dialog */}
      <Dialog open={!!videoCallError} onClose={() => setVideoCallError('')}>
        <DialogTitle>Video Call Unavailable</DialogTitle>
        <DialogContent>
          <Typography>{videoCallError}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVideoCallError('')}>OK</Button>
        </DialogActions>
      </Dialog>

      
    </Container>
  );
};

export default PatientDashboard; 