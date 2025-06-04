import styles from './PublicLayout.module.css';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const PublicLayout = () => {
	const {theme} = useTheme();

	return (
		<div className={`${styles.publiclayout} && ${theme}`}><Outlet/></div>
	);
};

export default PublicLayout;