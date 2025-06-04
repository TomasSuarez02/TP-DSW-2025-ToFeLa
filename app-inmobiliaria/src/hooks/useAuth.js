import { useEffect, useState } from 'react';

const useAuth = () => {
    const [isLogged, setIsLogged] = useState(false); 
    const [isLoading, setIsLoading] = useState(true);

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)); 

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (token) {
            setIsLogged(true);
        } else {
            setIsLogged(false);
        };

        setIsLoading(false);
    }, []);

    const onLogin = async () => {
        setIsLoading(true);
        await sleep(2000);
        let fakeToken = '112233';
        localStorage.setItem('token', fakeToken);
        setIsLogged(true);
        setIsLoading(false);
    };

    const onLogout = async () => {
        localStorage.removeItem('token');
        setIsLogged(false)
    };
    
    return {
        isLogged,
        isLoading,
        onLogin,
        onLogout,
    };
} 

export default useAuth;