import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';

const Message = styled.div`
  text-align: center;
  margin-top: 5rem;
  font-size: 1.25rem;
  font-weight: bold;
`;

const Callback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const error = queryParams.get('error');
    const code = queryParams.get('code');
    const PLATFORM = import.meta.env.VITE_DEPLOY_PLATFORM; // 'VERCEL' or 'CLOUDFLARE'

    // Handle access denied error
    if (error === 'access_denied') {
      setErrorMessage('Authorization revoked. Please click "Authorize" to grant access.');
      navigate('/', { replace: true });
      return;
    }

    const apiEndpoint = PLATFORM === 'VERCEL' ? '/api/exchange-token' : '/exchange-token';

    if (code) {
      axios.post(apiEndpoint, { code })
        .then((response) => {
          console.log('Token exchange response:', response.data);
          localStorage.setItem('accessToken', response.data.accessToken);
          navigate('/profile');
          window.location.reload();
        })
        .catch((error) => {
          const errMsg = error.response?.data?.error || 'Error logging in :(';
          console.error('Error in token exchange:', error);
          setErrorMessage(errMsg);
          navigate('/', { replace: true });
        });
    }
  }, [location, navigate]);

  return (
    <Message>{errorMessage ? `${errorMessage}` : 'Logging in...'}</Message>
  );
};

export default Callback;
