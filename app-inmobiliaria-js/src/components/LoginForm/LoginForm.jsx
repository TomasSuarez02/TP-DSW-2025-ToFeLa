import styles from './LoginForm.module.css';

const LoginForm = ({values, handleChange, handleSubmit, isLoading}) => {
	if (isLoading) return <div className={styles.loading}>Loading...</div>

	return (
		<div className={styles.loginpage}>
			<h1>Login Page</h1>
 			<form onSubmit={handleSubmit} className={styles.form}> 
				<div className={styles.formgroup}>
					<label htmlFor='email'>Email</label>
					<input type='email' id='email' name='email' required value={values.email} onChange={handleChange}/>
				</div>
				<div className={styles.formgroup}>
					<label htmlFor='password'>Password</label>
					<input type='password' id='password' name='password' required value={values.password} onChange={handleChange}/>
				</div>
				<button className={styles.submitButton} type='submit'>Login</button>
			</form>
 		</div>
	);
};

export default LoginForm;