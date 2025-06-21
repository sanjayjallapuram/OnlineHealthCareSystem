import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthRedirect = ({ children }) => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && user) {
            // If user is already authenticated, redirect based on role
            if (user.roles.includes('ROLE_DOCTOR')) {
                navigate('/doctor-dashboard');
            } else if (user.roles.includes('ROLE_PATIENT')) {
                navigate('/patient-dashboard');
            }
        }
    }, [user, loading, navigate]);

    // If loading, you might want to show a loading spinner
    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh' 
            }}>
                Loading...
            </div>
        );
    }

    // If not authenticated, show the children (login/register form)
    return !user ? children : null;
};

export default AuthRedirect; 