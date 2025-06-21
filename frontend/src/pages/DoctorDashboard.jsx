import React, { useState, useEffect, memo, useCallback } from 'react';
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
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';


const DoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [openRecordDialog, setOpenRecordDialog] = useState(false);
  const [videoCallError, setVideoCallError] = useState('');

  const fetchAppointments = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/appointments/doctor/name/${user.username}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      
      // Fetch medical records for each appointment
      const appointmentsWithRecords = await Promise.all(data.map(async (appointment) => {
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

      console.log('Fetched appointments:', appointmentsWithRecords);
      setAppointments(appointmentsWithRecords);
    } catch (err) {
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [user.username]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleStatusUpdate = async (appointmentId, status) => {
    try {
      const token = localStorage.getItem('token');
      let method = 'POST';
      
      if (status.toLowerCase() === 'cancel') {
        method = 'PUT';
      }
      
      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/${status.toLowerCase()}`, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to update appointment status');
      }

      await fetchAppointments();
    } catch (err) {
      setError('Failed to update appointment status');
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
    navigate(`/video-call/${appointment.id}?role=doctor&userId=${user.id || user.username}&userName=${encodeURIComponent(user.username)}`);
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

  const AppointmentRow = memo(({ appointment, handleViewRecord, handleStatusUpdate, handleJoinVideoCall, getStatusColor, navigate }) => {
    return (
      <TableRow key={appointment.id}>
        <TableCell>{appointment.patientName || 'Unknown Patient'}</TableCell>
        <TableCell>{new Date(appointment.startTime).toLocaleDateString()}</TableCell>
        <TableCell>{new Date(appointment.startTime).toLocaleTimeString()}</TableCell>
        <TableCell>{appointment.reason}</TableCell>
        <TableCell>
          <Chip
            label={appointment.status}
            color={getStatusColor(appointment.status)}
            size="small"
          />
        </TableCell>
        <TableCell>
          {appointment.medicalRecords && appointment.medicalRecords.length > 0 ? (
            <Button
              size="small"
              color="info"
              onClick={() => handleViewRecord(appointment.id)}
            >
              View Record
            </Button>
          ) : (
            appointment.status === 'CONFIRMED' && (
              <Button
                size="small"
                color="primary"
                onClick={() => {
                  navigate(`/add-medical-record/${appointment.id}`, {
                    state: { returnTo: '/doctor-dashboard' }
                  });
                }}
              >
                Add Record
              </Button>
            )
          )}
        </TableCell>
        <TableCell>
          {appointment.status === 'PENDING' && (
            <>
              <Button
                size="small"
                color="success"
                onClick={() => handleStatusUpdate(appointment.id, 'CONFIRM')}
                sx={{ mr: 1 }}
              >
                Confirm
              </Button>
              <Button
                size="small"
                color="error"
                onClick={() => handleStatusUpdate(appointment.id, 'CANCEL')}
              >
                Cancel
              </Button>
            </>
          )}
          {appointment.status === 'CONFIRMED' && (
            <>
              <Button
                size="small"
                color="info"
                onClick={() => handleStatusUpdate(appointment.id, 'COMPLETE')}
                sx={{ mr: 1 }}
              >
                Complete
              </Button>
              <Button
                size="small"
                color="success"
                variant="contained"
                onClick={() => handleJoinVideoCall(appointment)}
              >
                Start Video Call
              </Button>
            </>
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
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
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
            <Typography variant="h4" gutterBottom>
              Welcome, Dr. {user?.username}
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Your Appointments
            </Typography>
            <Box sx={{ width: '100%', overflowX: { xs: 'auto', sm: 'visible' } }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Patient Name</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Time</TableCell>
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
                          handleStatusUpdate={handleStatusUpdate}
                          handleJoinVideoCall={handleJoinVideoCall}
                          getStatusColor={getStatusColor}
                          navigate={navigate}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Medical Record Dialog */}
      <Dialog
        open={openRecordDialog}
        onClose={() => setOpenRecordDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <div>
              Medical Record
              <Typography variant="subtitle2" component="span" color="text.secondary">
                {selectedRecord && formatDate(selectedRecord.createdAt)}
              </Typography>
            </div>
          </Box>
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

export default DoctorDashboard;

