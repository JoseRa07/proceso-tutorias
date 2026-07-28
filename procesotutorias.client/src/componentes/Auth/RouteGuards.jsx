import { Navigate, Outlet, useLocation } from "react-router-dom";

import { AUTHENTICATED_ROLES, useAuthSession } from "../../auth/session";

export function RequireAuth({ allowedRoles = AUTHENTICATED_ROLES }) {
    const location = useLocation();
    const session = useAuthSession();

    if (!session) {
        return <Navigate to="/" replace state={{ from: location }} />;
    }

    if (!allowedRoles.includes(session.user.id_rol)) {
        return <Navigate to="/Panel" replace />;
    }

    return <Outlet />;
}

export function PublicOnlyRoute() {
    const session = useAuthSession();
    return session ? <Navigate to="/Panel" replace /> : <Outlet />;
}

export function RouteFallback() {
    const session = useAuthSession();
    return <Navigate to={session ? "/Panel" : "/"} replace />;
}
