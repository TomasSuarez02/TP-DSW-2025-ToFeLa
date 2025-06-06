import React from "react";
import { useForm, useAuth } from '../hooks'
import { LoginForm } from '../components';
import { Navigate, useNavigate } from "react-router-dom";

const LoginContainer = () => {
	const navigate = useNavigate();
	const {values, handleChange, handleSubmit} = useForm({email: '', password: ''});
	const {isLogged, isLoading, onLogin} = useAuth();

	if (isLogged) return <Navigate to='/home'/>

	const submitForm = async () => {
		await onLogin();
		navigate('/home');
	};
    
    return <LoginForm 
        values={values} 
        handleChange={handleChange} 
        handleSubmit={handleSubmit(submitForm)} 
        isLoading={isLoading}
    ></LoginForm>;
};

export default LoginContainer;