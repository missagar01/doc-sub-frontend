import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { getDbPageString, getPathFromDbString } from '../utils/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'user' | 'employee')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [] 
}) => {
  const { isAuthenticated, currentUser: user } = useAuthStore();
  const location = useLocation();

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    // Redirect to home page if user doesn't have permission
    return <Navigate to="/" replace />;
  }

  // Check page-level permissions for all dynamic routes including the root dashboard
  if (user && location.pathname !== '/login') {
    const path = location.pathname;
    const pageAccess = user.pageAccess || [];
    
    const dbPageString = getDbPageString(path);
    const systemString = dbPageString.split('/')[0];
    
    if (!pageAccess.includes(dbPageString) && !pageAccess.includes(systemString)) {
      // User does not have access to this page based on strict DB rules
      
      // If they are trying to access dashboard directly but don't have access,
      // redirect them to the first accessible page they have.
      if (dbPageString === 'Dashboard') {
        if (pageAccess.length > 0) {
          const firstAccessiblePath = getPathFromDbString(pageAccess[0]);
          if (firstAccessiblePath && firstAccessiblePath !== '/') {
             return <Navigate to={firstAccessiblePath} replace />;
          }
        }
      }
      
      // Otherwise, redirect to Dashboard if they have dashboard access, else their first page.
      if (pageAccess.includes('Dashboard') && location.pathname !== '/') {
          return <Navigate to="/" replace />;
      } else if (pageAccess.length > 0) {
          const firstAccessiblePath = getPathFromDbString(pageAccess[0]);
          if (firstAccessiblePath && firstAccessiblePath !== location.pathname) {
             return <Navigate to={firstAccessiblePath} replace />;
          }
      }
      
      // Prevent redirect loops, if no pages accessible, redirect to login
      if (location.pathname !== '/login') {
         return <Navigate to="/login" replace />;
      }
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;