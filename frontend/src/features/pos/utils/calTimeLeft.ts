export const normalizeDate = (raw: string) => {
    return raw.replace(" ", "T").split(".")[0];
};

export const calcTimeLeftFromOrderTime = (orderTime: string, ttlSec = 300) => {
    const normalized = normalizeDate(orderTime);
    const created = new Date(normalized).getTime();
    const expired = created + ttlSec * 1000;

    return Math.max(0, Math.floor((expired - Date.now()) / 1000));
};