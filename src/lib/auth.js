export const USER_STORAGE_KEY = 'farma_user';

export const getCurrentUser = () => {
    try {
        const raw = localStorage.getItem(USER_STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

export const isAuthenticated = () => Boolean(getCurrentUser());

export const hasAnyRole = (allowedRoles = []) => {
    if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) return true;
    const user = getCurrentUser();
    if (!user?.role) return false;
    return allowedRoles.includes(user.role);
};

export const logout = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
};
