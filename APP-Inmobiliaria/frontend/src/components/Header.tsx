import React from 'react';
import './Header.css';

const Header: React.FC = () => (
	<header className="header">
		<img src="/assets/logo.png" alt="Logo" className="logo" />
		<nav>
			<ul className="menu">
				<li><a href="#">Inicio</a></li>
				<li><a href="#">Propiedades</a></li>
				<li><a href="#">Contacto</a></li>
			</ul>
		</nav>
	</header>
);

export default Header;
