export function parseJWT(token) {
    try {
        return JSON.parse(atob(token.split(".")[1]));
    } catch {
        return {};
    }
}

export function getTokenExpiryMs(token) {
    const payload = parseJWT(token);
    return payload.exp ? payload.exp * 1000 : null;
}

export function isTokenExpired(token) {
    const expiryMs = getTokenExpiryMs(token);
    return expiryMs !== null && expiryMs <= Date.now();
}
