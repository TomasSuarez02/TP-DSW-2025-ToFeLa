import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks";

const PrivateRouter = ({children}) => {
    const {isLogged, isLoading} = useAuth();
    
    if (isLoading) return <div>Loading...</div>;

    if (!isLogged) return <Navigate to='/' />;

    return children;
};

export default PrivateRouter;