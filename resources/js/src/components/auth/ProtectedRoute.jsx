import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { fetchAuthUser } from 'store/slices/authSlice';
import { hasPermission } from 'utils/access';

export default function ProtectedRoute({ children, permission }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchAuthUser());
    }
  }, [dispatch, token, user]);

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (user && !hasPermission(user, permission)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node,
  permission: PropTypes.string
};
