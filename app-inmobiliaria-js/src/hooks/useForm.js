import { useState } from 'react';

const useForm = (initialValues, callback) => {
    const [values, setValues] = useState(initialValues);
    
    const handleChange = (event) => {
        const { name, value } = event.target;
        setValues({
            ...values,
            [name]: value,
        });
    };

    const handleSubmit = (callback) => (event) => {
        event.preventDefault();
        callback();
    };

    return {
        values,
        handleChange,
        handleSubmit,
    };
};

export default useForm;