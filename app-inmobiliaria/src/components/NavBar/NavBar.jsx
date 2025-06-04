"use client";
import React from 'react';
import styles from './NavBar.module.css';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../hooks';
import { useNavigate, NavLink } from 'react-router-dom';

const NavBar = ({}) => {
	const {onLogout} = useAuth();
	const navigate = useNavigate();

	const handleClick = () => {
		onLogout();
		navigate('/');
	} 

	const {toggleTheme} = useTheme();

	return (
		<div className={styles.navbar}>
 			<button className={styles.button} type='button' onClick={handleClick}>Logout</button>
			<nav>
				<NavLink to='/home' activeclassname='active' className={styles.links}>Home</NavLink>
			</nav>
			<button className={styles.button} type='button' onClick={toggleTheme}>Theme</button>
 		</div>
	);
};

export default NavBar;