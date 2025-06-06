import styles from './LoginPage.module.css';
import { LoginContainer } from '../../containers';

const LoginPage = () => {
	return (
		<div className={styles.loginpage}>
			<LoginContainer/>
		</div>
	);
};

export default LoginPage;