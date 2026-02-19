export const encryptPath = (path: string): string => {
    return btoa(path);
}

export const decryptPath = (encrypted: string): string => {
    try {
        return atob(encrypted);
    } catch (error) {
        console.error('Decryption failed:', error);
        return '';
    }
}